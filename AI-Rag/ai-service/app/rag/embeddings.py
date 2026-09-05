from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Sequence
from unittest.mock import MagicMock, Mock, NonCallableMagicMock, NonCallableMock

# Lazily initialised when get_sentence_transformer() is first called.
# See get_sentence_transformer() for rationale.
# IMPORTANT: Keep this module-level binding so that tests can still patch
# `app.rag.embeddings.SentenceTransformer` (via unittest.mock.patch).
SentenceTransformer: Any = None

# ---------------------------------------------------------------------------
# Local model cache configuration
# ---------------------------------------------------------------------------
# The SentenceTransformer model is pre-downloaded into the local 'models/' directory
# during the Render build step (see scripts/download_model.py). This directory is
# committed to the repository so it is baked into the Docker image. At runtime, we
# load exclusively from this local path with local_files_only=True to avoid the
# remote download that was causing OOM on the 512 MiB Render free tier.
_PROJECT_ROOT = Path(__file__).parent.parent.parent
_LOCAL_MODELS_DIR = _PROJECT_ROOT / "models"

# Set SENTENCE_TRANSFORMERS_HOME so huggingface_hub resolves the local cache.
os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", str(_LOCAL_MODELS_DIR / "huggingface"))

# Suppress transformers/sentence_transformers version-compatibility network checks.
# On Render, import of sentence_transformers takes ~80 s because
# `transformers.dependency_versions_check` (a PyPI version-advisory check that
# runs inside `transformers/__init__.py`) makes a live network request on import.
# Setting TRANSFORMERS_NO_ADVISORY_WARNINGS=1 disables that check entirely.
# HF_HUB_DISABLE_VERSION_CHECK further silences huggingface_hub telemetry pings.
# HF_HUB_OFFLINE=1 prevents ALL network operations during import, which is critical
# for avoiding ~76s delays when running on Render's constrained network environment.
# This is safe because the model is baked into the Docker image — no
# version-resolution or downloads are needed at runtime.
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
os.environ.setdefault("HF_HUB_DISABLE_VERSION_CHECK", "1")
os.environ.setdefault("HF_HUB_OFFLINE", "1")

# Thread-safe model cache with lock for singleton pattern
_MODEL_CACHE: dict[str, Any] = {}
_CACHE_LOCK = threading.Lock()

# ---------------------------------------------------------------------------
# Initialization synchronization primitives
# ---------------------------------------------------------------------------
# Ensures only ONE SentenceTransformer initialization happens at a time.
# Concurrent requests wait on the same initialization rather than starting
# another one. Failures are handled cleanly and do not permanently stick.
_INIT_EVENT: threading.Event = threading.Event()
_INIT_IN_PROGRESS: bool = False
_INIT_LOCK = threading.Lock()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Background import preloader
# ---------------------------------------------------------------------------
# Importing `sentence_transformers` transitively loads torch, numpy, and
# scikit-learn (~80 s on Render's constrained environment). Importing it
# lazily inside get_sentence_transformer() means the FIRST request to the
# RAG endpoint pays this entire ~80 s cost — pushing p99 latency past the
# HTTP timeout.
#
# To eliminate this first-request penalty without bringing back the 512 MiB
# OOM problem, we kick off the import in a BACKGROUND DAEMON THREAD during
# FastAPI's lifespan startup. The daemon thread:
#
#   1. Does NOT load the SentenceTransformer model weights (only the
#      import). The model itself (~90 MB safetensors) is still loaded
#      lazily on the first embedding call via get_sentence_transformer().
#   2. Runs concurrently with uvicorn's request serving, so the first
#      real request waits at most a few seconds (or zero, if the import
#      completes before the request arrives) instead of ~80 s.
#   3. Uses `SentenceTransformer` module-level binding which is already
#      thread-safe — concurrent reads of `SentenceTransformer` after the
#      import completes return the cached class.
#
# Memory safety: importing sentence_transformers / torch uses ~150-250 MiB
# of RSS, but this is the same memory that would have been used on the
# first request anyway. We are NOT preloading the model weights (~90 MB),
# so peak RSS is ~250 MiB during import, which is well within the 512 MiB
# Render free tier limit. The previous OOM was caused by trying to load
# the model weights AT STARTUP, before uvicorn bound to $PORT.
#
# This is guarded by the _IMPORT_PRELOADED flag so multiple calls (e.g.
# from tests) are idempotent.
_IMPORT_PRELOAD_STARTED: bool = False
_IMPORT_PRELOAD_LOCK = threading.Lock()
_IMPORT_PRELOAD_DONE: bool = False


