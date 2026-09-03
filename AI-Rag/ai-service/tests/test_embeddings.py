from unittest.mock import MagicMock, patch

import pytest

from app.rag.embeddings import GeminiEmbeddingProvider


def test_embedding_provider_returns_vector() -> None:
    model = MagicMock()
    model.encode.return_value = [0.12, -0.34, 0.56, 0.78]

    with patch("app.rag.embeddings.SentenceTransformer", return_value=model):
        provider = GeminiEmbeddingProvider(dimension=4)
        embedding = provider.embed_text("Photosynthesis is the process plants use to convert sunlight into energy.")

    assert embedding == [0.12, -0.34, 0.56, 0.78]
    assert isinstance(embedding, list)
    assert len(embedding) > 0
    assert all(isinstance(value, float) for value in embedding)
    model.encode.assert_called_once()


def test_embedding_provider_rejects_wrong_dimension() -> None:
    model = MagicMock()
    model.encode.return_value = [0.1, 0.2, 0.3]

    with patch("app.rag.embeddings.SentenceTransformer", return_value=model):
        provider = GeminiEmbeddingProvider(dimension=384)
        with pytest.raises(RuntimeError, match="Local embedding generation failed"):
            provider.embed_text("Photosynthesis uses light.")
