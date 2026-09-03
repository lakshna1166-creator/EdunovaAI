"""Tests for the retriever relevance threshold and the dual-mode RAG service."""
from __future__ import annotations

from unittest.mock import MagicMock

from app.rag.answer import GroundedRAGService, SYSTEM_PROMPT_GENERAL, SYSTEM_PROMPT_RAG
from app.rag.retriever import RAGRetriever


def _make_chunk(text: str, score: float, source: str = "test.pdf", page: int = 1) -> dict:
    return {
        "text": text,
        "score": score,
        "page": page,
        "source": source,
        "metadata": {"source": source},
    }


def test_retriever_filters_chunks_below_threshold() -> None:
    """Chunks with score < threshold should be dropped from retrieval."""
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = [
        _make_chunk("Highly relevant chunk", 0.95),
        _make_chunk("Somewhat relevant chunk", 0.78),
        _make_chunk("Barely relevant chunk", 0.65),
        _make_chunk("Irrelevant chunk", 0.30),
    ]

    mock_embed = MagicMock()
    mock_embed.embed_text.return_value = [0.1] * 384

    retriever = RAGRetriever(
        embedding_provider=mock_embed,
        vector_store=mock_store,
        top_k=5,
        similarity_threshold=0.75,
    )

    results = retriever.retrieve("test question")

    assert len(results) == 2
    assert all(chunk["score"] >= 0.75 for chunk in results)


def test_retriever_disables_threshold_with_zero() -> None:
    """Passing similarity_threshold=0.0 keeps all chunks (no filtering)."""
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = [
        _make_chunk("Chunk 1", 0.10),
        _make_chunk("Chunk 2", 0.05),
    ]

    mock_embed = MagicMock()
    mock_embed.embed_text.return_value = [0.1] * 384

    retriever = RAGRetriever(
        embedding_provider=mock_embed,
        vector_store=mock_store,
        top_k=5,
        similarity_threshold=0.0,
    )

    results = retriever.retrieve("test question")

    # With threshold=0.0, every non-negative score passes.
    assert len(results) == 2


def test_retriever_returns_empty_when_all_below_threshold() -> None:
    """All chunks below threshold -> empty list -> general mode triggered."""
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = [
        _make_chunk("Chunk 1", 0.30),
        _make_chunk("Chunk 2", 0.10),
    ]

    mock_embed = MagicMock()
    mock_embed.embed_text.return_value = [0.1] * 384

    retriever = RAGRetriever(
        embedding_provider=mock_embed,
        vector_store=mock_store,
        top_k=5,
        similarity_threshold=0.50,
    )

    results = retriever.retrieve("test question")

    assert results == []


def test_rag_service_uses_pdf_prompt_when_chunks_available() -> None:
    """When relevant chunks are present, the RAG/teacher prompt is sent to Gemini."""
    mock_retriever = MagicMock()
    mock_retriever.top_k = 5
    mock_retriever.similarity_threshold = 0.75
    mock_retriever.retrieve.return_value = [
        _make_chunk("Photosynthesis is how plants make food.", 0.92, source="biology.pdf"),
    ]

    mock_gemini = MagicMock()
    mock_gemini.generate_response.return_value = (
        "Plants use sunlight to make food via photosynthesis."
    )

    service = GroundedRAGService(
        retriever=mock_retriever,
        gemini_client=mock_gemini,
    )

    result = service.generate("What is photosynthesis?")

    assert result["mode"] == "rag"
    assert result["answer"] == "Plants use sunlight to make food via photosynthesis."
    assert len(result["sources"]) == 1

    sent_prompt = mock_gemini.generate_response.call_args.args[0]
    assert "EduNovaAI" in sent_prompt
    assert "uploaded PDF" in sent_prompt
    assert "biology.pdf" in sent_prompt


