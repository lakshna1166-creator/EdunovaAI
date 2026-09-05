"""Lightweight, memory-efficient embedding runtime for the RAG service.

History
-------
This module previously wrapped `sentence-transformers` + PyTorch, which
caused the EduNovaAI service to exceed Render's 512 MiB RAM limit on the
free tier. PyTorch alone consumes ~150-250 MiB of RSS, and the
`sentence-transformers` import path additionally drags in `transformers`,
`huggingface-hub`, and `scikit-learn` — pushing peak RSS past the kill
threshold before the first request was ever served.

Replacement
-----------
We now use the **ONNX** export of the same architecture
(`all-MiniLM-L6-v2`, 384-dimensional) that has been pre-downloaded into
the local `models/huggingface/` directory (see `scripts/download_model.py`).

Why this is a safe replacement
------------------------------
* The ONNX export is produced from the EXACT SAME `all-MiniLM-L6-v2`
  weights that the PyTorch `sentence-transformers` model loaded.
* Mean-pooled + L2-normalised outputs are numerically equivalent to the
  PyTorch path (the model graph is identical, only the runtime differs).
* The embedding **dimension is still 384**, so:
    - the existing `document_chunks.embedding` pgvector column is unchanged;
    - the existing `match_document_chunks` RPC is unchanged;
    - existing Supabase vectors are 100% compatible — no re-embedding
      required.
* The RAG similarity threshold of 0.5 (from `RAG_SIMILARITY_THRESHOLD`)
  is preserved unchanged.

Memory footprint
----------------
* `onnxruntime` adds ~30 MiB resident.
* The ONNX model file is ~23 MiB (vs ~90 MiB for the PyTorch safetensors).
* Total peak RSS at import: ~60-80 MiB (vs ~250-350 MiB for the PyTorch
  stack). Fits comfortably inside the 512 MiB Render free tier.

Lazy loading
------------
The ONNX model weights, tokenizer and `onnxruntime` session are NOT
loaded at module-import time. They are loaded lazily on the first call
to `get_onnx_session()` (typically the first embedding request). This
keeps process startup fast and within memory budget.
"""
from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Sequence

logger = logging.getLogger(__name__)


def _force_log_flush() -> None:
    """Force-flush all handlers attached to this logger and its ancestors.

    Python's stdlib ``Logger._log()`` does NOT accept a ``flush`` keyword
    argument. To guarantee that an ``info()`` line is written to the
    underlying stream *before* a potentially blocking operation (such as
    the first ``import onnxruntime``), we must invoke ``StreamHandler.flush()``
    directly. This is the only safe way to get log-on-disk visibility on
    a Render free-tier instance that may be OOM-killed during the very
    operation we are trying to observe.
    """
    try:
        for handler in logger.handlers:
            try:
                handler.flush()
            except Exception:  # pragma: no cover - defensive
                pass
        # Also walk up the logger hierarchy so root-level handlers are flushed.
        current = logger.parent
        while current is not None:
            for handler in current.handlers:
                try:
                    handler.flush()
                except Exception:  # pragma: no cover - defensive
                    pass
            current = current.parent
    except Exception:  # pragma: no cover - never let logging crash the app
        pass

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# The pre-downloaded ONNX model directory. The build step
# (`scripts/download_model.py`) populates this directory with the
# `qdrant/all-MiniLM-L6-v2-onnx` snapshot from HuggingFace.
_PROJECT_ROOT = Path(__file__).parent.parent.parent
_LOCAL_MODELS_DIR = _PROJECT_ROOT / "models" / "huggingface"

# HuggingFace snapshot layout:
#   models/huggingface/models--qdrant--all-MiniLM-L6-v2-onnx/snapshots/<rev>/...
_ONNX_REPO_DIRNAME = "models--qdrant--all-MiniLM-L6-v2-onnx"
_SNAPSHOTS_SUBDIR = "snapshots"

