from __future__ import annotations

import logging
import time
from typing import Any

from google import genai

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MAX_RETRIES_PER_MODEL,
    GEMINI_FALLBACK_MODELS,
    GEMINI_RETRY_DELAY_SECONDS,
    DEFAULT_GEMINI_MODEL,
)



# Suppress the harmless AFC warning that the google_genai SDK emits for
# Models.generate_content() (it always recommends Chat.send_message instead).
# This does not affect functionality — it only reduces log noise.
logging.getLogger("google_genai.models").setLevel(logging.ERROR)


class GeminiClient:
    """Reusable Gemini API client for the AI Teacher service.

    Features:
    - Bounded retry (max 1 attempt per model) for 503 UNAVAILABLE only.
    - Automatic fallback to next model when the current one is unavailable.
    - 429 RESOURCE_EXHAUSTED triggers a clear quota-exceeded message (no retry).
    - All other errors are propagated with their original message.
    - Teacher generation uses plain text prompts with no tools or AFC config.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        client: Any | None = None,
    ) -> None:
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model or DEFAULT_GEMINI_MODEL
        self._client = client

        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is missing. Add it to the .env file before using Gemini features."
            )

    @property
    def client(self) -> Any:
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    @staticmethod
    def _extract_text(response: Any) -> str:
        """Extract plain text from a Gemini response object."""
        text = getattr(response, "text", None)
        if isinstance(text, str) and text.strip():
            return text

        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) or []
            rendered_parts: list[str] = []
            for part in parts:
                part_text = getattr(part, "text", None)
                if isinstance(part_text, str):
                    rendered_parts.append(part_text)
            if rendered_parts:
                return "".join(rendered_parts)

        payload = getattr(response, "to_dict", None)
        if callable(payload):
            try:
                as_dict = payload()
                if isinstance(as_dict, dict):
                    nested = as_dict.get("text") or as_dict.get("output_text")
                    if isinstance(nested, str):
                        return nested
            except Exception:
                pass

        return ""

    @staticmethod
    def _classify_error(exc: Exception) -> tuple[str, str]:
        """Classify a Gemini API exception.

        Returns:
            A (error_type, user_message) tuple.
            error_type is one of: "quota", "unavailable", "other".
        """
        msg = str(exc)

        if any(keyword in msg for keyword in ("429", "RESOURCE_EXHAUSTED", "quota")):
            return ("quota", "Gemini API quota has been exhausted. Please try again later.")
        if any(keyword in msg for keyword in ("503", "UNAVAILABLE", "unavailable", "high demand")):
            return ("unavailable", "Gemini is temporarily unavailable. Please try again shortly.")
        return ("other", f"Gemini API request failed: {msg}")

    def _call_with_model(self, model: str, prompt: str) -> str:
        """Make a single generate_content call with the given model.

        Raises:
            RuntimeError: on any API error.
        """
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
            )
            text = self._extract_text(response)
            if not text:
                raise ValueError("Gemini returned an empty response.")
            return text
        except Exception as exc:  # Re-raise as RuntimeError with a clean message.
            raise RuntimeError(str(exc)) from exc

    def generate_response(self, prompt: str) -> str:
        """Generate a plain-text response from Gemini with bounded retry and fallback.

        Retry/fallback strategy:
          - Only 503 UNAVAILABLE triggers retry (max GEMINI_MAX_RETRIES_PER_MODEL attempts).
          - After exhausting retries on a model, fall back to the next model in the chain.
          - 429 RESOURCE_EXHAUSTED is treated as quota exhaustion — no retry, no fallback.
          - Other errors propagate immediately with their original message.
        """
        # Build the ordered model chain: primary first, then fallbacks.
        all_models = [self.model_name] + [
            m for m in GEMINI_FALLBACK_MODELS if m != self.model_name
        ]

        last_exc: Exception | None = None

        for model in all_models:
            # Number of attempts for this specific model.
            for attempt in range(1, GEMINI_MAX_RETRIES_PER_MODEL + 1):
                try:
                    return self._call_with_model(model, prompt)
                except RuntimeError as exc:
                    error_type, _ = self._classify_error(exc)
                    last_exc = exc

                    if error_type == "quota":
                        # Quota exhaustion — stop immediately, do not retry or fall back.
                        raise RuntimeError(
                            "Gemini API quota has been exhausted. Please try again later."
                        ) from last_exc

                    if error_type == "unavailable":
                        # Only retry if we have attempts left for this model.
                        if attempt < GEMINI_MAX_RETRIES_PER_MODEL:
                            time.sleep(GEMINI_RETRY_DELAY_SECONDS)
                            continue  # Retry the same model.
                        # Exhausted retries for this model — fall through to next model.
                    else:
                        # Unknown / unexpected error — propagate immediately.
                        raise RuntimeError(
                            f"Gemini API request failed: {exc}"
                        ) from exc

            # After exhausting retries on this model, try the next one in the chain.
            # (only reached when error_type == "unavailable")

        # All models exhausted.
        raise RuntimeError(
            "Gemini is temporarily unavailable. Please try again shortly."
        ) from last_exc


def get_gemini_client() -> GeminiClient:
    return GeminiClient()


def generate_response(prompt: str) -> str:
    """Convenience function used by the project for all Gemini calls."""
    return get_gemini_client().generate_response(prompt)
