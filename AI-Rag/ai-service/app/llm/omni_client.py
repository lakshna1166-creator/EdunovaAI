"""Omni LLM client (OpenAI-compatible Chat Completions).

Uses the centralized configuration from ``app.core.config``::

    OMNI_API_KEY
    OMNI_API_URL  (e.g. https://api.cheaperinference.com/v1)
    OMNI_MODEL    (exact model id from the provider catalog)

The API key is only ever sent as a Bearer header and is never logged,
never returned, and never exposed to the frontend.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.core.config import (
    OMNI_API_KEY,
    OMNI_API_URL,
    OMNI_MAX_RETRIES,
    OMNI_MODEL,
    OMNI_RETRY_DELAY_SECONDS,
    OMNI_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)


class OmniClient:
    """Reusable Omni API client for the AI Teacher service.

    Interface intentionally mirrors :class:`app.llm.client.GeminiClient`
    (``generate_response(prompt) -> str``) so RAG / teacher flows can use
    either backend without schema changes.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = (api_key if api_key is not None else OMNI_API_KEY).strip()
        raw_base = base_url if base_url is not None else OMNI_API_URL
        self.base_url = (raw_base or "").strip().rstrip("/")
        self.model_name = (model if model is not None else OMNI_MODEL).strip() or "gpt-4o-mini"
        self.timeout_seconds = timeout_seconds if timeout_seconds is not None else OMNI_TIMEOUT_SECONDS

        if not self.api_key:
            raise ValueError("OMNI_API_KEY is not configured")
        if not self.base_url:
            raise ValueError("OMNI_API_URL is not configured")

    @staticmethod
    def _classify_error(exc: Exception) -> tuple[str, str]:
        """Classify an Omni/HTTP exception.

        Returns (error_type, user_message) where error_type is one of
        "quota" | "unavailable" | "other". Mirrors GeminiClient semantics
        so ``app/api/chat.py`` can handle both providers uniformly.
        """
        msg = str(exc)

        if any(k in msg for k in ("429", "RESOURCE_EXHAUSTED", "quota", "insufficient",
                                  "rate_limit", "RATE_LIMIT")):
            return ("quota", "LLM quota has been exhausted. Please try again later.")
        if any(k in msg for k in ("503", "502", "529", "UNAVAILABLE", "unavailable",
                                  "overloaded", "high demand", "timeout", "Timeout",
                                  "temporarily unavailable")):
            return ("unavailable", "LLM service is temporarily unavailable. Please try again shortly.")
        # Also treat Gemini-style messages as compatible (fallback path may raise them).
        if "Gemini API quota" in msg:
            return ("quota", "LLM quota has been exhausted. Please try again later.")
        if "Gemini is temporarily unavailable" in msg:
            return ("unavailable", "LLM service is temporarily unavailable. Please try again shortly.")
        return ("other", f"Omni API request failed: {msg}")

    @staticmethod
    def _extract_text(body: Any) -> str:
        """Extract assistant text from an OpenAI-compatible chat response."""
        try:
            if isinstance(body, dict):
                choices = body.get("choices") or []
                if choices and isinstance(choices[0], dict):
                    message = choices[0].get("message") or {}
                    content = message.get("content")
                    if isinstance(content, str) and content.strip():
                        return content
                    # Some providers return content as parts list.
                    if isinstance(content, list):
                        texts = []
                        for part in content:
                            if isinstance(part, dict):
                                t = part.get("text")
                                if isinstance(t, str):
                                    texts.append(t)
                        if texts:
                            return "".join(texts)
                    # Fallback: delta-style or direct text fields.
                    for key in ("text", "output_text"):
                        val = choices[0].get(key)
                        if isinstance(val, str) and val.strip():
                            return val
        except Exception:
            pass
        return ""

    def _call_once(self, prompt: str) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
        }
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                body = response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code if exc.response is not None else "unknown"
            detail = ""
            try:
                if exc.response is not None:
                    detail = str(exc.response.text)[:500]
            except Exception:
                detail = ""
            # Safe observability: provider, model, HTTP status, error category.
            # Never log the API key or authorization headers.
            category, _ = OmniClient._classify_error(
                RuntimeError(f"Omni API HTTP {status_code}: {detail}")
            )
            logger.warning(
                "[OMNI] provider=omni model=%s http_status=%s category=%s",
                self.model_name,
                status_code,
                category,
            )
            raise RuntimeError(f"Omni API HTTP {status_code}: {detail}") from exc
        except Exception as exc:
            # Transport-level failure (timeout, DNS, ...): log category safely.
            category, _ = OmniClient._classify_error(exc)
            logger.warning(
                "[OMNI] provider=omni model=%s http_status=none category=%s error=%s",
                self.model_name,
                category,
                type(exc).__name__,
            )
            raise RuntimeError(str(exc)) from exc

        text = self._extract_text(body)
        if not text or not text.strip():
            raise ValueError("Omni returned an empty response.")
        return text

    def generate_response(self, prompt: str) -> str:
        """Generate plain text via Omni with bounded retry on 503/unavailable only."""
        last_exc: Exception | None = None
        attempts = max(1, OMNI_MAX_RETRIES + 1)
        for attempt in range(1, attempts + 1):
            try:
                return self._call_once(prompt).strip()
            except Exception as exc:
                error_type, _ = self._classify_error(exc)
                last_exc = exc
                if error_type == "quota":
                    raise RuntimeError(
                        "LLM quota has been exhausted. Please try again later."
                    ) from last_exc
                if error_type == "unavailable" and attempt < attempts:
                    time.sleep(OMNI_RETRY_DELAY_SECONDS)
                    continue
                if error_type == "unavailable":
                    raise RuntimeError(
                        "LLM service is temporarily unavailable. Please try again shortly."
                    ) from last_exc
                raise RuntimeError(f"Omni API request failed: {exc}") from exc
        raise RuntimeError(
            "LLM service is temporarily unavailable. Please try again shortly."
        ) from last_exc


def get_omni_client() -> OmniClient:
    return OmniClient()


def generate_response(prompt: str) -> str:
    """Convenience function for Omni calls."""
    return get_omni_client().generate_response(prompt)
