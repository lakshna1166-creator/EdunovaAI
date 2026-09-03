from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.lesson.teacher import AITeacherService
from app.llm.client import GeminiClient
from app.llm.omni_client import OmniClient
from app.llm.unified import classify_llm_error
from app.rag.retriever import RAGRetriever
from app.services.heygen import generate_teacher_video, is_configured

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teacher", tags=["teacher"])

ALLOWED_LEVELS = {"beginner", "intermediate", "advanced"}

# Public-facing messages for upstream LLM failures (mirrors /chat).
# These intentionally avoid exposing internals (keys, SDK details, raw bodies).
TEACHER_QUOTA_ERROR_MESSAGE = (
    "AI teacher service is temporarily unavailable because the LLM "
    "quota has been exhausted. Please try again later."
)
TEACHER_UNAVAILABLE_ERROR_MESSAGE = (
    "AI teacher service is temporarily unavailable. Please try again shortly."
)
TEACHER_INTERNAL_ERROR_MESSAGE = (
    "An internal error occurred while generating the response. Please try again later."
)


def _classify_generation_error(exc: Exception) -> str:
    """Classify an LLM generation failure as quota/unavailable/other.

    Uses each provider's own classifier first (covers provider-specific
    keywords such as Omni HTTP 402 insufficient_balance), then the unified
    classifier for cross-provider messages. Never exposes secrets.
    """
    try:
        error_type, _ = OmniClient._classify_error(exc)
        if error_type != "other":
            return error_type
        gemini_type, _ = GeminiClient._classify_error(exc)
        if gemini_type != "other":
            return gemini_type
        unified_type, _ = classify_llm_error(exc)
        return unified_type
    except Exception:
        return "other"


def _generation_http_exception(exc: Exception) -> HTTPException:
    """Map an LLM generation failure to quota->503 / unavailable->503 / other->500."""
    error_type = _classify_generation_error(exc)
    if error_type == "quota":
        # Safe observability: category only, no keys or raw provider bodies.
        logger.warning("[TEACHER] LLM quota exhausted (category=quota)")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=TEACHER_QUOTA_ERROR_MESSAGE,
        )
    if error_type == "unavailable":
        logger.warning("[TEACHER] LLM service unavailable (category=unavailable)")
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=TEACHER_UNAVAILABLE_ERROR_MESSAGE,
        )
    # Unexpected internal error — log for operators, return a generic message.
    logger.error("[TEACHER] Unexpected generation error (category=other): %s", type(exc).__name__)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=TEACHER_INTERNAL_ERROR_MESSAGE,
    )


