"""Unified LLM routing: Gemini with 7-key rotation.

This module provides a single entry point for all LLM generation in the application.
All LLM calls go through the centralized Gemini key manager with automatic key rotation.

Interface: ``generate_response(prompt) -> str``
"""
from __future__ import annotations

import logging

from app.core.config import is_gemini_configured

logger = logging.getLogger(__name__)


def get_llm_client() -> "GeminiLLMClient":
    """Return the unified LLM client (Gemini with key rotation).

    Raises:
        ValueError: When no Gemini API key is configured (no secrets exposed).
    """
    if not is_gemini_configured():
        raise ValueError(
            "No Gemini API keys configured. "
            "Set GEMINI_API_KEY_1 (and optionally GEMINI_API_KEY_2 through GEMINI_API_KEY_7) in .env"
        )

    from app.llm.unified import GeminiLLMClient

    return GeminiLLMClient()


def generate_response(prompt: str) -> str:
    """Generate text using Gemini with 7-key rotation.

    This is the main entry point for all LLM generation in the application.
    It uses the centralized key manager to handle quota/rate limits transparently.

    Args:
        prompt: The text prompt to send to Gemini.

    Returns:
        Generated text from Gemini.

    Raises:
        GeminiKeyError: When all configured keys are exhausted.
        RuntimeError: On non-quota errors (e.g., malformed requests).
    """
    if not is_gemini_configured():
        raise ValueError(
            "No Gemini API keys configured. "
            "Set GEMINI_API_KEY_1 (and optionally GEMINI_API_KEY_2 through GEMINI_API_KEY_7) in .env"
        )

    return GeminiLLMClient().generate_response(prompt)


def classify_llm_error(exc: Exception) -> tuple[str, str]:
    """Classify errors into quota/unavailable/other for HTTP response mapping."""
    msg = str(exc).lower()

    # Quota/rate limit errors
    if any(
        k in msg
        for k in (
            "429",
            "resource_exhausted",
            "quota",
            "rate_limit",
            "rate limit",
            "insufficient",
            "billing",
            "exhausted",
        )
    ):
        return ("quota", "quota")

    # Service unavailable errors
    if any(
        k in msg
        for k in (
            "503",
            "502",
            "529",
            "unavailable",
            "overloaded",
            "high demand",
            "temporarily unavailable",
        )
    ):
        return ("unavailable", "unavailable")

    return ("other", "other")


class GeminiLLMClient:
    """Unified LLM client using Gemini with 7-key rotation.

    This client wraps the centralized key manager and provides the single
    unified LLM interface used across the application.
    """

    def __init__(self) -> None:
        """Initialize the unified LLM client."""
        from app.llm.key_manager import get_key_manager

        self._key_manager = get_key_manager()

    def generate_response(self, prompt: str) -> str:
        """Generate text using Gemini with automatic key rotation.

        Args:
            prompt: The text prompt to send to Gemini.

        Returns:
            Generated text from Gemini.

        Raises:
            GeminiKeyError: When all configured keys are exhausted.
            RuntimeError: On non-quota errors.
        """
        return self._key_manager.generate_with_rotation(prompt)

    @staticmethod
    def _classify_error(exc: Exception) -> tuple[str, str]:
        """Classify an exception for HTTP response mapping.

        Args:
            exc: The exception to classify.

        Returns:
            A tuple of (error_type, user_message).
            error_type is one of: "quota", "unavailable", "other".
        """
        return classify_llm_error(exc)