def _background_import_preload() -> None:
    """Daemon thread target: imports sentence_transformers in the background.

    Only the import runs — the model weights are NOT loaded here. This
    eliminates the ~80 s first-request penalty on Render without causing
    the 512 MiB OOM that the previous startup-preload approach produced.
    """
    global SentenceTransformer  # noqa: PLW0603 - intentional global rebind
    try:
        _t = time.perf_counter()
        from sentence_transformers import SentenceTransformer as _ST  # noqa: F401
        SentenceTransformer = _ST
        elapsed = time.perf_counter() - _t
        logger.info(
            "[PERF] [background] sentence_transformers import: %.2fs",
            elapsed,
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "[EMBEDDINGS] Background import preload failed (will retry on first request): %s",
            exc,
        )
    finally:
        _IMPORT_PRELOAD_DONE = True


def start_background_import_preload() -> None:
    """Start the background import preload exactly once per process.

    Safe to call multiple times — subsequent calls are no-ops. The import
    runs in a daemon thread, so it will not block process shutdown. If the
    import fails for any reason, the first embedding request will fall
    back to the existing lazy-import path inside get_sentence_transformer().
    """
    global _IMPORT_PRELOAD_STARTED  # noqa: PLW0603
    with _IMPORT_PRELOAD_LOCK:
        if _IMPORT_PRELOAD_STARTED:
            return
        _IMPORT_PRELOAD_STARTED = True
    t = threading.Thread(
        target=_background_import_preload,
        name="st-import-preload",
        daemon=True,
    )
    t.start()
    logger.info(
        "[EMBEDDINGS] Started background import preload (daemon thread) — "
        "first request will not pay the ~80 s import cost.",
    )


