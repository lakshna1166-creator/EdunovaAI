from unittest.mock import MagicMock

import pytest

from app.rag.retriever import RAGRetriever, retrieve_relevant_chunks


def test_retriever_returns_top_chunks() -> None:
    embedding_provider = MagicMock()
    embedding_provider.embed_text.return_value = [0.1, 0.2, 0.3]

    vector_store = MagicMock()
    vector_store.similarity_search.return_value = [
        {
            "text": "Photosynthesis uses sunlight to make food.",
            "score": 0.92,
            "page": 2,
            "source": "biology.pdf",
            "metadata": {"user_id": "student-1"},
        },
        {
            "text": "Chlorophyll absorbs light energy.",
            "score": 0.8,
            "page": 1,
            "source": "biology.pdf",
            "metadata": {"user_id": "student-1"},
        },
    ]

    retriever = RAGRetriever(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        top_k=2,
    )

    results = retriever.retrieve("What is photosynthesis?", top_k=2, user_filter="student-1")

    assert len(results) == 2
    assert results[0]["text"] == "Photosynthesis uses sunlight to make food."
    assert results[0]["page"] == 2
    assert results[0]["source"] == "biology.pdf"
    assert results[0]["score"] == 0.92
    embedding_provider.embed_text.assert_called_once_with("What is photosynthesis?")
    vector_store.similarity_search.assert_called_once_with(query_embedding=[0.1, 0.2, 0.3], top_k=2)


def test_retriever_validates_question() -> None:
    retriever = RAGRetriever(
        embedding_provider=MagicMock(),
        vector_store=MagicMock(),
    )

    with pytest.raises(ValueError, match="question"):
        retriever.retrieve("   ")


def test_retrieve_relevant_chunks_helper() -> None:
    embedding_provider = MagicMock()
    embedding_provider.embed_text.return_value = [1.0, 2.0]

    vector_store = MagicMock()
    vector_store.similarity_search.return_value = [
        {
            "text": "Energy flows from producers to consumers.",
            "score": 0.75,
            "page": 4,
            "source": "science.pdf",
            "metadata": {"user_id": "teacher"},
        }
    ]

    results = retrieve_relevant_chunks(
        question="Tell me about energy flow.",
        top_k=1,
        embedding_provider=embedding_provider,
        vector_store=vector_store,
    )

    assert results[0]["text"] == "Energy flows from producers to consumers."
    assert results[0]["page"] == 4
