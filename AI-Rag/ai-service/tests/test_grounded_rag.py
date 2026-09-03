from unittest.mock import MagicMock

import pytest

from app.rag.answer import GroundedRAGService


def test_grounded_rag_service_generates_answer_from_relevant_chunks() -> None:
    retriever = MagicMock()
    retriever.retrieve.return_value = [
        {
            "text": "Photosynthesis converts sunlight into chemical energy.",
            "score": 0.94,
            "page": 2,
            "source": "biology.pdf",
            "metadata": {"user_id": "student-1"},
        },
        {
            "text": "Chlorophyll absorbs light energy in the leaves.",
            "score": 0.82,
            "page": 1,
            "source": "biology.pdf",
            "metadata": {"user_id": "student-1"},
        },
    ]

    gemini_client = MagicMock()
    gemini_client.generate_response.return_value = "Photosynthesis uses sunlight to make chemical energy."

    service = GroundedRAGService(retriever=retriever, gemini_client=gemini_client)

    result = service.generate("What is photosynthesis?", top_k=2)

    assert result["answer"] == "Photosynthesis uses sunlight to make chemical energy."
    assert result["sources"][0]["source"] == "biology.pdf"
    assert result["sources"][0]["page"] == 2
    assert result["sources"][1]["page"] == 1

    prompt = gemini_client.generate_response.call_args[0][0]
    assert "EduNovaAI" in prompt
    assert "Photosynthesis converts sunlight into chemical energy." in prompt
    assert "biology.pdf" in prompt
    assert "Student question: What is photosynthesis?" in prompt
    assert "Photosynthesis uses sunlight to make chemical energy." not in prompt

    retriever.retrieve.assert_called_once_with(
        "What is photosynthesis?",
        top_k=2,
        document_filter=None,
        user_filter=None,
    )


def test_grounded_rag_service_uses_general_knowledge_when_no_relevant_chunks() -> None:
    """When no relevant chunks are retrieved, Gemini general knowledge is used."""
    retriever = MagicMock()
    retriever.retrieve.return_value = []
    gemini_client = MagicMock()
    gemini_client.generate_response.return_value = (
        "Gravity is a force that attracts objects with mass toward one another."
    )

    service = GroundedRAGService(retriever=retriever, gemini_client=gemini_client)

    result = service.generate("What is the secret formula for gravity?")

    # General-knowledge mode: empty sources, real Gemini answer, no fake message.
    assert result["sources"] == []
    assert result["answer"] == (
        "Gravity is a force that attracts objects with mass toward one another."
    )
    # Gemini must be called exactly once for general mode.
    gemini_client.generate_response.assert_called_once()
    # The general-knowledge prompt must be used.
    sent_prompt = gemini_client.generate_response.call_args[0][0]
    assert "general knowledge" in sent_prompt.lower()
    assert "Student question: What is the secret formula for gravity?" in sent_prompt
