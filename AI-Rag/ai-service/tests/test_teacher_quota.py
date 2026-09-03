"""Teacher LLM error-handling tests: quota->503, HeyGen never 500, no quota masking."""
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
    assert "OMNI_API_KEY" not in body["detail"]
    assert "Bearer" not in body["detail"]


def test_teacher_ask_returns_503_on_omni_402_insufficient_balance() -> None:
    """The real Omni 402 insufficient_balance body must classify as quota -> 503."""
    with (
        patch("app.api.teacher.RAGRetriever.retrieve", return_value=[]),
        patch("app.lesson.teacher.get_llm_client") as mock_get_llm,
    ):
        mock_get_llm.return_value.generate_response.side_effect = RuntimeError(
            "Omni API HTTP 402: "
            '{"error": {"message": "Insufficient wallet balance.", "code": "insufficient_balance"}}'
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


def test_teacher_ask_heygen_failure_never_turns_success_into_500() -> None:
    """A HeyGen crash after successful text generation must still return HTTP 200."""
    with (
        patch("app.api.teacher.RAGRetriever.retrieve", return_value=_chunks()),
        patch("app.lesson.teacher.get_llm_client") as mock_get_llm,
        patch("app.api.teacher.is_configured", return_value=True),
        patch("app.api.teacher.generate_teacher_video", side_effect=RuntimeError("heygen boom")),
    ):
        mock_get_llm.return_value.generate_response.return_value = _OK_TEACHER_JSON
        response = client.post("/teacher/ask", json={"question": "What is photosynthesis?"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Plants use sunlight to make food."
    assert payload["video"]["status"] == "failed"


def test_unified_does_not_fall_back_to_gemini_on_quota() -> None:
    """Omni quota errors must propagate directly, never hidden behind a Gemini fallback."""
    from app.llm import unified

    with (
        patch("app.llm.unified.is_omni_configured", return_value=True),
        patch("app.llm.unified.is_gemini_configured", return_value=True),
        patch("app.llm.omni_client.OmniClient") as mock_omni_cls,
        patch("app.llm.client.GeminiClient") as mock_gemini_cls,
    ):
        mock_omni_cls.return_value.generate_response.side_effect = RuntimeError(
            "LLM quota has been exhausted. Please try again later."
        )
        try:
            unified.generate_response("hello")
        except RuntimeError as exc:
            assert "quota" in str(exc).lower()
        else:
            raise AssertionError("expected quota RuntimeError")
        mock_gemini_cls.assert_not_called()