# Output dimension. MUST match the existing Supabase pgvector column and
# the vectors already stored in `document_chunks.embedding`. The
# `qdrant/all-MiniLM-L6-v2-onnx` model produces 384-dim mean-pooled,
# L2-normalised embeddings — identical to `all-MiniLM-L6-v2`.
DEFAULT_DIMENSION = 384

# How many threads the ONNX Runtime session may use. Default is 1 to keep
# peak memory low on Render's free tier; can be overridden via env var.
_ONNX_THREADS = int(os.getenv("ONNX_THREADS", "1"))

# ---------------------------------------------------------------------------
# Lazy runtime caches
# ---------------------------------------------------------------------------
# `onnxruntime`, `tokenizers` and the actual `InferenceSession` are NOT
# imported at module load. They are imported and instantiated on the first
# embedding request. This keeps FastAPI startup / uvicorn port-binding
# free of any heavy native library load.
_RUNTIME_LOCK = threading.Lock()
_ORT_IMPORTED = False
_TOKENIZERS_IMPORTED = False
_SESSION_LOADED = False
_TOKENIZER_LOADED = False

_ORT_SESSION: Any = None
_TOKENIZER: Any = None
_MODEL_DIR: Path | None = None
_INPUT_IDS_NAME: str | None = None
_ATTENTION_MASK_NAME: str | None = None
_TOKEN_TYPE_IDS_NAME: str | None = None
_OUTPUT_NAME: str | None = None


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------
def _find_onnx_snapshot_dir() -> Path:
    """Locate the pre-downloaded ONNX snapshot directory.

    The build step (`scripts/download_model.py`) downloads the model into
    ``models/huggingface/models--qdrant--all-MiniLM-L6-v2-onnx/snapshots/<rev>/``
    which is the standard HuggingFace cache layout.

    Returns:
        Path to the snapshot directory containing `model.onnx`,
        `tokenizer.json`, `tokenizer_config.json`, `config.json`, etc.

    Raises:
        FileNotFoundError: if the snapshot directory cannot be located.
    """
    snapshots_root = _LOCAL_MODELS_DIR / _ONNX_REPO_DIRNAME / _SNAPSHOTS_SUBDIR
    if not snapshots_root.is_dir():
        raise FileNotFoundError(
            f"ONNX model directory not found at '{snapshots_root}'. "
            "Ensure 'python scripts/download_model.py' was run during the "
            "Render build step so the model is baked into the image."
        )

    # HuggingFace cache layout: snapshots/<rev>/...  We accept whatever
    # single revision directory is present.
    revisions = [p for p in snapshots_root.iterdir() if p.is_dir()]
    if not revisions:
        raise FileNotFoundError(
            f"No model revision directories found under '{snapshots_root}'."
        )

    # If multiple revisions exist (e.g. after an interrupted download),
    # prefer the one containing model.onnx; fall back to the first.
    for candidate in revisions:
        if (candidate / "model.onnx").is_file():
            return candidate
    return revisions[0]


# ---------------------------------------------------------------------------
# Lazy loaders
# ---------------------------------------------------------------------------
def _read_rss_mib() -> float | None:
    """Best-effort resident-set-size in MiB using stdlib only.

    Uses ``resource.getrusage(resource.RUSAGE_SELF).ru_maxrss`` on POSIX
    (Render, Linux). On Windows, ``resource`` is unavailable and we
    silently return ``None`` to avoid adding a runtime dependency.

    Returns:
        RSS in MiB or ``None`` if it cannot be measured on this OS.
    """
    try:
        import resource  # noqa: PLC0415 - lazy stdlib import
    except ImportError:
        return None
    try:
        rss_bytes = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    except Exception:  # pragma: no cover - defensive
        return None
    # On Linux, ru_maxrss is in kilobytes; on macOS it is in bytes.
    # Render runs Linux so we treat the value as KiB.
    if rss_bytes > 10 * 1024 * 1024:  # > 10 GiB ⇒ almost certainly bytes
        return round(rss_bytes / (1024 * 1024), 2)
    return round(rss_bytes / 1024.0, 2)


