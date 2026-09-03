from __future__ import annotations

import json
import logging
import re
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.llm.client import GeminiClient
from app.llm.unified import get_llm_client
from app.rag.answer import GroundedRAGService
from app.rag.retriever import RAGRetriever

logger = logging.getLogger(__name__)

_FENCE_RE = re.compile(r"```(?:json|JSON)?\s*\n?(.*?)\n?```", re.DOTALL)


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences (```json ... ```) from a string.

    Uses a regex first (most reliable) and falls back to a simple line
    strip if the regex does not match. Returns the original string when
    no fences are present.
    """
    clean = text.strip()
    if not clean.startswith("```"):
        return clean

    match = _FENCE_RE.search(clean)
    if match:
        return match.group(1).strip()

    # Fallback: strip the first and last ``` lines if present.
    lines = clean.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


ALLOWED_STUDENT_LEVELS = {"beginner", "intermediate", "advanced"}


class TeacherRequest(BaseModel):
    question: str = Field(..., min_length=1)
    student_level: str = Field(default="beginner", min_length=1)
    top_k: int = Field(default=5, gt=0)

    @field_validator("student_level")
    @classmethod
    def validate_student_level(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_STUDENT_LEVELS:
            raise ValueError("student_level must be one of: beginner, intermediate, advanced")
        return normalized

    @property
    def question_text(self) -> str:
        return self.question.strip()

    @property
    def level(self) -> str:
        return self.student_level.strip().lower() or "beginner"


class TeacherResponse(BaseModel):
    answer: str
    explanation: str
    example: str
    check_question: str
    difficulty: str


class AITeacherService:
    """Turn retrieved educational context into a student-friendly teaching response."""

    def __init__(
        self,
        rag_service: GroundedRAGService | None = None,
        gemini_client: Any | None = None,
        retriever: RAGRetriever | None = None,
        llm_client: Any | None = None,
    ) -> None:
        self.rag_service = rag_service or GroundedRAGService(retriever=retriever)
        self.gemini_client = llm_client or gemini_client or get_llm_client()
        # Back-compat alias for callers that reference .llm_client.
        self.llm_client = self.gemini_client

    def _build_teacher_prompt(self, question: str, retrieved_context: list[dict[str, Any]], student_level: str) -> str:
        context_text = "\n\n".join(
            f"[Source: {chunk.get('source') or 'unknown'} | Page: {chunk.get('page') or 'unknown'}]\n{chunk.get('text') or ''}"
            for chunk in retrieved_context
        )

        if student_level == "beginner":
            level_instructions = (
                "Use simple vocabulary, short sentences, and step-by-step explanation. "
                "Keep the answer easy to follow for a beginner. Use a basic example only if it is supported by the context."
            )
        elif student_level == "intermediate":
            level_instructions = (
                "Use normal technical terminology. Give a moderate amount of detail and a practical example grounded in the context."
            )
        else:
            level_instructions = (
                "Use deeper reasoning and technical terminology when appropriate. Explain edge cases or deeper implications only if they are supported by the context."
            )

        return (
            "You are an AI teacher helping a student with educational material. "
            "Use only the provided context. If the answer is not present in the context, "
            "say so clearly instead of inventing facts.\n\n"
            f"Student level: {student_level}\n\n"
            f"Adaptation rule: {level_instructions}\n\n"
            "Educational context:\n"
            f"{context_text}\n\n"
            f"Student question: {question}\n\n"
            "Return a JSON object with exactly these keys: "
            "answer, explanation, example, check_question, difficulty.\n"
            "Rules:\n"
            "1. answer: a direct answer to the student's question based only on the context.\n"
            "2. explanation: an explanation adapted to the student's level using the tone and depth specified above.\n"
            "3. example: a short, concrete example only if supported by the context. If no relevant example exists, say 'No example in the provided material.'\n"
            "4. check_question: a short question to verify understanding.\n"
            "5. difficulty: the student's level exactly as given.\n"
            "6. If the relevant answer is not in the provided context, set answer to 'The information is not available in the provided material.' and keep explanation and example consistent with that limitation.\n"
            "7. Do not invent facts or add outside knowledge.\n"
            "Return valid JSON only."
        )

    def _build_general_teacher_prompt(self, question: str, student_level: str) -> str:
        """Build prompt for general knowledge mode (no PDF context available)."""
        if student_level == "beginner":
            level_instructions = (
                "Use simple vocabulary, short sentences, and step-by-step explanation. "
                "Keep the answer easy to follow for a beginner."
            )
        elif student_level == "intermediate":
            level_instructions = (
                "Use normal technical terminology. Give a moderate amount of detail and a practical example."
            )
        else:
            level_instructions = (
                "Use deeper reasoning and technical terminology when appropriate. Explain edge cases or deeper implications."
            )

        return (
            "You are an AI teacher helping a student understand educational topics.\n\n"
            "IMPORTANT: No uploaded PDF material is available. Use your general knowledge to answer.\n\n"
            "STRICT RULES:\n"
            "1. NEVER claim your answer came from a document, chapter, paper, or external source.\n"
            "2. NEVER fabricate: statistics, research papers, URLs, citations, book references, names, dates, or factual claims you are not certain about.\n"
            "3. If you are uncertain about something, say so instead of guessing.\n"
            "4. Examples must be clearly labeled as general knowledge examples, NOT attributed to any document.\n\n"
            f"Student level: {student_level}\n\n"
            f"Adaptation rule: {level_instructions}\n\n"
            f"Student question: {question}\n\n"
            "Return a JSON object with exactly these keys: "
            "answer, explanation, example, check_question, difficulty.\n"
            "Rules:\n"
            "1. answer: a direct, accurate answer to the student's question using your general knowledge.\n"
            "2. explanation: an explanation adapted to the student's level. Be clear and educational.\n"
            "3. example: a short, concrete example to illustrate the concept. Clearly label it as a general knowledge example.\n"
            "4. check_question: a short question to verify understanding.\n"
            "5. difficulty: the student's level exactly as given.\n"
            "6. Do not invent facts. If you cannot answer confidently, say so.\n"
            "Return valid JSON only."
        )

    def generate_response_from_context(
        self,
        question: str,
        retrieved_context: list[dict[str, Any]],
        student_level: str = "beginner",
    ) -> dict[str, str]:
        if not question or not question.strip():
            raise ValueError("question must not be empty.")

        normalized_level = (student_level or "beginner").strip().lower() or "beginner"
        if normalized_level not in ALLOWED_STUDENT_LEVELS:
            raise ValueError("student_level must be one of: beginner, intermediate, advanced")

        if not retrieved_context:
            # No relevant PDF chunks found (above similarity threshold) -> fall back
            # to general knowledge mode so the student still receives a real answer
            # instead of a hardcoded "not available" placeholder. This mirrors the
            # behavior of the /chat endpoint's GroundedRAGService.
            logger.info(
                "[TEACHER] General-knowledge mode: no relevant PDF chunks found. "
                "Falling back to general knowledge (primary LLM)."
            )
            prompt = self._build_general_teacher_prompt(question, normalized_level)
            response_text = self.gemini_client.generate_response(prompt).strip()

            response_data: dict[str, Any] = {
                "answer": "",
                "explanation": "",
                "example": "",
                "check_question": "",
                "difficulty": normalized_level,
            }

            clean_response = _strip_markdown_fences(response_text)
            logger.info("[TEACHER] LLM general-mode response (cleaned): %s", clean_response[:500])

            try:
                parsed = json.loads(clean_response)
                if isinstance(parsed, dict):
                    response_data.update(parsed)
                    logger.info(
                        "[TEACHER] Successfully parsed general-mode JSON, answer: %s",
                        parsed.get("answer", "")[:100],
                    )
            except Exception as exc:
                logger.error(
                    "[TEACHER] General-mode JSON parse failed: %s | Response: %s",
                    exc,
                    clean_response[:200],
                )
                # Fall back to raw text if JSON parsing fails
                if clean_response:
                    response_data["answer"] = clean_response
                    response_data["explanation"] = clean_response

            return {
                "answer": str(response_data.get("answer") or clean_response or "I don't have enough information to answer that right now."),
                "explanation": str(response_data.get("explanation") or response_data.get("answer") or ""),
                "example": str(response_data.get("example") or "No specific example available."),
                "check_question": str(response_data.get("check_question") or "Would you like me to explain any part of this in more detail?"),
                "difficulty": str(response_data.get("difficulty") or normalized_level),
            }

        prompt = self._build_teacher_prompt(question, retrieved_context, normalized_level)
        response_text = self.gemini_client.generate_response(prompt).strip()

        response_data: dict[str, Any] = {
            "answer": "The information is not available in the provided material.",
            "explanation": "The provided material does not contain enough information to answer this question.",
            "example": "No example in the provided material.",
            "check_question": "Can you explain what part of the material you want to understand better?",
            "difficulty": normalized_level,
        }

        # Strip markdown code fences if present (e.g., ```json ... ```)
        clean_response = _strip_markdown_fences(response_text)
        logger.info("[TEACHER] LLM response (cleaned): %s", clean_response[:500])

        try:
            parsed = json.loads(clean_response)
            if isinstance(parsed, dict):
                response_data.update(parsed)
                logger.info("[TEACHER] Successfully parsed JSON, answer: %s", parsed.get("answer", "")[:100])
        except Exception as exc:
            logger.error("[TEACHER] JSON parse failed: %s | Response: %s", exc, clean_response[:200])

        # Use parsed answer if available, otherwise fall back to default
        final_answer = response_data.get("answer")
        if not final_answer or final_answer == "The information is not available in the provided material.":
            final_answer = response_data.get("explanation")

        return {
            "answer": str(final_answer or "The information is not available in the provided material."),
            "explanation": str(response_data.get("explanation") or "The provided material does not contain enough information to answer this question."),
            "example": str(response_data.get("example") or "No example in the provided material."),
            "check_question": str(response_data.get("check_question") or "Can you explain what part of the material you want to understand better?"),
            "difficulty": str(response_data.get("difficulty") or normalized_level),
        }

    def answer_question(
        self,
        question: str,
        student_level: str = "beginner",
        top_k: int = 5,
        document_filter: str | None = None,
        user_filter: str | None = None,
    ) -> dict[str, str]:
        normalized_level = (student_level or "beginner").strip().lower() or "beginner"
        if normalized_level not in ALLOWED_STUDENT_LEVELS:
            raise ValueError("student_level must be one of: beginner, intermediate, advanced")

        retrieved = self.rag_service.retriever.retrieve(
            question=question,
            top_k=top_k,
            document_filter=document_filter,
            user_filter=user_filter,
        )
        return self.generate_response_from_context(question, retrieved, normalized_level)

    def generate_quiz(
        self,
        topic: str,
        retrieved_context: list[dict[str, Any]],
        student_level: str = "beginner",
        number_of_questions: int = 5,
    ) -> dict[str, Any]:
        if not topic or not topic.strip():
            raise ValueError("topic must not be empty.")

        normalized_level = (student_level or "beginner").strip().lower() or "beginner"
        if normalized_level not in ALLOWED_STUDENT_LEVELS:
            raise ValueError("student_level must be one of: beginner, intermediate, advanced")

        if number_of_questions <= 0:
            raise ValueError("number_of_questions must be greater than 0.")

        # Build the prompt - with or without context
        if normalized_level == "beginner":
            level_instruction = "Use simple language, easy vocabulary, and basic conceptual questions."
        elif normalized_level == "intermediate":
            level_instruction = "Use normal technical terminology and moderate detail in the questions and explanations."
        else:
            level_instruction = "Use deeper reasoning, technical terminology, and questions that explore mechanism or nuance."

        has_context = bool(retrieved_context)
        if has_context:
            context_text = "\n\n".join(
                f"[Source: {chunk.get('source') or 'unknown'} | Page: {chunk.get('page') or 'unknown'}]\n{chunk.get('text') or ''}"
                for chunk in retrieved_context
            )
            prompt = (
                "You are creating a multiple-choice quiz from educational material. "
                "Use only the provided context below. Do not invent information outside the material.\n\n"
                f"Topic: {topic}\n"
                f"Student level: {normalized_level}\n"
                f"Level instruction: {level_instruction}\n\n"
                "Educational context:\n"
                f"{context_text}\n\n"
                f"Create exactly {number_of_questions} quiz questions as JSON in this format: "
                "[{\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"correct_answer\": \"...\", \"explanation\": \"...\"}]\n"
                "Rules:\n"
                "1. Every question and answer must be based only on the given context.\n"
                "2. The correct answer must exactly match one of the options.\n"
                "3. Include four options for each question.\n"
                "4. Keep explanations short and grounded in the context.\n"
                "5. Do not add facts that are not in the context.\n"
                "Return valid JSON only."
            )
        else:
            # No PDF context available - fall back to general knowledge so the student
            # still receives real quiz questions instead of an empty quiz.
            prompt = (
                "You are creating a multiple-choice quiz on general educational topics.\n\n"
                "IMPORTANT: No uploaded PDF material is available. Use your general knowledge.\n\n"
                "STRICT RULES:\n"
                "1. NEVER claim your questions came from a document, chapter, paper, or external source.\n"
                "2. NEVER fabricate: statistics, research papers, URLs, citations, book references, names, dates, or factual claims you are not certain about.\n"
                "3. If you are uncertain about something, say so instead of guessing.\n"
                "4. Examples must NEVER be attributed to the user's PDF or any document.\n\n"
                f"Topic: {topic}\n"
                f"Student level: {normalized_level}\n"
                f"Level instruction: {level_instruction}\n\n"
                f"Create exactly {number_of_questions} quiz questions as JSON in this format: "
                "[{\"question\": \"...\", \"options\": [\"...\", \"...\", \"...\", \"...\"], \"correct_answer\": \"...\", \"explanation\": \"...\"}]\n"
                "Rules:\n"
                "1. Every question and answer must be accurate and based on well-established knowledge.\n"
                "2. The correct answer must exactly match one of the options.\n"
                "3. Include four options for each question.\n"
                "4. Keep explanations short and educational.\n"
                "5. Do not invent facts. If the topic is too obscure or uncertain, generate questions on the broader subject area.\n"
                "Return valid JSON only."
            )

        response_text = self.gemini_client.generate_response(prompt).strip()

        # Strip markdown code fences (e.g. ```json ... ```) before parsing.
        clean_response = _strip_markdown_fences(response_text)

        try:
            payload = json.loads(clean_response)
            if isinstance(payload, list):
                return {"questions": payload, "difficulty": normalized_level}
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            logger.warning("[QUIZ] JSON parse failed: %s | Response: %s", exc, clean_response[:200])

        return {"questions": [], "difficulty": normalized_level}

    def evaluate_answer(
        self,
        question: str,
        student_answer: str,
        retrieved_context: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if not question or not question.strip():
            raise ValueError("question must not be empty.")
        if not student_answer or not student_answer.strip():
            raise ValueError("student_answer must not be empty.")

        if not retrieved_context:
            return {
                "correct": False,
                "score": 0.0,
                "feedback": "No relevant material was found for this question, so I cannot evaluate the answer against the provided educational content.",
                "improvement": "Please provide the lesson material or ask about a topic that exists in the uploaded resources.",
            }

        context_text = "\n\n".join(
            f"[Source: {chunk.get('source') or 'unknown'} | Page: {chunk.get('page') or 'unknown'}]\n{chunk.get('text') or ''}"
            for chunk in retrieved_context
        )

        prompt = (
            "You are grading a student's answer using only the provided educational context. "
            "Do not use outside knowledge or make assumptions beyond the material.\n\n"
            "Educational context:\n"
            f"{context_text}\n\n"
            f"Question: {question}\n\n"
            f"Student answer: {student_answer}\n\n"
            "Return valid JSON with exactly these keys: correct, score, feedback, improvement.\n"
            "Rules:\n"
            "1. correct: boolean true/false based only on the educational context.\n"
            "2. score: a float from 0.0 to 1.0, where 1.0 is fully correct.\n"
            "3. feedback: encouraging but honest feedback using the context. Explain what was correct.\n"
            "4. improvement: brief guidance on how to improve, grounded in the same material.\n"
            "5. Do not invent facts or use knowledge outside the material.\n"
            "6. Keep feedback educational and supportive.\n"
            "Return valid JSON only."
        )

        response_text = self.gemini_client.generate_response(prompt).strip()

        try:
            clean_response = _strip_markdown_fences(response_text)
            parsed = json.loads(clean_response)
            if isinstance(parsed, dict):
                correct = bool(parsed.get("correct", False))
                score = float(parsed.get("score", 0.0))
                score = max(0.0, min(1.0, score))
                feedback = str(parsed.get("feedback") or "Your answer is grounded in the course material.")
                improvement = str(parsed.get("improvement") or "Review the relevant material and try to include the key idea more clearly.")
                return {
                    "correct": correct,
                    "score": score,
                    "feedback": feedback,
                    "improvement": improvement,
                }
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            logger.warning("[EVAL] JSON parse failed: %s | Response: %s", exc, clean_response[:200])

        return {
            "correct": False,
            "score": 0.0,
            "feedback": "I could not fully evaluate the answer against the provided educational material.",
            "improvement": "Review the retrieved material and restate the core idea in your own words using the key facts from the lesson.",
        }


def teach_student(
    question: str,
    retrieved_context: list[dict[str, Any]] | None = None,
    student_level: str = "beginner",
    rag_service: GroundedRAGService | None = None,
    gemini_client: Any | None = None,
    retriever: RAGRetriever | None = None,
    llm_client: Any | None = None,
) -> dict[str, str]:
    service = AITeacherService(
        rag_service=rag_service,
        gemini_client=gemini_client,
        retriever=retriever,
        llm_client=llm_client,
    )

    if retrieved_context is not None:
        return service.answer_question(question, student_level=student_level, top_k=max(len(retrieved_context), 1))

    return service.answer_question(question, student_level=student_level)
