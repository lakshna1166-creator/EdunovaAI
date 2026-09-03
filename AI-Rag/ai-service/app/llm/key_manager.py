"""Centralized Gemini API key manager with automatic rotation.

This is the single source of truth for Gemini API key rotation in the
application. It loads all configured keys (GEMINI_API_KEY_1 through
GEMINI_API_KEY_7), ignores missing/empty keys, and provides thread-safe
rotation when quota/rate limit errors are detected.

Key rotation behavior:
1. Use Key 1 first.
2. On quota/rate limit error, mark Key 1 unavailable and rotate to Key 2.
3. Continue until an available key succeeds.
4. After successful generation, keep using the same key for subsequent calls.
5. If all configured keys are exhausted, raise a service-unavailable error.

Quota/rate limit detection:
- HTTP 429
- RESOURCE_EXHAUSTED
- "quota" keywords
- "rate limit" keywords
- Other documented quota-related responses

Non-quota errors (e.g., HTTP 400 bad request) do NOT trigger key rotation.
"""
from __future__ import annotations

import logging
import threading
import time
from typing import TYPE_CHECKING, Any

from google import genai

from app.core.config import (
    DEFAULT_GEMINI_MODEL,
    GEMINI_API_KEYS,
    GEMINI_MAX_RETRIES_PER_MODEL,
    GEMINI_RETRY_DELAY_SECONDS,
    is_gemini_configured,
)

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


class GeminiKeyError(Exception):
    """Raised when all configured Gemini API keys are exhausted/unavailable."""


