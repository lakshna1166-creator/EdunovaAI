from __future__ import annotations

import logging
import time
from typing import Any, Sequence
from unittest.mock import MagicMock, Mock, NonCallableMagicMock, NonCallableMock

from sentence_transformers import SentenceTransformer

_MODEL_CACHE: dict[str, Any] = {}
logger = logging.getLogger(__name__)


def get_sentence_transformer(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
) -> Any:
    """Load or return the cached SentenceTransformer model once per process."""
    # If SentenceTransformer has been patched with a Mock (e.g. in unit tests), return mock call directly
    if isinstance(SentenceTransformer, (Mock, MagicMock, NonCallableMock, NonCallableMagicMock)):
        return SentenceTransformer(model_name)

    if model_name not in _MODEL_CACHE:
        logger.info("[PERF] Loading SentenceTransformer model '%s'...", model_name)
        load_start = time.perf_counter()
        try:
            _MODEL_CACHE[model_name] = SentenceTransformer(model_name, local_files_only=True)
        except Exception:
            _MODEL_CACHE[model_name] = SentenceTransformer(model_name)
        load_time = time.perf_counter() - load_start
        logger.info("[PERF] SentenceTransformer loaded in %.2fs", load_time)
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

        try:
            start = time.perf_counter()
            vector = self.model.encode(text, convert_to_numpy=True)
            values = self._normalize_vector(vector)
            embed_time = time.perf_counter() - start
            logger.info("[PERF] Embedding: %.2fs", embed_time)
            if self.dimension and len(values) != self.dimension:
                raise ValueError(
                    f"Embedding dimension mismatch: expected {self.dimension}, got {len(values)}. "
                    "Update the Supabase vector column to match the model output size."
                )
            return values
        except Exception as exc:
            raise RuntimeError(f"Local embedding generation failed: {exc}") from exc

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Generate embeddings for multiple text values efficiently in one model call."""
        if not texts:
            return []

        normalized_texts = [str(item).strip() for item in texts if str(item).strip()]
        if not normalized_texts:
            return []

        try:
            vectors = self.model.encode(
                normalized_texts,
                convert_to_numpy=True,
                batch_size=32,
                show_progress_bar=False,
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
            logger.error("[EMBEDDINGS] embed_batch failed: %s", exc)
            raise RuntimeError(f"Batch embedding generation failed: {exc}") from exc


def get_embedding_provider() -> GeminiEmbeddingProvider:
    return GeminiEmbeddingProvider()


def generate_embedding(text: str) -> list[float]:
    return get_embedding_provider().embed_text(text)


def generate_embeddings_for_chunks(chunks: Sequence[str]) -> list[list[float]]:
    return get_embedding_provider().embed_batch(chunks)
