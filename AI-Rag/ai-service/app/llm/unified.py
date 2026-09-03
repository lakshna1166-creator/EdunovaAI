"""Unified LLM routing: Omni (primary) with Gemini (fallback).

Preserves the existing ``GeminiClient`` untouched while routing all RAG /
Teacher flows through Omni when ``OMNI_API_KEY`` + ``OMNI_API_URL`` are set.

Interface: ``generate_response(prompt) -> str`` — identical for both clients.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.config import is_gemini_configured, is_omni_configured

logger = logging.getLogger(__name__)


def get_llm_client() -> Any:
    """Return the primary LLM client.

    - Omni when configured (preferred).
    - Gemini when Omni is missing but GEMINI_API_KEY is set (legacy fallback).
    - Raises a safe ValueError when neither is configured (no secrets exposed).
    """
    if is_omni_configured():
        from app.llm.omni_client import OmniClient

        return OmniClient()
    if is_gemini_configured():
        from app.llm.client import GeminiClient

        return GeminiClient()
    raise ValueError(
        "OMNI_API_KEY is not configured. Add OMNI_API_KEY and OMNI_API_URL to the .env file."
    )


def generate_response(prompt: str) -> str:
    """Generate via Omni, falling back to Gemini when Omni fails and Gemini is configured.

    Quota exhaustion is never masked by the fallback: when Omni reports
    quota/insufficient-balance, the error propagates immediately so the
    actual provider responsible stays visible (mirrors GeminiClient, which
    never retries or falls back on 429).
    """
    if is_omni_configured():
        from app.llm.omni_client import OmniClient

        try:
            return OmniClient().generate_response(prompt)
        except Exception as exc:
            # Classify with the shared classifier (not the client class itself,
            # which keeps this testable and provider-agnostic). Quota —
            # including Omni HTTP 402 insufficient_balance — is never masked
            # by the Gemini fallback.
            error_type, _ = classify_llm_error(exc)
            if error_type == "quota":
                raise
            if is_gemini_configured():
                logger.warning("[LLM] Omni failed, falling back to Gemini: %s", exc)
                from app.llm.client import GeminiClient

                return GeminiClient().generate_response(prompt)
            raise
    if is_gemini_configured():
        from app.llm.client import GeminiClient

        return GeminiClient().generate_response(prompt)
    raise ValueError(
        "OMNI_API_KEY is not configured. Add OMNI_API_KEY and OMNI_API_URL to the .env file."
    )


def classify_llm_error(exc: Exception) -> tuple[str, str]:
    """Classify errors from either provider into quota/unavailable/other."""
    msg = str(exc)
    if any(k in msg for k in ("429", "402", "RESOURCE_EXHAUSTED", "quota", "Quota",
                              "rate_limit", "RATE_LIMIT", "insufficient",
                              "insufficient_balance", "billing")):
        return ("quota", "quota")
    if any(k in msg for k in ("503", "502", "529", "UNAVAILABLE", "unavailable",
                              "overloaded", "high demand", "temporarily unavailable",
                              "timeout", "Timeout")):
        return ("unavailable", "unavailable")
    return ("other", "other")