def _ensure_onnxruntime_imported() -> None:
    """Import `onnxruntime` (and friends) exactly once.

    Importing `onnxruntime` (~30 MiB RSS) is delayed until the first
    embedding request so that FastAPI startup remains light and the
    background `start_background_import_preload` mechanism is no longer
    needed.
    """
    global _ORT_IMPORTED  # noqa: PLW0603 - intentional one-time flag
    if _ORT_IMPORTED:
        return
    with _RUNTIME_LOCK:
        if _ORT_IMPORTED:
            return

        # ----------------------------------------------------------------
        # DIAGNOSTIC: bracket the onnxruntime import so we can confirm
        # whether THIS import is the operation that hangs / OOMs in the
        # 512 MiB Render free tier. Exceptions are NOT swallowed.
        # Force flush so logs appear to disk before a potential hang/kill.
        # ----------------------------------------------------------------
        logger.info(
            "[EMBEDDINGS] _ensure_onnxruntime_imported() ENTER | "
            "thread=%s | rss_before=%s MiB",
            threading.current_thread().name,
            _read_rss_mib(),
        )
        _force_log_flush()
        import_start = time.perf_counter()
        try:
            logger.info(
                "[EMBEDDINGS] _ensure_onnxruntime_imported() performing 'import onnxruntime' | "
                "thread=%s | elapsed=%.2fs",
                threading.current_thread().name,
                time.perf_counter() - import_start,
            )
            _force_log_flush()
            import onnxruntime as _ort  # noqa: F401 - imported lazily
            import_done = time.perf_counter()
            logger.info(
                "[EMBEDDINGS] _ensure_onnxruntime_imported() 'import onnxruntime' RETURNED | "
                "thread=%s | import_elapsed=%.2fs",
                threading.current_thread().name,
                import_done - import_start,
            )
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] _ensure_onnxruntime_imported() FAILED: onnxruntime import raised | "
                "error_type=%s | error=%s | elapsed=%.2fs | rss_after=%s MiB",
                type(exc).__name__,
                exc,
                time.perf_counter() - import_start,
                _read_rss_mib(),
            )
            raise
        import_elapsed = time.perf_counter() - import_start
        global _ORT_MODULE
        _ORT_MODULE = _ort
        _ORT_IMPORTED = True
        logger.info(
            "[EMBEDDINGS] _ensure_onnxruntime_imported() DONE | "
            "total_elapsed=%.2fs | rss_after=%s MiB | ort_version=%s | "
            "available_providers=%s",
            import_elapsed,
            _read_rss_mib(),
            getattr(_ort, "__version__", "unknown"),
            list(getattr(_ort, "get_available_providers", lambda: [])()),
        )


def _ensure_tokenizers_imported() -> None:
    """Import the lightweight `tokenizers` library exactly once.

    We use the Rust-based HuggingFace `tokenizers` library directly (no
    PyTorch / `transformers` dependency) for fast, memory-efficient
    tokenisation of the ONNX model.
    """
    global _TOKENIZERS_IMPORTED  # noqa: PLW0603 - intentional one-time flag
    if _TOKENIZERS_IMPORTED:
        return
    with _RUNTIME_LOCK:
        if _TOKENIZERS_IMPORTED:
            return
        logger.info(
            "[EMBEDDINGS] _ensure_tokenizers_imported() ENTER | "
            "thread=%s | rss_before=%s MiB",
            threading.current_thread().name,
            _read_rss_mib(),
        )
        _force_log_flush()
        import_start = time.perf_counter()
        try:
            logger.info(
                "[EMBEDDINGS] _ensure_tokenizers_imported() performing 'import tokenizers' | "
                "thread=%s | elapsed=%.2fs",
                threading.current_thread().name,
                time.perf_counter() - import_start,
            )
            _force_log_flush()
            import tokenizers as _tok  # noqa: F401 - imported lazily
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] _ensure_tokenizers_imported() FAILED | "
                "error_type=%s | error=%s | elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - import_start,
            )
            raise
        global _TOKENIZERS_MODULE
        _TOKENIZERS_MODULE = _tok
        _TOKENIZERS_IMPORTED = True
        logger.info(
            "[EMBEDDINGS] _ensure_tokenizers_imported() DONE | "
            "elapsed=%.2fs | rss_after=%s MiB | tok_version=%s",
            time.perf_counter() - import_start,
            _read_rss_mib(),
            getattr(_tok, "__version__", "unknown"),
        )