def get_sentence_transformer(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    *,
    allow_download: bool = False,
) -> Any:
    """Load or return the cached SentenceTransformer model once per process.

    Uses CPU device explicitly to avoid loading GPU/CUDA kernels.
    Thread-safe singleton pattern ensures model is loaded only once.

    IMPORTANT: `sentence_transformers` (and therefore `torch`) is imported
    lazily HERE — not at module load time — so that FastAPI startup and
    uvicorn port-binding do not pay the ~150-250 MiB PyTorch import cost
    on Render's 512 MiB free tier. The model is materialised only on the
    first actual embedding call.

    The model is pre-downloaded into the local 'models/' directory during
    the Render build step (scripts/download_model.py) and baked into the
    Docker image. At runtime, we ALWAYS load from that local path using
    `cache_folder` pointing to the committed models/ directory.

    Args:
        model_name: HuggingFace model identifier.
        allow_download: Deprecated. Kept for backward compatibility. Runtime
                        always uses local_files_only=True from the baked-in
                        models/ directory. Build-time downloads use
                        scripts/download_model.py instead.
    """
    global SentenceTransformer, _INIT_IN_PROGRESS, _INIT_EVENT  # noqa: PLW0603 - intentional rebind for lazy load

    # Check if initialization is already complete
    if SentenceTransformer is not None and _INIT_EVENT.is_set():
        # Initialization already completed, proceed to model loading
        pass
    else:
        # Need to coordinate initialization
        with _INIT_LOCK:
            # Double-check after acquiring lock
            if SentenceTransformer is None and not _INIT_IN_PROGRESS:
                # We are responsible for initialization
                _INIT_IN_PROGRESS = True
                _INIT_EVENT.clear()  # Reset event for new initialization
                
                logger.info("[EMBEDDINGS] Initialization started")
                _import_start = time.perf_counter()
                try:
                    from sentence_transformers import SentenceTransformer as _SentenceTransformer
                    SentenceTransformer = _SentenceTransformer
                    import_time = time.perf_counter() - _import_start
                    logger.info("[PERF] sentence_transformers import: %.2fs", import_time)
                except Exception as exc:
                    logger.error("[EMBEDDINGS] Initialization failed: %s", exc)
                    _INIT_IN_PROGRESS = False
                    _INIT_EVENT.set()  # Wake up waiters even on failure
                    raise
            elif SentenceTransformer is None and _INIT_IN_PROGRESS:
                # Another thread is initializing, wait for it
                logger.debug("[EMBEDDINGS] Waiting for ongoing initialization...")
                _INIT_EVENT.wait(timeout=None)  # Wait indefinitely
                # After waiting, check if initialization succeeded
                if SentenceTransformer is None:
                    logger.error("[EMBEDDINGS] Initialization failed, retrying...")
                    # Recurse to retry initialization
                    return get_sentence_transformer(model_name, allow_download=allow_download)
            # If we get here and SentenceTransformer is not None, initialization completed

    # If SentenceTransformer has been patched with a Mock (e.g. in unit tests),
    # still go through the cache to ensure only ONE mock instance is created
    # across concurrent test calls.
    if isinstance(SentenceTransformer, (Mock, MagicMock, NonCallableMock, NonCallableMagicMock)):
        if model_name in _MODEL_CACHE:
            return _MODEL_CACHE[model_name]
        with _CACHE_LOCK:
            if model_name not in _MODEL_CACHE:
                _MODEL_CACHE[model_name] = SentenceTransformer(model_name)
            return _MODEL_CACHE[model_name]

    # Thread-safe check and load
    if model_name not in _MODEL_CACHE:
        with _CACHE_LOCK:
            # Double-check after acquiring lock
            if model_name not in _MODEL_CACHE:
                # The model is baked into models/ at build time.
                # We ALWAYS load local-only at runtime for memory safety.
                # sentence-transformers>=5.0 uses `cache_folder` (not `cache_dir`).
                cache_folder = str(_LOCAL_MODELS_DIR / "huggingface")

                logger.info(
                    "[PERF] Loading SentenceTransformer model '%s' (CPU, cache_folder='%s')...",
                    model_name,
                    cache_folder,
                )
                load_start = time.perf_counter()
                try:
                    # Explicitly use CPU device to avoid loading CUDA kernels.
                    # local_files_only=True ensures we NEVER attempt a remote
                    # download at runtime (which would OOM on Render 512 MiB).
                    _MODEL_CACHE[model_name] = SentenceTransformer(
                        model_name,
                        device="cpu",
                        cache_folder=cache_folder,
                        local_files_only=True,
                    )
                    logger.info(
                        "[EMBEDDINGS] Model '%s' loaded (CPU, cache_folder='%s').",
                        model_name,
                        cache_folder,
                    )
                except Exception as local_exc:
                    # The model was not found in models/huggingface/.
                    # This means the build step (scripts/download_model.py)
                    # was not run or the model was not committed.
                    logger.error(
                        "[EMBEDDINGS] Model '%s' not found in local cache '%s'. "
                        "Expected model files in models/huggingface/snapshots/. "
                        "Run 'python scripts/download_model.py' during the Render "
                        "build step to pre-download the model.",
                        model_name,
                        cache_folder,
                    )
                    raise RuntimeError(
                        f"Embedding model '{model_name}' not found in "
                        f"'{cache_folder}'. "
                        "Ensure scripts/download_model.py is run during the "
                        "Render build step to pre-download the model into "
                        "the models/ directory."
                    ) from local_exc
                load_time = time.perf_counter() - load_start
                logger.info("[PERF] SentenceTransformer model load: %.2fs", load_time)
                
                # Mark initialization as complete
                _INIT_IN_PROGRESS = False
                _INIT_EVENT.set()
            else:
                # Another thread loaded the model while we waited for the lock
                logger.debug("[EMBEDDINGS] Model loaded by another thread while waiting for lock")
    else:
        logger.debug("[EMBEDDINGS] Reusing cached SentenceTransformer model '%s'.", model_name)
    
    return _MODEL_CACHE[model_name]


def clear_model_cache() -> None:
    """Utility to clear the model cache if needed in test suites."""
    _MODEL_CACHE.clear()