def test_rag_service_uses_general_prompt_when_no_chunks() -> None:
    """When no chunks are retrieved, the general-knowledge prompt is sent to Gemini."""
    mock_retriever = MagicMock()
    mock_retriever.top_k = 5
    mock_retriever.similarity_threshold = 0.75
    mock_retriever.retrieve.return_value = []

    mock_gemini = MagicMock()
    mock_gemini.generate_response.return_value = (
        "Artificial Intelligence (AI) is the simulation of human intelligence "
        "by computers.\n\nExamples:\n1. Voice assistants\n2. Self-driving cars"
    )

    service = GroundedRAGService(
        retriever=mock_retriever,
        gemini_client=mock_gemini,
    )

    result = service.generate("What is AI?")

    assert result["mode"] == "general"
    assert result["sources"] == []
    assert "Artificial Intelligence" in result["answer"]

    sent_prompt = mock_gemini.generate_response.call_args.args[0]
    assert "general knowledge" in sent_prompt.lower()
    assert "uploaded PDF" not in sent_prompt


def test_rag_service_calls_gemini_exactly_once_per_request() -> None:
    """For every request, Gemini must be called exactly once."""
    mock_retriever = MagicMock()
    mock_retriever.top_k = 5
    mock_retriever.similarity_threshold = 0.75
    mock_retriever.retrieve.return_value = []

    mock_gemini = MagicMock()
    mock_gemini.generate_response.return_value = "Some answer"

    service = GroundedRAGService(
        retriever=mock_retriever,
        gemini_client=mock_gemini,
    )

    service.generate("Question 1")
    service.generate("Question 2")

    assert mock_gemini.generate_response.call_count == 2


def test_rag_service_general_mode_response_structure() -> None:
    """The response model is preserved: { answer, sources }."""
    mock_retriever = MagicMock()
    mock_retriever.top_k = 5
    mock_retriever.similarity_threshold = 0.75
    mock_retriever.retrieve.return_value = []

    mock_gemini = MagicMock()
    mock_gemini.generate_response.return_value = "Some general answer."

    service = GroundedRAGService(
        retriever=mock_retriever,
        gemini_client=mock_gemini,
    )

    result = service.generate("Anything")

    assert "answer" in result
    assert "sources" in result
    assert result["sources"] == []
    assert isinstance(result["sources"], list)


def test_system_prompts_contain_anti_hallucination_rules() -> None:
    """Both prompts must contain explicit anti-hallucination rules."""
    # RAG prompt: must not invent unsupported facts
    assert "must not invent" in SYSTEM_PROMPT_RAG.lower()
    # RAG prompt: must not pretend general knowledge came from the PDF
    assert "not pretend" in SYSTEM_PROMPT_RAG.lower()
    # RAG prompt: DO NOT GUESS instruction
    assert "do not guess" in SYSTEM_PROMPT_RAG.lower()
    # RAG prompt: accuracy priority
    assert "accuracy is more important" in SYSTEM_PROMPT_RAG.lower()
    # RAG prompt: uncertainty fallback (exact phrase from prompt)
    assert "i couldn't find enough information" in SYSTEM_PROMPT_RAG.lower()

    # General prompt: never claim the answer came from a document
    assert "never claim" in SYSTEM_PROMPT_GENERAL.lower()
    # General prompt: never fabricate facts
    assert "never fabricate" in SYSTEM_PROMPT_GENERAL.lower()
    # General prompt: accuracy priority
    assert "accuracy is more important" in SYSTEM_PROMPT_GENERAL.lower()
    # General prompt: clear uncertainty when uncertain (exact phrase from prompt)
    assert "i don't have enough reliable information" in SYSTEM_PROMPT_GENERAL.lower()
    # General prompt: examples must not be attributed to the PDF
    assert "must never be attributed to the user's pdf" in SYSTEM_PROMPT_GENERAL.lower()


def test_retriever_preserves_top_k_5() -> None:
    """The retriever must keep its top_k=5 default behavior."""
    mock_store = MagicMock()
    mock_store.similarity_search.return_value = [
        _make_chunk(f"Chunk {i}", 0.9 - i * 0.01) for i in range(10)
    ]

    mock_embed = MagicMock()
    mock_embed.embed_text.return_value = [0.1] * 384

    retriever = RAGRetriever(
        embedding_provider=mock_embed,
        vector_store=mock_store,
        top_k=5,
        similarity_threshold=0.0,
    )

    results = retriever.retrieve("test question")

    assert len(results) == 5  # top_k=5