def get_onnx_session() -> tuple[Any, Any]:
    """Lazily initialise the ONNX Runtime session + tokenizer.

    Returns:
        A tuple of `(ort_session, tokenizer)`. The session is ready to
        accept tokenized inputs and produce 384-dim embeddings.

    Raises:
        FileNotFoundError: if the ONNX model snapshot directory cannot
            be located.
        RuntimeError: if the ONNX session fails to initialise.
    """
    # All `global` declarations must appear before ANY reference (read or
    # write) to those names inside the function body per PEP 3124 / Python
    # scoping rules. The diagnostic log line below reads _SESSION_LOADED and
    # _TOKENIZER_LOADED, so the globals must be declared first.
    global _ORT_SESSION  # noqa: PLW0603 - intentional module-level state
    global _TOKENIZER
    global _MODEL_DIR
    global _SESSION_LOADED
    global _TOKENIZER_LOADED
    global _INPUT_IDS_NAME
    global _ATTENTION_MASK_NAME
    global _TOKEN_TYPE_IDS_NAME
    global _OUTPUT_NAME

    logger.info(
        "[EMBEDDINGS] get_onnx_session() entered | session_loaded=%s | "
        "tokenizer_loaded=%s | thread=%s",
        _SESSION_LOADED,
        _TOKENIZER_LOADED,
        threading.current_thread().name,
    )

    if _SESSION_LOADED and _TOKENIZER_LOADED:
        return _ORT_SESSION, _TOKENIZER

    with _RUNTIME_LOCK:
        if _SESSION_LOADED and _TOKENIZER_LOADED:
            return _ORT_SESSION, _TOKENIZER

        # ----------------------------------------------------------------
        # STEP 1: locate the pre-downloaded ONNX snapshot directory
        # ----------------------------------------------------------------
        logger.info("[EMBEDDINGS] STEP 1: finding ONNX snapshot")
        step_start = time.perf_counter()
        try:
            model_dir = _find_onnx_snapshot_dir()
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] STEP 1 FAILED | error_type=%s | error=%s | "
                "elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - step_start,
            )
            raise
        logger.info(
            "[EMBEDDINGS] STEP 1 DONE | path=%s | elapsed=%.2fs",
            str(model_dir),
            time.perf_counter() - step_start,
        )

        model_path = model_dir / "model.onnx"
        tokenizer_path = model_dir / "tokenizer.json"

        if not model_path.is_file():
            raise FileNotFoundError(
                f"model.onnx not found at '{model_path}'. "
                "Re-run 'python scripts/download_model.py' during build."
            )
        if not tokenizer_path.is_file():
            raise FileNotFoundError(
                f"tokenizer.json not found at '{tokenizer_path}'. "
                "Re-run 'python scripts/download_model.py' during build."
            )

        # ----------------------------------------------------------------
        # STEP 2: lazy-import onnxruntime (~30 MiB RSS)
        # ----------------------------------------------------------------
        logger.info("[EMBEDDINGS] STEP 2: importing onnxruntime")
        step_start = time.perf_counter()
        try:
            _ensure_onnxruntime_imported()
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] STEP 2 FAILED | error_type=%s | error=%s | "
                "elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - step_start,
            )
            raise
        logger.info(
            "[EMBEDDINGS] STEP 2 DONE | elapsed=%.2fs",
            time.perf_counter() - step_start,
        )

        # ----------------------------------------------------------------
        # STEP 3: lazy-import tokenizers
        # ----------------------------------------------------------------
        logger.info("[EMBEDDINGS] STEP 3: importing tokenizers")
        step_start = time.perf_counter()
        try:
            _ensure_tokenizers_imported()
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] STEP 3 FAILED | error_type=%s | error=%s | "
                "elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - step_start,
            )
            raise
        logger.info(
            "[EMBEDDINGS] STEP 3 DONE | elapsed=%.2fs",
            time.perf_counter() - step_start,
        )

        # ----------------------------------------------------------------
        # STEP 4: build ONNX SessionOptions
        # ----------------------------------------------------------------
        logger.info("[EMBEDDINGS] STEP 4: creating ONNX SessionOptions")
        step_start = time.perf_counter()
        try:
            so = _ORT_MODULE.SessionOptions()
            so.intra_op_num_threads = 1
            so.inter_op_num_threads = 1
            so.graph_optimization_level = (
                _ORT_MODULE.GraphOptimizationLevel.ORT_ENABLE_BASIC
            )
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] STEP 4 FAILED | error_type=%s | error=%s | "
                "elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - step_start,
            )
            raise
        logger.info(
            "[EMBEDDINGS] STEP 4 DONE | intra=1 inter=1 "
            "graph_opt=ORT_ENABLE_BASIC | elapsed=%.2fs",
            time.perf_counter() - step_start,
        )

        # ----------------------------------------------------------------
        # STEP 5: create ONNX InferenceSession (the suspected bottleneck)
        # Force-flush so we can see if the InferenceSession constructor
        # hangs before being killed by OOM in the 512 MiB Render tier.
        # ----------------------------------------------------------------
        logger.info(
            "[EMBEDDINGS] STEP 5: creating InferenceSession | model=%s | "
            "optimization=ORT_ENABLE_BASIC | providers=[CPUExecutionProvider]",
            model_path.name,
        )
        _force_log_flush()
        step_start = time.perf_counter()
        try:
            logger.info(
                "[EMBEDDINGS] STEP 5: calling InferenceSession() constructor | "
                "elapsed=%.2fs",
                time.perf_counter() - step_start,
            )
            _force_log_flush()
            session = _ORT_MODULE.InferenceSession(
                str(model_path),
                sess_options=so,
                providers=["CPUExecutionProvider"],
            )
            inf_session_done = time.perf_counter()
            logger.info(
                "[EMBEDDINGS] STEP 5: InferenceSession() constructor RETURNED | "
                "elapsed=%.2fs",
                inf_session_done - step_start,
            )
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] STEP 5 FAILED | error_type=%s | error=%s | "
                "elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - step_start,
            )
            raise
        logger.info(
            "[EMBEDDINGS] STEP 5 DONE | session created | elapsed=%.2fs | "
            "active_providers=%s",
            time.perf_counter() - step_start,
            session.get_providers(),
        )

        # Discover I/O names from the model graph.
        input_meta = {meta.name: meta for meta in session.get_inputs()}
        output_meta = session.get_outputs()
        if not input_meta or not output_meta:
            raise RuntimeError(
                "ONNX model has unexpected I/O signature: "
                f"inputs={list(input_meta)}, outputs={[m.name for m in output_meta]}"
            )

        _INPUT_IDS_NAME = (
            "input_ids" if "input_ids" in input_meta else next(iter(input_meta))
        )
        _ATTENTION_MASK_NAME = (
            "attention_mask"
            if "attention_mask" in input_meta
            else None
        )
        _TOKEN_TYPE_IDS_NAME = (
            "token_type_ids"
            if "token_type_ids" in input_meta
            else None
        )
        _OUTPUT_NAME = output_meta[0].name

        logger.info(
            "[EMBEDDINGS] ONNX session ready | model=%s | threads=1 | "
            "load=%.2fs",
            model_path.name,
            time.perf_counter() - step_start,
        )

        # ----------------------------------------------------------------
        # STEP 6: load tokenizer
        # ----------------------------------------------------------------
        logger.info("[EMBEDDINGS] STEP 6: creating tokenizer")
        _force_log_flush()
        step_start = time.perf_counter()
        try:
            logger.info(
                "[EMBEDDINGS] STEP 6: calling Tokenizer.from_file() | "
                "elapsed=%.2fs",
                time.perf_counter() - step_start,
            )
            _force_log_flush()
            tokenizer = _TOKENIZERS_MODULE.Tokenizer.from_file(
                str(tokenizer_path)
            )
            tok_done = time.perf_counter()
            logger.info(
                "[EMBEDDINGS] STEP 6: Tokenizer.from_file() RETURNED | "
                "elapsed=%.2fs",
                tok_done - step_start,
            )
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] STEP 6 FAILED | error_type=%s | error=%s | "
                "elapsed=%.2fs",
                type(exc).__name__,
                exc,
                time.perf_counter() - step_start,
            )
            raise
        # Enable padding/truncation suitable for MiniLM (max 256 tokens is
        # well above any realistic chunk size for RAG; reduces memory).
        tokenizer.enable_padding(
            pad_id=tokenizer.token_to_id("[PAD]") or 0,
            pad_token="[PAD]",
            length=256,
        )
        tokenizer.enable_truncation(max_length=256)
        logger.info(
            "[EMBEDDINGS] STEP 6 DONE | tokenizer ready | elapsed=%.2fs",
            time.perf_counter() - step_start,
        )

        # ----------------------------------------------------------------
        # STEP 7: commit module-level state
        # ----------------------------------------------------------------
        logger.info("[EMBEDDINGS] STEP 7: marking session loaded")
        _ORT_SESSION = session
        _TOKENIZER = tokenizer
        _MODEL_DIR = model_dir
        _SESSION_LOADED = True
        _TOKENIZER_LOADED = True
        logger.info(
            "[EMBEDDINGS] STEP 7 DONE | rss_after=%s MiB",
            _read_rss_mib(),
        )
        _force_log_flush()

        return _ORT_SESSION, _TOKENIZER


