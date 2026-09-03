from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_teacher_api_returns_structured_answer_with_sources() -> None:
    with patch("app.api.teacher.RAGRetriever.retrieve") as mock_retrieve, patch(
        "app.lesson.teacher.get_llm_client"
    ) as mock_get_llm:
        mock_retrieve.return_value = [
            {
                "text": "Photosynthesis is the process plants use to make food.",
                "score": 0.95,
                "page": 2,
                "source": "biology.pdf",
                "metadata": {"source": "biology.pdf"},
            }
        ]
        mock_get_llm.return_value.generate_response.return_value = (
            '{"answer": "Plants use sunlight to make food.", '
            '"explanation": "This is a simple process where plants turn light into stored energy.", '
            '"example": "A leaf uses sunlight to make sugar.", '
            '"check_question": "What does sunlight help a plant do?", '
            '"difficulty": "beginner"}'
        )

        response = client.post(
            "/teacher/ask",
            json={"question": "What is photosynthesis?", "level": "beginner"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Plants use sunlight to make food."
    assert payload["difficulty"] == "beginner"
    assert payload["sources"][0]["page"] == 2
    assert payload["sources"][0]["source"] == "biology.pdf"
    assert payload["check_question"] == "What does sunlight help a plant do?"


def test_teacher_api_validates_question_and_level() -> None:
    response = client.post("/teacher/ask", json={"question": "   ", "level": "beginner"})
    assert response.status_code == 422

    response = client.post("/teacher/ask", json={"question": "What is photosynthesis?", "level": "expert"})
    assert response.status_code == 422


def test_teacher_quiz_api_returns_structured_questions_with_sources() -> None:
    with patch("app.api.teacher.RAGRetriever.retrieve") as mock_retrieve, patch(
        "app.lesson.teacher.get_llm_client"
    ) as mock_get_llm:
        mock_retrieve.return_value = [
            {
                "text": "Photosynthesis is the process plants use to make food using sunlight.",
                "score": 0.9,
                "page": 3,
                "source": "biology.pdf",
                "metadata": {"source": "biology.pdf"},
            }
        ]
        mock_get_llm.return_value.generate_response.return_value = (
            '[{"question": "What does photosynthesis help plants do?", '
            '"options": ["Make food", "Sleep", "Move", "Grow roots"], '
            '"correct_answer": "Make food", '
            '"explanation": "The context says plants use sunlight to make food."}]'
        )

        response = client.post(
            "/teacher/quiz",
            json={"topic": "Photosynthesis", "level": "beginner", "number_of_questions": 1},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["difficulty"] == "beginner"
    assert payload["questions"][0]["correct_answer"] == "Make food"
    assert payload["sources"][0]["page"] == 3
    assert payload["sources"][0]["source"] == "biology.pdf"


def test_teacher_quiz_api_validates_input() -> None:
    response = client.post("/teacher/quiz", json={"topic": "   ", "level": "beginner", "number_of_questions": 1})
    assert response.status_code == 422

    response = client.post("/teacher/quiz", json={"topic": "Photosynthesis", "level": "expert", "number_of_questions": 1})
    assert response.status_code == 422

    response = client.post("/teacher/quiz", json={"topic": "Photosynthesis", "level": "beginner", "number_of_questions": 0})
    assert response.status_code == 422


def test_teacher_evaluate_api_returns_feedback_with_score() -> None:
    with patch("app.api.teacher.RAGRetriever.retrieve") as mock_retrieve, patch(
        "app.lesson.teacher.get_llm_client"
    ) as mock_get_llm:
        mock_retrieve.return_value = [
            {
                "text": "Photosynthesis is the process plants use to make food using sunlight.",
                "score": 0.92,
                "page": 2,
                "source": "biology.pdf",
                "metadata": {"source": "biology.pdf"},
            }
        ]
        mock_get_llm.return_value.generate_response.return_value = (
            '{"correct": true, "score": 0.85, "feedback": "Your answer correctly identifies that plants use sunlight to make food.", '
            '"improvement": "Add that this happens through photosynthesis and mention energy storage."}'
        )

        response = client.post(
            "/teacher/evaluate",
            json={"question": "What is photosynthesis?", "student_answer": "Plants use sunlight to make food."},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["correct"] is True
    assert payload["score"] == 0.85
    assert "sunlight" in payload["feedback"]
    assert "photosynthesis" in payload["improvement"]


def test_teacher_evaluate_api_validates_input() -> None:
    response = client.post("/teacher/evaluate", json={"question": "   ", "student_answer": "Plants use sunlight to make food."})
    assert response.status_code == 422

    response = client.post("/teacher/evaluate", json={"question": "What is photosynthesis?", "student_answer": "   "})
    assert response.status_code == 422


def test_chat_endpoint_returns_grounded_answer() -> None:
    with patch("app.api.chat.answer_question") as mock_answer_question:
        mock_answer_question.return_value = {
            "answer": "Newton's First Law says an object remains at rest or in motion unless acted on by a net force.",
            "sources": [
                {"source": "physics.pdf", "page": 2, "score": 0.91, "text": "An object at rest stays at rest..."},
                {"source": "physics.pdf", "page": 5, "score": 0.76, "text": "A body in motion continues in motion..."},
            ],
        }

        response = client.post(
            "/chat",
            json={"question": "What is Newton's First Law?"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Newton's First Law says an object remains at rest or in motion unless acted on by a net force."
    assert payload["sources"][0]["page"] == 2
    assert payload["sources"][0]["content"] == "An object at rest stays at rest..."
    assert payload["sources"][1]["page"] == 5


def test_chat_endpoint_validates_question() -> None:
    response = client.post("/chat", json={"question": "   "})

    assert response.status_code == 422


def test_chat_endpoint_rejects_missing_question_field() -> None:
    """A request missing the 'question' field must return HTTP 422."""
    response = client.post("/chat", json={})

    assert response.status_code == 422


def test_chat_endpoint_rejects_empty_question() -> None:
    """An empty string question must return HTTP 422."""
    response = client.post("/chat", json={"question": ""})

    assert response.status_code == 422


def test_chat_endpoint_rejects_wrong_field_names() -> None:
    """Requests with wrong field names must return HTTP 422."""
    response = client.post("/chat", json={"query": "What is AI?"})
    assert response.status_code == 422

    response = client.post("/chat", json={"message": "What is AI?"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Gemini upstream error handling on /chat
# ---------------------------------------------------------------------------

def test_chat_endpoint_returns_503_on_gemini_quota_error() -> None:
    """When Gemini raises a quota (429) error, /chat must return HTTP 503 with a safe message."""
    with patch("app.api.chat.answer_question") as mock_answer:
        # The LLM client wraps every SDK error in RuntimeError with a quota keyword.
        mock_answer.side_effect = RuntimeError(
            "Gemini API quota has been exhausted. Please try again later."
        )

        response = client.post(
            "/chat",
            json={"question": "What is photosynthesis?"},
        )

    assert response.status_code == 503
    body = response.json()
    assert "detail" in body
    assert "quota" in body["detail"].lower()
    # Ensure no internal SDK details or API keys are leaked.
    assert "GEMINI_API_KEY" not in body["detail"]
    assert "google_genai" not in body["detail"]
    assert "RESOURCE_EXHAUSTED" not in body["detail"]


def test_chat_endpoint_returns_503_on_gemini_unavailable_error() -> None:
    """When Gemini returns 503 for all models (unavailable), /chat must return HTTP 503."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.side_effect = RuntimeError(
            "Gemini is temporarily unavailable. Please try again shortly."
        )

        response = client.post(
            "/chat",
            json={"question": "What is photosynthesis?"},
        )

    assert response.status_code == 503
    body = response.json()
    assert "detail" in body
    assert "temporarily unavailable" in body["detail"].lower()


def test_chat_endpoint_returns_500_on_unexpected_error() -> None:
    """Unexpected internal errors must surface as HTTP 500, but without leaking details."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.side_effect = RuntimeError(
            "Some completely unexpected internal failure: leaked-secret-xyz"
        )

        response = client.post(
            "/chat",
            json={"question": "What is photosynthesis?"},
        )

    assert response.status_code == 500
    body = response.json()
    assert "detail" in body
    # The internal exception message must NOT be exposed in the response detail.
    assert "leaked-secret-xyz" not in body["detail"]
    assert "Some completely unexpected" not in body["detail"]


def test_chat_endpoint_does_not_retry_on_429() -> None:
    """Verify no retry loop is triggered by /chat when Gemini raises 429.

    The LLM client already raises immediately on 429; the API layer must
    not wrap it with any additional retry behaviour.
    """
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.side_effect = RuntimeError(
            "Gemini API quota has been exhausted. Please try again later."
        )

        response = client.post(
            "/chat",
            json={"question": "Trigger 429"},
        )

    assert response.status_code == 503
    # The endpoint must invoke the LLM exactly once — no retries from the API layer.
    assert mock_answer.call_count == 1


# ---------------------------------------------------------------------------
# Dual-mode feature: RAG mode vs general-knowledge mode
# ---------------------------------------------------------------------------


def test_chat_endpoint_rag_mode_when_relevant_chunks_exist() -> None:
    """When relevant PDF chunks are retrieved, the answer should be from RAG."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.return_value = {
            "answer": "Photosynthesis is the process plants use to convert sunlight into energy.",
            "sources": [
                {"source": "biology.pdf", "page": 1, "score": 0.91, "text": "Plants use sunlight..."},
            ],
            "mode": "rag",
        }

        response = client.post(
            "/chat",
            json={"question": "What is photosynthesis?"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "photosynthesis" in payload["answer"].lower()
    assert len(payload["sources"]) == 1
    assert payload["sources"][0]["source"] == "biology.pdf"
    assert payload["sources"][0]["content"] == "Plants use sunlight..."


def test_chat_endpoint_general_mode_when_no_relevant_chunks() -> None:
    """When no relevant chunks exist, use general Gemini knowledge."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.return_value = {
            "answer": (
                "Artificial Intelligence (AI) is a branch of computer science focused on "
                "building machines that can think and learn...\n\n"
                "Examples:\n"
                "1. Voice assistants such as Siri and Alexa...\n"
                "2. Recommendation systems on Netflix...\n"
                "3. Self-driving cars..."
            ),
            "sources": [],
            "mode": "general",
        }

        response = client.post(
            "/chat",
            json={"question": "What is AI?"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "artificial intelligence" in payload["answer"].lower()
    assert payload["sources"] == []
    # No source keys should appear in the response when in general mode
    assert "page" not in payload["sources"]
    assert "score" not in payload["sources"]


def test_chat_endpoint_does_not_return_topic_not_available() -> None:
    """No-PDF mode must NOT return 'topic not available' or any error message."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.return_value = {
            "answer": "Newton's First Law states that an object remains at rest or in motion unless acted upon by an external force.",
            "sources": [],
            "mode": "general",
        }

        response = client.post(
            "/chat",
            json={"question": "Explain Newton's first law."},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "topic not available" not in payload["answer"].lower()
    assert "not available" not in payload["answer"].lower()
    assert payload["sources"] == []


def test_chat_endpoint_includes_examples_in_general_mode() -> None:
    """General-mode answers must include examples."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.return_value = {
            "answer": (
                "Binary is a number system that uses only two digits: 0 and 1.\n\n"
                "Examples:\n"
                "1. The number 5 in binary is 101...\n"
                "2. Computer memory uses binary..."
            ),
            "sources": [],
            "mode": "general",
        }

        response = client.post(
            "/chat",
            json={"question": "What is binary?"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "example" in payload["answer"].lower()


def test_chat_endpoint_empty_sources_for_general_mode() -> None:
    """General mode must return an empty sources list, not null or omitted."""
    with patch("app.api.chat.answer_question") as mock_answer:
        mock_answer.return_value = {
            "answer": "A circle is a round shape where every point on the edge is equidistant from the center.",
            "sources": [],
            "mode": "general",
        }

        response = client.post(
            "/chat",
            json={"question": "What is a circle?"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["sources"] == []
    assert isinstance(payload["sources"], list)
