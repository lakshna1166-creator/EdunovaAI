from unittest.mock import MagicMock

import pytest

from app.lesson.teacher import AITeacherService, TeacherRequest


def test_teacher_service_returns_structured_teaching_response() -> None:
    retriever = MagicMock()
    retriever.retrieve.return_value = [
        {
            "text": "Photosynthesis is the process plants use to convert sunlight into chemical energy.",
            "score": 0.94,
            "page": 2,
            "source": "biology.pdf",
            "metadata": {"user_id": "student-1"},
        }
    ]

    gemini_client = MagicMock()
    gemini_client.generate_response.return_value = (
        '{"answer": "Photosynthesis is how plants use sunlight to make energy.", '
        '"explanation": "Plants capture light energy and turn it into stored chemical energy.", '
        '"example": "A plant in sunlight makes sugar from water and carbon dioxide.", '
        '"check_question": "What does a plant use to make energy in photosynthesis?", '
        '"difficulty": "beginner"}'
    )

    rag_service = MagicMock()
    rag_service.retriever = retriever

    service = AITeacherService(rag_service=rag_service, gemini_client=gemini_client)
    result = service.answer_question("What is photosynthesis?", student_level="beginner", top_k=3)

    assert result["answer"] == "Photosynthesis is how plants use sunlight to make energy."
    assert result["explanation"] == "Plants capture light energy and turn it into stored chemical energy."
    assert result["example"] == "A plant in sunlight makes sugar from water and carbon dioxide."
    assert result["check_question"] == "What does a plant use to make energy in photosynthesis?"
    assert result["difficulty"] == "beginner"

    retriever.retrieve.assert_called_once_with(
        question="What is photosynthesis?",
        top_k=3,
        document_filter=None,
        user_filter=None,
    )
    gemini_client.generate_response.assert_called_once()


def test_teacher_service_falls_back_to_general_knowledge_when_context_missing() -> None:
    """Test that when no PDF chunks are found, teacher falls back to general knowledge."""
    retriever = MagicMock()
    retriever.retrieve.return_value = []

    # Mock Gemini to return valid JSON for general knowledge
    gemini_client = MagicMock()
    gemini_client.generate_response.return_value = '''{
        "answer": "I do not have specific information about that formula in the educational material.",
        "explanation": "The general concept involves gravitational force being proportional to mass and inverse square of distance.",
        "example": "A general example: an apple falling from a tree is affected by Earths gravity.",
        "check_question": "Would you like me to explain gravity using general physics knowledge?",
        "difficulty": "intermediate"
    }'''

    rag_service = MagicMock()
    rag_service.retriever = retriever

    service = AITeacherService(rag_service=rag_service, gemini_client=gemini_client)
    result = service.answer_question("What is the secret formula for gravity?", student_level="intermediate")

    # Verify Gemini WAS called for general knowledge fallback
    gemini_client.generate_response.assert_called_once()
    # Verify response contains generated content
    assert "not available" not in result["answer"].lower(), f"Got: {result['answer']}"
    assert result["difficulty"] == "intermediate", f"Got: {result['difficulty']}"


def test_teacher_request_validates_allowed_levels() -> None:
    request = TeacherRequest(question="Explain photosynthesis", student_level="advanced")
    assert request.student_level == "advanced"

    with pytest.raises(ValueError):
        TeacherRequest(question="Explain photosynthesis", student_level="expert")


def test_teacher_service_accepts_all_supported_levels() -> None:
    retriever = MagicMock()
    retriever.retrieve.return_value = [
        {
            "text": "Plants use sunlight to convert carbon dioxide and water into glucose.",
            "score": 0.87,
            "page": 1,
            "source": "study-guide.pdf",
        }
    ]

    gemini_client = MagicMock()
    gemini_client.generate_response.side_effect = [
        '{"answer": "Plants use sunlight to make food.", '
        '"explanation": "Plants turn sunlight into stored energy in a simple way.", '
        '"example": "A plant uses sunlight to make sugar.", '
        '"check_question": "What does sunlight help a plant do?", '
        '"difficulty": "beginner"}',
        '{"answer": "Plants use sunlight to convert water and carbon dioxide into glucose.", '
        '"explanation": "This process stores energy in chemical form and supports growth.", '
        '"example": "A leaf captures light and helps form sugar.", '
        '"check_question": "What two inputs help the plant make glucose?", '
        '"difficulty": "intermediate"}',
        '{"answer": "Plants use sunlight to drive photosynthesis, converting carbon dioxide and water into glucose.", '
        '"explanation": "This biochemical process stores solar energy in chemical bonds and supports metabolism.", '
        '"example": "In a leaf, chlorophyll absorbs light, then the plant synthesizes stored energy.", '
        '"check_question": "How does light energy become stored chemical energy during photosynthesis?", '
        '"difficulty": "advanced"}',
    ]

    rag_service = MagicMock()
    rag_service.retriever = retriever

    service = AITeacherService(rag_service=rag_service, gemini_client=gemini_client)

    beginner_result = service.answer_question("What is photosynthesis?", student_level="beginner")
    intermediate_result = service.answer_question("What is photosynthesis?", student_level="intermediate")
    advanced_result = service.answer_question("What is photosynthesis?", student_level="advanced")

    assert beginner_result["difficulty"] == "beginner"
    assert intermediate_result["difficulty"] == "intermediate"
    assert advanced_result["difficulty"] == "advanced"