def _build_sources_from_chunks(relevant_chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    for chunk in relevant_chunks:
        metadata = chunk.get("metadata") or {}
        sources.append(
            {
                "page": chunk.get("page") or metadata.get("page"),
                "source": chunk.get("source") or metadata.get("source"),
                "score": float(chunk.get("score") or 0.0),
            }
        )
    return sources


class TeacherAskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question to answer using the retrieved educational material.")
    level: str = Field(default="beginner", min_length=1, description="Student learning level: beginner, intermediate, or advanced.")

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Question must not be empty.")
        return trimmed

    @field_validator("level")
    @classmethod
    def validate_level(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_LEVELS:
            raise ValueError("level must be one of: beginner, intermediate, advanced")
        return normalized

    @property
    def clean_question(self) -> str:
        return self.question.strip()


class TeacherSource(BaseModel):
    page: int | None = None
    source: str | None = None
    score: float | None = None


class VideoInfo(BaseModel):
    status: str
    video_id: str | None = None
    video_url: str | None = None
    error: str | None = None


class TeacherAskResponse(BaseModel):
    answer: str
    explanation: str
    example: str
    check_question: str
    difficulty: str
    sources: list[TeacherSource]
    video: VideoInfo | None = None


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    explanation: str


class TeacherQuizRequest(BaseModel):
    topic: str = Field(..., min_length=1, description="Topic or concept to generate questions for.")
    level: str = Field(default="beginner", min_length=1, description="Student learning level: beginner, intermediate, or advanced.")
    number_of_questions: int = Field(default=5, gt=0, le=10, description="Number of quiz questions to generate.")

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Topic must not be empty.")
        return trimmed

    @field_validator("level")
    @classmethod
    def validate_level(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_LEVELS:
            raise ValueError("level must be one of: beginner, intermediate, advanced")
        return normalized


class TeacherQuizResponse(BaseModel):
    questions: list[QuizQuestion]
    difficulty: str
    sources: list[TeacherSource]


class TeacherEvaluationRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The question being answered by the student.")
    student_answer: str = Field(..., min_length=1, description="The student's response to evaluate.")

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Question must not be empty.")
        return trimmed

    @field_validator("student_answer")
    @classmethod
    def validate_student_answer(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Student answer must not be empty.")
        return trimmed


class TeacherEvaluationResponse(BaseModel):
    correct: bool
    score: float = Field(ge=0.0, le=1.0)
    feedback: str
    improvement: str


@router.post("/ask", response_model=TeacherAskResponse)
async def ask_teacher(payload: TeacherAskRequest) -> dict[str, Any]:
    """Answer a student question with teacher-style explanations using the relevant PDF context."""
    question = payload.clean_question
    level = payload.level.strip().lower()

    try:
        retriever = RAGRetriever()
        relevant_chunks = retriever.retrieve(question=question, top_k=5)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - external retrieval failure path
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Teacher retrieval failed: {exc}",
        ) from exc

    service = AITeacherService()
    try:
        teacher_response = service.generate_response_from_context(question, relevant_chunks, student_level=level)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        # Quota exhaustion (or transient unavailability) must surface as 503
        # with a clear message — never as a generic 500.
        raise _generation_http_exception(exc) from exc

    # Attempt HeyGen video generation (non-blocking for the response).
    # Failures are always converted to a safe status; the text answer
    # is ALWAYS returned to the student regardless of video outcome.
    if is_configured():
        try:
            video_status = generate_teacher_video(question, teacher_response)
        except Exception as exc:  # pragma: no cover - defensive; all HeyGen errors are handled inside the service
            logger.warning("[TEACHER] HeyGen video generation failed: %s", exc)
            video_status = {"status": "failed", "error": "Video generation failed; the text answer is still available."}
    else:
        video_status = {"status": "disabled", "error": "HEYGEN_API_KEY is not configured."}

    return {
        **teacher_response,
        "sources": _build_sources_from_chunks(relevant_chunks),
        "video": video_status,
    }


@router.post("/quiz", response_model=TeacherQuizResponse)
async def create_teacher_quiz(payload: TeacherQuizRequest) -> dict[str, Any]:
    """Generate quiz questions grounded in the educational material retrieved for the topic."""
    topic = payload.topic.strip()
    level = payload.level.strip().lower()
    n_questions = payload.number_of_questions

    try:
        retriever = RAGRetriever()
        relevant_chunks = retriever.retrieve(question=topic, top_k=max(5, n_questions))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - external retrieval failure path
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz retrieval failed: {exc}",
        ) from exc

    service = AITeacherService()
    try:
        quiz_result = service.generate_quiz(
            topic=topic,
            retrieved_context=relevant_chunks,
            student_level=level,
            number_of_questions=n_questions,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise _generation_http_exception(exc) from exc

    return {
        "questions": quiz_result.get("questions", []),
        "difficulty": level,
        "sources": _build_sources_from_chunks(relevant_chunks),
    }


@router.post("/evaluate", response_model=TeacherEvaluationResponse)
async def evaluate_student_answer(payload: TeacherEvaluationRequest) -> dict[str, Any]:
    """Evaluate a student's answer using relevant educational context from the vector database."""
    question = payload.question.strip()
    student_answer = payload.student_answer.strip()

    try:
        retriever = RAGRetriever()
        relevant_chunks = retriever.retrieve(question=question, top_k=5)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - retrieval error path
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation retrieval failed: {exc}",
        ) from exc

    service = AITeacherService()
    try:
        evaluation_result = service.evaluate_answer(
            question=question,
            student_answer=student_answer,
            retrieved_context=relevant_chunks,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise _generation_http_exception(exc) from exc

    return evaluation_result
