from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from app.llm.unified import GeminiLLMClient, classify_llm_error
from app.rag.answer import answer_question

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

# Public-facing messages for transient upstream failures.
# These intentionally avoid exposing any internal details (API keys, SDK internals, etc.).
QUOTA_ERROR_MESSAGE = (
    "AI teacher service is temporarily unavailable because the LLM "
    "quota has been exhausted. Please try again later."
)
UNAVAILABLE_ERROR_MESSAGE = (
    "AI teacher service is temporarily unavailable. Please try again shortly."
)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question to answer from the retrieved educational context.")

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Question must not be empty.")
        return trimmed

    @property
    def clean_question(self) -> str:
        return self.question.strip()


class ChatSource(BaseModel):
    page: int | None = None
    content: str = ""
    source: str | None = None
    score: float | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]


def _handle_llm_error(exc: Exception) -> JSONResponse:
    """Classify the upstream error and return an appropriate HTTP response.

    - "quota": HTTP 503 with a safe quota-exhausted message (no API keys exposed).
    - "unavailable": HTTP 503 with a service-unavailable message.
    - "other": HTTP 500 with a generic internal-error message.
    """
    # Use the unified classifier for Gemini errors
    error_type, _ = GeminiLLMClient._classify_error(exc)
    if error_type == "other":
        # Fall back to the unified classifier for cross-provider messages
        error_type, _ = classify_llm_error(exc)

    if error_type == "quota":
        logger.warning("[CHAT] LLM quota exhausted")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": QUOTA_ERROR_MESSAGE},
        )
    if error_type == "unavailable":
        logger.warning("[CHAT] LLM service unavailable")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": UNAVAILABLE_ERROR_MESSAGE},
        )

    # Unexpected internal error — do NOT expose exception details.
    logger.error("[CHAT] Unexpected error during /chat")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred while generating the response. Please try again later."},
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(payload: ChatRequest) -> dict[str, Any]:
    """Answer a question using retrieved context and a grounded Gemini response.

    The request body schema is preserved: { "question": "..." }.
    Missing/empty/whitespace questions are rejected by Pydantic with HTTP 422.

    If the local ONNX embedding runtime has not been initialized at
    startup (because `import onnxruntime` failed or timed out), this
    endpoint returns HTTP 503 immediately rather than blocking for 120 s
    on the import inside the request path.
    """
    # Local import: avoid a module-level cycle on the embeddings package.
    from app.rag.embeddings import (
        is_onnxruntime_initialized,
        is_onnxruntime_failed,
    )

    request_start = time.perf_counter()
    question = payload.clean_question
    logger.info("[CHAT] Request received (len=%d)", len(question))

    # Fast-fail if the ONNX runtime never came up. The request handler
    # must NOT block on `import onnxruntime` (proven to hang/OOM the
    # Render free-tier worker — see production logs).
    if is_onnxruntime_failed():
        logger.error(
            "[CHAT] ONNX runtime not available (failed at startup). "
            "Returning 503."
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": (
                    "The local embedding runtime is not available. "
                    "Please try again later."
                )
            },
        )
    if not is_onnxruntime_initialized():
        logger.error(
            "[CHAT] ONNX runtime not yet initialized. Returning 503."
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": (
                    "The local embedding runtime is initializing. "
                    "Please retry in a few seconds."
                )
            },
        )

    try:
        result = answer_question(question)
    except Exception as exc:  # pragma: no cover - runtime failure path
        return _handle_llm_error(exc)

    formatted_sources: list[dict[str, Any]] = []
    for item in result.get("sources", []) or []:
        formatted_sources.append(
            {
                "page": item.get("page"),
                "content": item.get("text") or "",
                "source": item.get("source"),
                "score": item.get("score"),
            }
        )

    total_time = time.perf_counter() - request_start
    logger.info("[PERF] Total /chat: %.2fs", total_time)

    return {
        "answer": result.get("answer", ""),
        "sources": formatted_sources,
    }