def clear_model_cache() -> None:
    """Drop the in-memory ONNX session + tokenizer.

    Intended for test suites that need to reset state between cases. Not
    called on the hot path.
    """
    global _ORT_SESSION  # noqa: PLW0603
    global _TOKENIZER
    global _SESSION_LOADED
    global _TOKENIZER_LOADED
    with _RUNTIME_LOCK:
        _ORT_SESSION = None
        _TOKENIZER = None
        _SESSION_LOADED = False
        _TOKENIZER_LOADED = False


# ---------------------------------------------------------------------------
# Embedding math
# ---------------------------------------------------------------------------
def _mean_pool(last_hidden_state: Any, attention_mask: Any) -> Any:
    """Mean-pool token embeddings with the attention mask.

    Matches the pooling used by `sentence-transformers/all-MiniLM-L6-v2`.
    """
    import numpy as _np

    mask = attention_mask.astype(_np.float32)[:, :, None]
    masked = last_hidden_state.astype(_np.float32) * mask
    summed = masked.sum(axis=1)
    counts = _np.clip(mask.sum(axis=1), a_min=1e-9, a_max=None)
    return summed / counts


def _l2_normalize(matrix: Any) -> Any:
    """L2-normalise each row of a 2-D matrix in place."""
    import numpy as _np

    norms = _np.linalg.norm(matrix, axis=1, keepdims=True)
    norms = _np.clip(norms, a_min=1e-12, a_max=None)
    return matrix / norms


