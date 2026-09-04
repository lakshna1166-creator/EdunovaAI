from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any, Sequence
from unittest.mock import MagicMock, Mock, NonCallableMagicMock, NonCallableMock

from sentence_transformers import SentenceTransformer

# Thread-safe model cache with lock for singleton pattern
_MODEL_CACHE: dict[str, Any] = {}
_CACHE_LOCK = threading.Lock()
logger = logging.getLogger(__name__)


def get_sentence_transformer(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    *,
    allow_download: bool = False,
) -> Any:
    """Load or return the cached SentenceTransformer model once per process.

    Uses CPU device explicitly to avoid loading GPU/CUDA kernels.
    Thread-safe singleton pattern ensures model is loaded only once.

    Args:
        model_name: HuggingFace model identifier.
        allow_download: When False (default), only load from local cache.
                        When True, allow remote download. Use True only at
                        application startup (single thread, ample memory).
                        Subsequent calls should pass False so the cached
                        model is returned instantly.
    """
    # If SentenceTransformer has been patched with a Mock (e.g. in unit tests), return mock call directly
    if isinstance(SentenceTransformer, (Mock, MagicMock, NonCallableMock, NonCallableMagicMock)):
        return SentenceTransformer(model_name)

    # Thread-safe check and load
    if model_name not in _MODEL_CACHE:
        with _CACHE_LOCK:
            # Double-check after acquiring lock
            if model_name not in _MODEL_CACHE:
                logger.info(
                    "[PERF] Loading SentenceTransformer model '%s' (CPU, allow_download=%s)...",
                    model_name,
                    allow_download,
                )
                load_start = time.perf_counter()
                try:
                    # Explicitly use CPU device to avoid loading CUDA kernels
                    _MODEL_CACHE[model_name] = SentenceTransformer(
                        model_name,
                        device="cpu",
                        local_files_only=not allow_download,
                    )
                    logger.info(
                        "[EMBEDDINGS] Model '%s' loaded (CPU, local_files_only=%s).",
                        model_name,
                        not allow_download,
                    )
                except Exception as local_exc:
                    if not allow_download:
                        # Already tried local-only; model is not in cache.
                        # Raise immediately — we do NOT want to silently retry
                        # inside a live request (causes OOM on Render).
                        logger.error(
                            "[EMBEDDINGS] Local-only load failed for '%s' "
                            "(%s: %s). The model is not in the HuggingFace cache. "
                            "Ensure the application pre-loads the model at startup "
                            "(which downloads and caches it once).",
                            model_name,
                            type(local_exc).__name__,
                            local_exc,
                        )
                        raise RuntimeError(
                            f"Embedding model '{model_name}' is not cached and "
                            "allow_download=False was passed. "
                            "Ensure the model is pre-loaded at application startup."
                        ) from local_exc
                    # allow_download=True but still failed — something is wrong with network/disk
                    logger.error(
                        "[EMBEDDINGS] Model download failed for '%s' (%s: %s). "
                        "Giving up.",
                        model_name,
                        type(local_exc).__name__,
                        local_exc,
                    )
                    raise RuntimeError(
                        f"Failed to load embedding model '{model_name}': {local_exc}"
                    ) from local_exc
                load_time = time.perf_counter() - load_start
                logger.info("[PERF] SentenceTransformer loaded in %.2fs", load_time)
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
            start = time.perf_counter()
            # NOTE: show_progress_bar=False is REQUIRED here. When it is left as
            # None, sentence-transformers enables the tqdm "Batches" progress bar
            # whenever the root logger level is INFO/DEBUG (which app/main.py sets).
            # tqdm then touches sys.stderr on every request; on Windows server
            # contexts (no console / redirected stderr) that raises
            # OSError: [Errno 22] Invalid argument, surfacing as
            # "Local embedding generation failed: [Errno 22] Invalid argument".
            # embed_batch already passes show_progress_bar=False; keep both in sync.
            vector = self.model.encode(
                cleaned,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            logger.debug(
                "[EMBEDDINGS] encode ok | result_type=%s | shape=%s",
                type(vector).__name__,
                getattr(vector, "shape", None),
            )
            values = self._normalize_vector(vector)
            embed_time = time.perf_counter() - start
            logger.info("[PERF] Embedding: %.2fs", embed_time)
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
            batch_start = time.perf_counter()
            vectors = self.model.encode(
                normalized_texts,
                convert_to_numpy=True,
                batch_size=32,
                show_progress_bar=False,
            )
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
            logger.info("[PERF] Batch embedding: %.2fs for %d text(s)", time.perf_counter() - batch_start, len(rows))
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
    2. Forces the model to be loaded into memory on a single thread.
    3. Permits a one-time remote download (the result is then cached on
       disk for subsequent process restarts, assuming Render persists
       the disk layer across deploys — see notes below).

    If the model is already cached on disk, the call returns almost
    immediately. If not, it downloads once, caches, and returns.

    This guarantees that no `/teacher/ask` request ever has to download
    the model under live request memory pressure (the original Render
    512 MiB OOM cause).
    """
    global _EMBEDDING_PROVIDER_INSTANCE
    # Make sure the singleton provider exists. We temporarily allow the
    # download path so the startup pre-load can populate the local
    # HuggingFace cache if it is empty.
    if _EMBEDDING_PROVIDER_INSTANCE is None:
        with _PROVIDER_LOCK:
            if _EMBEDDING_PROVIDER_INSTANCE is None:
                _EMBEDDING_PROVIDER_INSTANCE = GeminiEmbeddingProvider(
                    allow_download=True,
                )
    provider = _EMBEDDING_PROVIDER_INSTANCE

    # Force eager load with download permission so the model is
    # materialised in this process exactly once. After this returns,
    # _MODEL_CACHE contains the singleton SentenceTransformer instance.
    logger.info(
        "[EMBEDDINGS] Pre-loading model '%s' (startup, allow_download=True)",
        provider.model_name,
    )
    get_sentence_transformer(provider.model_name, allow_download=True)

    # Ensure the provider's own `_model` reference points at the same
    # cached object. After this, request handlers will NEVER trigger a
    # second load — they will reuse the in-memory instance.
    _ = provider.model
    return provider


def generate_embedding(text: str) -> list[float]:
    return get_embedding_provider().embed_text(text)


def generate_embeddings_for_chunks(chunks: Sequence[str]) -> list[list[float]]:
    return get_embedding_provider().embed_batch(chunks)
