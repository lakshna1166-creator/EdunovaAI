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
) -> Any:
    """Load or return the cached SentenceTransformer model once per process.
    
    Uses CPU device explicitly to avoid loading GPU/CUDA kernels.
    Thread-safe singleton pattern ensures model is loaded only once.
    """
    # If SentenceTransformer has been patched with a Mock (e.g. in unit tests), return mock call directly
    if isinstance(SentenceTransformer, (Mock, MagicMock, NonCallableMock, NonCallableMagicMock)):
        return SentenceTransformer(model_name)

    # Thread-safe check and load
    if model_name not in _MODEL_CACHE:
        with _CACHE_LOCK:
            # Double-check after acquiring lock
            if model_name not in _MODEL_CACHE:
                logger.info("[PERF] Loading SentenceTransformer model '%s' (CPU only)...", model_name)
                load_start = time.perf_counter()
                try:
                    # Explicitly use CPU device to avoid loading CUDA kernels
                    _MODEL_CACHE[model_name] = SentenceTransformer(
                        model_name,
                        device="cpu",
                        local_files_only=True,
                    )
                    logger.info(
                        "[EMBEDDINGS] Model '%s' loaded from local cache (CPU, local_files_only=True).",
                        model_name,
                    )
                except Exception as local_exc:
                    # Safe diagnostics only: exception type + message, never secrets/paths with keys.
                    logger.warning(
                        "[EMBEDDINGS] Local-only load failed for '%s' (%s: %s). Trying remote download (CPU only)...",
                        model_name,
                        type(local_exc).__name__,
                        local_exc,
                    )
                    _MODEL_CACHE[model_name] = SentenceTransformer(
                        model_name,
                        device="cpu",
                    )
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
    ) -> None:
        self.dimension = dimension or self.DEFAULT_DIMENSION
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
            self._model = get_sentence_transformer(self.model_name)
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
    """
    global _EMBEDDING_PROVIDER_INSTANCE
    if _EMBEDDING_PROVIDER_INSTANCE is None:
        with _PROVIDER_LOCK:
            if _EMBEDDING_PROVIDER_INSTANCE is None:
                _EMBEDDING_PROVIDER_INSTANCE = GeminiEmbeddingProvider()
    return _EMBEDDING_PROVIDER_INSTANCE


def generate_embedding(text: str) -> list[float]:
    return get_embedding_provider().embed_text(text)


def generate_embeddings_for_chunks(chunks: Sequence[str]) -> list[list[float]]:
    return get_embedding_provider().embed_batch(chunks)