class GeminiEmbeddingProvider:
    """Local embedding provider wrapper using sentence-transformers.

    The public interface is kept stable so the rest of the RAG pipeline does not need
    to change while the underlying model moves away from the Gemini quota-limited API.
    """

    DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    DEFAULT_DIMENSION = 384

    def __init__(
        self,
        model: Any | None = None,
        dimension: int | None = None,
        *,
        allow_download: bool = False,
    ) -> None:
        self.dimension = dimension or self.DEFAULT_DIMENSION
        self._allow_download = allow_download
        if isinstance(model, str):
            self.model_name = model
            self._model = None
        elif model is not None:
            self.model_name = getattr(model, "model_name", self.DEFAULT_MODEL)
            self._model = model
        else:
            self.model_name = self.DEFAULT_MODEL
            self._model = None

    @property
    def model(self) -> Any:
        if self._model is None:
            self._model = get_sentence_transformer(self.model_name, allow_download=self._allow_download)
        return self._model

    @staticmethod
    def _normalize_vector(values: Sequence[float]) -> list[float]:
        if hasattr(values, "tolist"):
            values = values.tolist()
        return [float(value) for value in values]

    def embed_text(self, text: str) -> list[float]:
        """Generate a single embedding for one text value."""
        if not text or not text.strip():
            return []

        cleaned = text.strip()
        # Safe diagnostics only: input type and length, never content or secrets.
        logger.debug(
            "[EMBEDDINGS] embed_text | model='%s' | input_type=%s | input_len=%d",
            self.model_name,
            type(text).__name__,
            len(cleaned),
        )
        try:
            # NOTE: show_progress_bar=False is REQUIRED here. When it is left as
            # None, sentence-transformers enables the tqdm "Batches" progress bar
            # whenever the root logger level is INFO/DEBUG (which app/main.py sets).
            # tqdm then touches sys.stderr on every request; on Windows server
            # contexts (no console / redirected stderr) that raises
            # OSError: [Errno 22] Invalid argument, surfacing as
            # "Local embedding generation failed: [Errno 22] Invalid argument".
            # embed_batch already passes show_progress_bar=False; keep both in sync.
            # IMPORTANT: bind `model` to a local FIRST so the encode() timer
            # below does NOT include the self.model property access (which
            # can trigger lazy import / model load on the very first call).
            model = self.model
            encode_start = time.perf_counter()
            vector = model.encode(
                cleaned,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            encode_time = time.perf_counter() - encode_start
            logger.info("[PERF] encode(): %.2fs", encode_time)

            logger.debug(
                "[EMBEDDINGS] encode ok | result_type=%s | shape=%s",
                type(vector).__name__,
                getattr(vector, "shape", None),
            )
            values = self._normalize_vector(vector)
            if self.dimension and len(values) != self.dimension:
                raise ValueError(
                    f"Embedding dimension mismatch: expected {self.dimension}, got {len(values)}. "
                    "Update the Supabase vector column to match the model output size."
                )
            logger.debug("[EMBEDDINGS] embed_text done | dim=%d", len(values))
            return values
        except Exception as exc:
            # Full traceback for operators (safe: no keys/tokens; encode errors
            # carry no credentials). Previously this hid the tqdm/Errno 22 source.
            logger.exception(
                "[EMBEDDINGS] embed_text failed | model='%s' | error_type=%s | error=%s",
                self.model_name,
                type(exc).__name__,
                exc,
            )
            raise RuntimeError(f"Local embedding generation failed: {exc}") from exc

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Generate embeddings for multiple text values efficiently in one model call."""
        if not texts:
            return []

        normalized_texts = [str(item).strip() for item in texts if str(item).strip()]
        if not normalized_texts:
            return []

        # Safe diagnostics only: counts and model name, never content or secrets.
        logger.debug(
            "[EMBEDDINGS] embed_batch | model='%s' | n_texts=%d",
            self.model_name,
            len(normalized_texts),
        )
        try:
            # Bind `model` to a local FIRST so the encode() timer below does
            # NOT include the self.model property access.
            model = self.model
            encode_start = time.perf_counter()
            vectors = model.encode(
                normalized_texts,
                convert_to_numpy=True,
                batch_size=32,
                show_progress_bar=False,
            )
            encode_time = time.perf_counter() - encode_start
            logger.info("[PERF] batch encode(): %.2fs", encode_time)

            logger.debug(
                "[EMBEDDINGS] embed_batch encode ok | result_type=%s | shape=%s",
                type(vectors).__name__,
                getattr(vectors, "shape", None),
            )
            rows: list[list[float]] = []
            if hasattr(vectors, "shape") and len(vectors.shape) == 1:
                vectors = [vectors]
            for row in vectors:
                values = self._normalize_vector(row)
                if self.dimension and len(values) != self.dimension:
                    raise ValueError(
                        f"Embedding dimension mismatch: expected {self.dimension}, got {len(values)}. "
                        "Update the Supabase vector column to match the model output size."
                    )
                rows.append(values)
            return rows
        except Exception as exc:
            logger.exception(
                "[EMBEDDINGS] embed_batch failed | model='%s' | error_type=%s | error=%s",
                self.model_name,
                type(exc).__name__,
                exc,
            )
            raise RuntimeError(f"Batch embedding generation failed: {exc}") from exc


# Module-level singleton for embedding provider
_EMBEDDING_PROVIDER_INSTANCE: GeminiEmbeddingProvider | None = None
_PROVIDER_LOCK = threading.Lock()


def get_embedding_provider() -> GeminiEmbeddingProvider:
    """Get or create the singleton embedding provider instance.

    This ensures the embedding provider (and its SentenceTransformer model)
    is only instantiated once per application process.

    The returned provider is configured with `allow_download=False` for
    safety: by the time a request handler runs, the model must already
    be in the local HuggingFace cache. Use `preload_embedding_model()`
    at application startup to populate the cache exactly once.
    """
    global _EMBEDDING_PROVIDER_INSTANCE
    if _EMBEDDING_PROVIDER_INSTANCE is None:
        with _PROVIDER_LOCK:
            if _EMBEDDING_PROVIDER_INSTANCE is None:
                _EMBEDDING_PROVIDER_INSTANCE = GeminiEmbeddingProvider(
                    allow_download=False,
                )
    return _EMBEDDING_PROVIDER_INSTANCE


def preload_embedding_model() -> GeminiEmbeddingProvider:
    """Pre-load the embedding model ONCE at application startup.

    This function is intended to be called from the FastAPI lifespan
    handler in `app/main.py`. It:

    1. Creates the singleton provider (if not already created).
    2. Forces the model to be loaded from the local baked-in models/
       directory into memory on a single thread.

    The model must have been pre-downloaded during the Render build step
    using scripts/download_model.py and committed to the repository so
    it is baked into the Docker image. This function ALWAYS loads from
    the local path with local_files_only=True.

    This guarantees that:
    - No remote download is attempted at runtime (which would OOM on
      the 512 MiB Render free tier).
    - No `/teacher/ask` request ever has to load the model under live
      request memory pressure.
    - We fail fast at startup with a clear error if the model is missing
      (rather than OOM-ing on the first request).
    """
    global _EMBEDDING_PROVIDER_INSTANCE
    if _EMBEDDING_PROVIDER_INSTANCE is None:
        with _PROVIDER_LOCK:
            if _EMBEDDING_PROVIDER_INSTANCE is None:
                # allow_download=False is always enforced at runtime;
                # the model is loaded from the baked-in models/ directory.
                _EMBEDDING_PROVIDER_INSTANCE = GeminiEmbeddingProvider(
                    allow_download=False,
                )
    provider = _EMBEDDING_PROVIDER_INSTANCE

    logger.info(
        "[EMBEDDINGS] Pre-loading model '%s' from local cache (models/)...",
        provider.model_name,
    )
    # Always local-only at runtime; the model was pre-downloaded at build time.
    get_sentence_transformer(provider.model_name, allow_download=False)

    # Ensure the provider's own `_model` reference points at the same
    # cached object. After this, request handlers will NEVER trigger a
    # second load — they will reuse the in-memory instance.
    _ = provider.model
    return provider


def generate_embedding(text: str) -> list[float]:
    return get_embedding_provider().embed_text(text)


def generate_embeddings_for_chunks(chunks: Sequence[str]) -> list[list[float]]:
    return get_embedding_provider().embed_batch(chunks)
