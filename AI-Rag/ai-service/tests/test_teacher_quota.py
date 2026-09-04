"""Teacher LLM error-handling tests: quota->503, no quota masking."""
import pytest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_OK_TEACHER_JSON = (
    '{"answer": "Plants use sunlight to make food.", '
    '"explanation": "Plants turn light into stored energy.", '
    '"example": "A leaf uses sunlight to make sugar.", '
    '"check_question": "What does sunlight help a plant do?", '
    '"difficulty": "beginner"}'
)


def _chunks() -> list[dict]:
    return [
        {
            "text": "Photosynthesis is the process plants use to make food.",
            "score": 0.95,
            "page": 2,
            "source": "biology.pdf",
            "metadata": {"source": "biology.pdf"},
        }
    ]


def test_teacher_ask_returns_503_on_llm_quota_error() -> None:
    with (
        patch("app.api.teacher.RAGRetriever.retrieve", return_value=_chunks()),
        patch("app.lesson.teacher.get_llm_client") as mock_get_llm,
    ):
        mock_get_llm.return_value.generate_response.side_effect = RuntimeError(
            "LLM quota has been exhausted. Please try again later."
        )
        response = client.post("/teacher/ask", json={"question": "What is photosynthesis?"})

    assert response.status_code == 503
    body = response.json()
    assert "quota" in body["detail"].lower()
    # Verify no secrets are exposed
    assert "API_KEY" not in body["detail"]
    assert "Bearer" not in body["detail"]


def test_teacher_ask_returns_503_on_rate_limit() -> None:
    """Rate limit errors should classify as quota -> 503."""
    with (
        patch("app.api.teacher.RAGRetriever.retrieve", return_value=[]),
        patch("app.lesson.teacher.get_llm_client") as mock_get_llm,
    ):
        mock_get_llm.return_value.generate_response.side_effect = RuntimeError(
            "429 Rate limit exceeded"
        )
        response = client.post("/teacher/ask", json={"question": "What is artificial intelligence?"})

    assert response.status_code == 503
    assert "quota" in response.json()["detail"].lower()


def test_teacher_ask_returns_503_on_unavailable() -> None:
    with (
        patch("app.api.teacher.RAGRetriever.retrieve", return_value=_chunks()),
        patch("app.lesson.teacher.get_llm_client") as mock_get_llm,
    ):
        mock_get_llm.return_value.generate_response.side_effect = RuntimeError(
            "LLM service is temporarily unavailable. Please try again shortly."
        )
        response = client.post("/teacher/ask", json={"question": "What is photosynthesis?"})

    assert response.status_code == 503
    assert "temporarily unavailable" in response.json()["detail"].lower()


def test_teacher_ask_returns_500_without_leak_on_unexpected_error() -> None:
    with (
        patch("app.api.teacher.RAGRetriever.retrieve", return_value=_chunks()),
        patch("app.lesson.teacher.get_llm_client") as mock_get_llm,
    ):
        mock_get_llm.return_value.generate_response.side_effect = RuntimeError(
            "Some unexpected internal failure: leaked-secret-xyz"
        )
        response = client.post("/teacher/ask", json={"question": "What is photosynthesis?"})

    assert response.status_code == 500
    assert "leaked-secret-xyz" not in response.json()["detail"]


def test_key_rotation_on_quota_error() -> None:
    """Quota errors trigger key rotation in the key manager."""
    from app.llm.key_manager import GeminiKeyError, reset_key_manager

    # This test verifies that the key manager is properly handling quota errors
    # by raising GeminiKeyError when all keys are exhausted
    with patch("app.llm.key_manager.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Both keys fail with quota
        mock_client.models.generate_content.side_effect = [
            RuntimeError("429 Quota exceeded"),
            RuntimeError("429 Quota exceeded"),
        ]
        mock_client_cls.return_value = mock_client

        from app.llm.key_manager import GeminiKeyManager

        # Create manager with mocked keys
        manager = GeminiKeyManager()
        manager._keys = ["key-1", "key-2"]

        with pytest.raises(GeminiKeyError, match="All configured Gemini API keys are currently unavailable"):
            manager.generate_with_rotation("Test prompt")

        # Should have tried both keys
        assert mock_client.models.generate_content.call_count == 2


def test_quota_errors_raise_not_masked() -> None:
    """Quota errors must propagate directly, never hidden."""
    from app.llm.unified import classify_llm_error

    # Test that quota errors are properly classified
    error_type, _ = classify_llm_error(RuntimeError("429 Quota exceeded"))
    assert error_type == "quota"

    error_type, _ = classify_llm_error(RuntimeError("RESOURCE_EXHAUSTED"))
    assert error_type == "quota"
