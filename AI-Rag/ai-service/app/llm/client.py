"""Gemini LLM client using centralized key rotation.

This module provides the GeminiClient interface for backward compatibility
with existing code. All generation goes through the centralized key manager
which handles automatic key rotation on quota/rate limit errors.
"""
from __future__ import annotations

import logging
from typing import Any

from app.llm.key_manager import get_key_manager

# Suppress the harmless AFC warning that the google_genai SDK emits for
# Models.generate_content() (it always recommends Chat.send_message instead).
# This does not affect functionality — it only reduces log noise.
logging.getLogger("google_genai.models").setLevel(logging.ERROR)


class GeminiClient:
    """Gemini API client with centralized key rotation.

    This client wraps the centralized GeminiKeyManager and provides the same
    interface as before for backward compatibility with existing code.

    Features:
    - Automatic key rotation on quota/rate limit errors (up to 7 keys).
    - Bounded retry (max 1 attempt per key) for 503 UNAVAILABLE only.
    - 429 RESOURCE_EXHAUSTED triggers immediate key rotation (no retry).
    - All other errors are propagated with their original message.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        client: Any | None = None,
    ) -> None:
        """Initialize the Gemini client.

        Args:
            api_key: Ignored (kept for backward compatibility).
                     Keys are loaded from environment via the key manager.
            model: Optional model override. Defaults to gemini-2.0-flash.
            client: Ignored (kept for backward compatibility).
        """
        from app.core.config import DEFAULT_GEMINI_MODEL

        self.model_name = model or DEFAULT_GEMINI_MODEL
        self._client = client

        # Verify at least one key is configured
        from app.core.config import is_gemini_configured

        if not is_gemini_configured():
            raise ValueError(
                "No Gemini API keys configured. "
                "Set GEMINI_API_KEY_1 (and optionally GEMINI_API_KEY_2 through GEMINI_API_KEY_7) in .env"
            )

    @staticmethod
    def _classify_error(exc: Exception) -> tuple[str, str]:
        """Classify a Gemini API exception.

        Returns:
            A (error_type, user_message) tuple.
            error_type is one of: "quota", "unavailable", "other".
        """
        msg = str(exc).lower()

        if any(
            keyword in msg
            for keyword in (
                "429",
                "resource_exhausted",
                "quota",
                "rate_limit",
                "rate limit",
                "exhausted",
            )
        ):
            return ("quota", "Gemini API quota has been exhausted. Please try again later.")

        if any(
            keyword in msg
            for keyword in ("503", "unavailable", "overloaded", "high demand")
        ):
            return ("unavailable", "Gemini is temporarily unavailable. Please try again shortly.")

        return ("other", f"Gemini API request failed: {exc}")

    def generate_response(self, prompt: str) -> str:
        """Generate a plain-text response from Gemini with automatic key rotation.

        This method uses the centralized key manager which:
        1. Tries the current key first.
        2. On quota/rate limit errors, rotates to the next key.
        3. Continues until a key succeeds or all keys are exhausted.

        Returns:
            Generated text from Gemini.

        Raises:
            RuntimeError: When all keys are exhausted or on non-recoverable errors.
        """
        from app.llm.key_manager import GeminiKeyError

        key_manager = get_key_manager()

        try:
            return key_manager.generate_with_rotation(
                prompt=prompt,
                model=self.model_name,
            )
        except GeminiKeyError:
            # All keys exhausted - re-raise as RuntimeError for backward compatibility
            raise RuntimeError(
                "All configured Gemini API keys are currently unavailable due to quota/rate limits. "
                "Please try again later."
            )


def get_gemini_client() -> GeminiClient:
    """Return a new GeminiClient instance (backward compatibility function)."""
    return GeminiClient()


def generate_response(prompt: str) -> str:
    """Convenience function using the default GeminiClient."""
    return get_gemini_client().generate_response(prompt)