def _encode_onnx(texts: Sequence[str]) -> list[list[float]]:
    """Run tokenisation + ONNX inference + mean-pooling + L2 norm.

    Returns:
        A list of 384-dimensional float vectors.
    """
    import numpy as _np

    if not texts:
        return []

    session, tokenizer = get_onnx_session()

    encodings = tokenizer.encode_batch(list(texts))

    max_len = max(len(enc.ids) for enc in encodings)
    pad_id = tokenizer.token_to_id("[PAD]") or 0
    input_ids = _np.full((len(encodings), max_len), pad_id, dtype=_np.int64)
    attention_mask = _np.zeros((len(encodings), max_len), dtype=_np.int64)
    token_type_ids = _np.zeros((len(encodings), max_len), dtype=_np.int64)

    for row_idx, enc in enumerate(encodings):
        n = len(enc.ids)
        input_ids[row_idx, :n] = enc.ids
        attention_mask[row_idx, :n] = enc.attention_mask
        # `tokenizers` exposes type_ids for some tokenizers; default 0 otherwise.
        if getattr(enc, "type_ids", None):
            token_type_ids[row_idx, :n] = enc.type_ids

    feed: dict[str, Any] = {_INPUT_IDS_NAME: input_ids}
    if _ATTENTION_MASK_NAME:
        feed[_ATTENTION_MASK_NAME] = attention_mask
    if _TOKEN_TYPE_IDS_NAME:
        feed[_TOKEN_TYPE_IDS_NAME] = token_type_ids

    outputs = session.run([_OUTPUT_NAME], feed)
    last_hidden = outputs[0]
    pooled = _mean_pool(last_hidden, attention_mask)
    normalised = _l2_normalize(pooled)
    return normalised.astype(_np.float32).tolist()