class GeminiKeyManager:
    """Thread-safe manager for Gemini API key rotation.

    Maintains a current key index and rotates to the next available key
    when quota/rate limit errors are detected. Safe for concurrent use
    in FastAPI request handlers.
    """

    def __init__(self, keys: list[str] | None = None) -> None:
        """Initialize the key manager with configured keys.

        Args:
            keys: Optional list of API keys for testing. If None, loads from config.
        """
        if keys is not None:
            self._keys = list(keys)
        elif not is_gemini_configured():
            logger.warning(
                "[GEMINI] No Gemini API keys configured. "
                "Set GEMINI_API_KEY_1 (and optionally GEMINI_API_KEY_2 through GEMINI_API_KEY_7) in .env"
            )
            self._keys = []
        else:
            self._keys = list(GEMINI_API_KEYS)

        self._current_index = 0
        self._lock = threading.Lock()
        logger.info(
            "[GEMINI] Key manager initialized with %d key slot(s)",
            len(self._keys),
        )

    @property
    def total_keys(self) -> int:
        """Return the total number of configured keys."""
        return len(self._keys)

    @property
    def current_slot(self) -> int | None:
        """Return the current key slot number (1-indexed), or None if no keys."""
        if not self._keys:
            return None
        return self._current_index + 1

    def get_current_key(self) -> str | None:
        """Return the current API key, or None if no keys are configured."""
        with self._lock:
            if not self._keys:
                return None
            return self._keys[self._current_index]

    def rotate_to_next_key(self) -> str | None:
        """Rotate to the next available key.

        Returns the new current key, or None if no keys are available.
        Logs the rotation for observability (without exposing key values).
        """
        with self._lock:
            if not self._keys:
                return None

            old_slot = self._current_index + 1
            self._current_index = (self._current_index + 1) % len(self._keys)
            new_slot = self._current_index + 1

            logger.info(
                "[GEMINI] Rotating from key slot %d to key slot %d",
                old_slot,
                new_slot,
            )

            return self._keys[self._current_index]

    def is_quota_error(self, exc: Exception) -> bool:
        """Check if an exception indicates a quota/rate limit error.

        These errors trigger immediate key rotation (no retry).
        """
        msg = str(exc).lower()

        # Check for quota/rate limit keywords
        quota_keywords = [
            "429",
            "resource_exhausted",
            "quota",
            "rate_limit",
            "rate limit",
            "insufficient_quota",
            "insufficient quota",
            "exceeded your current quota",
            "billing",
        ]

        return any(keyword in msg for keyword in quota_keywords)

    def is_invalid_key_error(self, exc: Exception) -> bool:
        """Check if an exception indicates an invalid API key error.

        Invalid key errors are treated as quota errors for rotation purposes.
        """
        msg = str(exc).lower()

        invalid_keywords = [
            "api_key_invalid",
            "invalid api key",
            "authentication failed",
            "unauthenticated",
            "401",
            "403",
        ]

        return any(keyword in msg for keyword in invalid_keywords)

    def generate_with_rotation(
        self,
        prompt: str,
        model: str | None = None,
        max_retries_per_key: int | None = None,
        retry_delay_seconds: float | None = None,
    ) -> str:
        """Generate text using Gemini with automatic key rotation.

        Tries the current key first. On quota/rate limit errors, rotates to
        the next key and retries. Stops when a key succeeds or all keys are exhausted.

        Args:
            prompt: The text prompt to send to Gemini.
            model: Optional model override. Defaults to DEFAULT_GEMINI_MODEL.
            max_retries_per_key: Optional max retries per key for 503 errors.
            retry_delay_seconds: Optional delay between retries.

        Returns:
            Generated text from Gemini.

        Raises:
            GeminiKeyError: When all configured keys are exhausted.
            RuntimeError: On non-quota errors (e.g., malformed requests).
        """
        if not self._keys:
            raise GeminiKeyError(
                "No Gemini API keys configured. "
                "Set GEMINI_API_KEY_1 (and optionally GEMINI_API_KEY_2 through GEMINI_API_KEY_7) in .env"
            )

        model = model or DEFAULT_GEMINI_MODEL
        max_retries = max_retries_per_key if max_retries_per_key is not None else GEMINI_MAX_RETRIES_PER_MODEL
        delay = retry_delay_seconds if retry_delay_seconds is not None else GEMINI_RETRY_DELAY_SECONDS

        # Try each configured key once (with bounded retries for 503 errors)
        keys_tried = 0

        while keys_tried < len(self._keys):
            current_key = self.get_current_key()
            current_slot = self.current_slot

            logger.info(
                "[GEMINI] Using key slot %d (of %d)",
                current_slot,
                len(self._keys),
            )

            # Try this key with bounded retries for 503 errors
            last_error = None
            for attempt in range(1, max_retries + 1):
                try:
                    result = self._call_gemini_api(current_key, model, prompt)
                    logger.info(
                        "[GEMINI] Generation successful using key slot %d",
                        current_slot,
                    )
                    return result

                except Exception as exc:
                    last_error = exc

                    # Check if this is a quota/rate limit error
                    if self.is_quota_error(exc) or self.is_invalid_key_error(exc):
                        logger.warning(
                            "[GEMINI] Key slot %d quota/auth error; rotating",
                            current_slot,
                        )
                        # Break out of retry loop and rotate to next key
                        break

                    # Check if this is a 503 (unavailable) error
                    msg = str(exc).lower()
                    is_503 = any(
                        keyword in msg
                        for keyword in ["503", "unavailable", "overloaded", "high demand"]
                    )

                    if is_503 and attempt < max_retries:
                        logger.warning(
                            "[GEMINI] Key slot %d returned 503, retrying (attempt %d/%d)",
                            current_slot,
                            attempt + 1,
                            max_retries,
                        )
                        time.sleep(delay)
                        continue

                    # If 503 retries exhausted, break out to rotate to next key
                    if is_503:
                        logger.warning(
                            "[GEMINI] Key slot %d 503 retries exhausted; rotating",
                            current_slot,
                        )
                        break

                    # Non-recoverable error: propagate immediately
                    # Don't rotate keys for application errors like malformed requests (HTTP 400)
                    if "400" in msg or "bad request" in msg or ("invalid" in msg and "api key" not in msg):
                        logger.error(
                            "[GEMINI] Non-recoverable error from key slot %d: %s",
                            current_slot,
                            type(exc).__name__,
                        )
                        raise RuntimeError(f"Gemini API request failed: {exc}") from exc

                    # Other unexpected error: propagate
                    logger.error(
                        "[GEMINI] Unexpected error from key slot %d: %s",
                        current_slot,
                        type(exc).__name__,
                    )
                    raise RuntimeError(f"Gemini API request failed: {exc}") from exc

            # If we get here, this key failed (quota or exhausted retries)
            # Rotate to next key
            keys_tried += 1
            if keys_tried < len(self._keys):
                self.rotate_to_next_key()

        # All keys exhausted
        logger.error(
            "[GEMINI] All %d configured key slot(s) exhausted",
            len(self._keys),
        )
        raise GeminiKeyError(
            "All configured Gemini API keys are currently unavailable due to quota/rate limits. "
            "Please try again later or add more API keys."
        )

    def _call_gemini_api(self, api_key: str, model: str, prompt: str) -> str:
        """Make a single Gemini API call.

        Args:
            api_key: The Gemini API key to use.
            model: The model name (e.g., "gemini-2.0-flash").
            prompt: The text prompt.

        Returns:
            Generated text.

        Raises:
            RuntimeError: On any API error (with original message preserved).
        """
        client = genai.Client(api_key=api_key)

        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            # Extract text from response
            text = getattr(response, "text", None)
            if isinstance(text, str) and text.strip():
                return text

            # Fallback: extract from candidates
            candidates = getattr(response, "candidates", None) or []
            for candidate in candidates:
                content = getattr(candidate, "content", None)
                parts = getattr(content, "parts", None) or []
                for part in parts:
                    part_text = getattr(part, "text", None)
                    if isinstance(part_text, str):
                        return part_text

            raise ValueError("Gemini returned an empty response.")

        except Exception as exc:
            # Extract the original error message from the exception chain
            error_msg = str(exc)
            # Check for nested exceptions (from 'from exc')
            if exc.__cause__ is not None:
                error_msg = str(exc.__cause__)
            elif hasattr(exc, 'response') and hasattr(exc.response, 'text'):
                # For httpx errors, try to get the response body
                try:
                    error_msg = str(exc.response.text)
                except Exception:
                    pass
            
            # Re-raise with clear error message that can be classified
            raise RuntimeError(error_msg) from exc


# Module-level singleton instance
_key_manager_instance: GeminiKeyManager | None = None
_key_manager_lock = threading.Lock()


def get_key_manager() -> GeminiKeyManager:
    """Get or create the singleton key manager instance."""
    global _key_manager_instance
    with _key_manager_lock:
        if _key_manager_instance is None:
            _key_manager_instance = GeminiKeyManager()
        return _key_manager_instance


def reset_key_manager() -> None:
    """Reset the singleton instance (useful for testing)."""
    global _key_manager_instance
    with _key_manager_lock:
        _key_manager_instance = None