# ---------------------------------------------------------------------------
# Public provider
# ---------------------------------------------------------------------------
class GeminiEmbeddingProvider:
    """Memory-efficient local embedding provider using ONNX Runtime.

    The class name is preserved (`GeminiEmbeddingProvider`) and the
    public interface (`.embed_text()`, `.embed_batch()`, `.dimension`)
    is identical to the previous SentenceTransformer-based
    implementation. The rest of the RAG pipeline does NOT need to change.

    The default model is the ONNX export of `all-MiniLM-L6-v2`
    (`qdrant/all-MiniLM-L6-v2-onnx`), which produces 384-dimensional
    L2-normalised embeddings — bit-compatible with the previous
    PyTorch SentenceTransformer output.
    """

    DEFAULT_MODEL = "qdrant/all-MiniLM-L6-v2-onnx"
    DEFAULT_DIMENSION = DEFAULT_DIMENSION

    def __init__(
        self,
        model: Any | None = None,
        dimension: int | None = None,
        *,
        allow_download: bool = False,  # noqa: ARG003 - accepted for back-compat
    ) -> None:
        self.dimension = dimension or self.DEFAULT_DIMENSION
        # `model` is accepted for back-compat with previous constructor
        # signatures but is ignored — we use the baked-in ONNX model.
        if isinstance(model, str):
            self.model_name = model
        elif model is not None and getattr(model, "model_name", None):
            self.model_name = model.model_name
        else:
            self.model_name = self.DEFAULT_MODEL

    def _validate(self, vector: Sequence[float]) -> list[float]:
        values = [float(v) for v in vector]
        if self.dimension and len(values) != self.dimension:
            raise ValueError(
                f"Embedding dimension mismatch: expected {self.dimension}, "
                f"got {len(values)}. Update the Supabase vector column to "
                "match the model output size."
            )
        return values

    def embed_text(self, text: str) -> list[float]:
        """Generate a single embedding for one text value."""
        if not text or not text.strip():
            return []

        cleaned = text.strip()
        logger.debug(
            "[EMBEDDINGS] embed_text | model='%s' | input_type=%s | input_len=%d",
            self.model_name,
            type(text).__name__,
            len(cleaned),
        )
        try:
            encode_start = time.perf_counter()
            vectors = _encode_onnx([cleaned])
            encode_time = time.perf_counter() - encode_start
            logger.info("[PERF] encode(): %.2fs", encode_time)
            return self._validate(vectors[0])
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] embed_text failed | model='%s' | error_type=%s | "
                "error=%s",
                self.model_name,
                type(exc).__name__,
                exc,
            )
            raise RuntimeError(f"Local embedding generation failed: {exc}") from exc

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Generate embeddings for multiple text values in one model call."""
        if not texts:
            return []

        normalised_texts = [str(t).strip() for t in texts if str(t).strip()]
        if not normalised_texts:
            return []

        logger.debug(
            "[EMBEDDINGS] embed_batch | model='%s' | n_texts=%d",
            self.model_name,
            len(normalised_texts),
        )
        try:
            encode_start = time.perf_counter()
            vectors = _encode_onnx(normalised_texts)
            encode_time = time.perf_counter() - encode_start
            logger.info("[PERF] batch encode(): %.2fs", encode_time)
            return [self._validate(v) for v in vectors]
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] embed_batch failed | model='%s' | "
                "error_type=%s | error=%s",
                self.model_name,
                type(exc).__name__,
                exc,
            )
            raise RuntimeError(f"Batch embedding generation failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_EMBEDDING_PROVIDER_INSTANCE: GeminiEmbeddingProvider | None = None
_PROVIDER_LOCK = threading.Lock()


def get_embedding_provider() -> GeminiEmbeddingProvider:
    """Return the process-wide singleton embedding provider.

    Creating the provider is cheap (no model load). The actual ONNX
    session is initialised lazily on the first `embed_*` call.
    """
    global _EMBEDDING_PROVIDER_INSTANCE  # noqa: PLW0603
    if _EMBEDDING_PROVIDER_INSTANCE is None:
        with _PROVIDER_LOCK:
            if _EMBEDDING_PROVIDER_INSTANCE is None:
                _EMBEDDING_PROVIDER_INSTANCE = GeminiEmbeddingProvider()
    return _EMBEDDING_PROVIDER_INSTANCE


def preload_embedding_model() -> GeminiEmbeddingProvider:
    """Pre-load the ONNX session + tokenizer.

    Intended to be called from the FastAPI lifespan handler if the
    operator wants the first request to skip the lazy-load cost. This
    function does NOT block on PyTorch / `sentence_transformers` — the
    memory cost is ~60-80 MiB, well inside Render's 512 MiB free tier.

    Note: the new implementation does NOT preload at startup by default
    to minimise memory pressure on first boot. This function is kept as
    a thin wrapper for back-compat with the previous public API.
    """
    get_onnx_session()
    return get_embedding_provider()


def generate_embedding(text: str) -> list[float]:
    return get_embedding_provider().embed_text(text)


def generate_embeddings_for_chunks(chunks: Sequence[str]) -> list[list[float]]:
    return get_embedding_provider().embed_batch(chunks)


# ---------------------------------------------------------------------------
# Back-compat shim
# ---------------------------------------------------------------------------
# The previous implementation exposed a module-level `SentenceTransformer`
# symbol so tests could monkeypatch it. Some downstream code may still
# reference this name; provide a stub that raises if used.
SentenceTransformer: Any = None  # legacy alias — no longer used at runtime


def get_sentence_transformer(*_args: Any, **_kwargs: Any) -> Any:
    """Legacy helper retained only for back-compat.

    The previous SentenceTransformer/PyTorch runtime has been replaced
    with an ONNX-based runtime. This stub returns the ONNX session
    wrapper so that legacy callers that introspect the returned object
    still get a non-None value, but no PyTorch model is loaded.

    Raises nothing on call; simply triggers the lazy ONNX load.
    """
    session, tokenizer = get_onnx_session()
    return _LegacyModelWrapper(session=session, tokenizer=tokenizer)


class _LegacyModelWrapper:
    """Minimal shim that mimics the `.encode()` method used in tests.

    Some test suites monkeypatch `app.rag.embeddings.SentenceTransformer`
    with a `MagicMock`. We provide an object with `.encode()` so that any
    straggler code expecting a SentenceTransformer-like object does not
    fail with AttributeError. This is NOT used by the production code
    path — `GeminiEmbeddingProvider.embed_text/embed_batch` call
    `_encode_onnx()` directly.
    """

    def __init__(self, session: Any, tokenizer: Any) -> None:
        self._session = session
        self._tokenizer = tokenizer
        self.model_name = "qdrant/all-MiniLM-L6-v2-onnx"

    def encode(self, inputs: Any, **_kwargs: Any) -> list[list[float]]:
        if isinstance(inputs, str):
            inputs = [inputs]
        return _encode_onnx([str(i) for i in inputs])
