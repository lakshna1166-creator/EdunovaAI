"""HeyGen AI video generation service.

This service is responsible for:
- Securely reading HEYGEN_API_KEY from the environment (never logged).
- Converting a Teacher Chat answer into a clean educational video script.
- Submitting the script to the HeyGen API to start a video generation job.
- Polling HeyGen's status endpoint with strict time/iteration bounds.
- Returning a small, safe status payload describing the video.

The service is intentionally conservative:
- It never blocks the caller for an unbounded amount of time.
- It never raises on HeyGen errors. All failures are converted into a safe
  status payload with `status: "failed"`.
- The API key is read once and only used to build the Authorization header.
- The key is never returned to the caller and never included in logs.
"""
from __future__ import annotations

import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Any, Mapping

import httpx

from app.core.config import HEYGEN_API_KEY as CONFIGURED_HEYGEN_KEY

logger = logging.getLogger(__name__)


# HeyGen API configuration.
# HeyGen's public REST API base URL. This is the documented endpoint
# for video creation and status polling. See:
# https://docs.heygen.com/reference/create-an-avatar-video-v2
HEYGEN_API_BASE = "https://api.heygen.com"

# Default avatar/voice configuration. These are documented public defaults
# from HeyGen that work for a generic AI teacher video. They can be
# overridden via environment variables if needed.
DEFAULT_AVATAR_ID = os.getenv("HEYGEN_AVATAR_ID", "Daisy-inskirt-20220818")
DEFAULT_VOICE_ID = os.getenv("HEYGEN_VOICE_ID", "2d5b0e6cf36f460aa7fc47e3eee4ba54")

# Strict polling bounds to avoid blocking the Teacher Chat response.
DEFAULT_POLL_TIMEOUT_SECONDS = float(os.getenv("HEYGEN_POLL_TIMEOUT_SECONDS", "20"))
DEFAULT_POLL_INTERVAL_SECONDS = float(os.getenv("HEYGEN_POLL_INTERVAL_SECONDS", "3"))
DEFAULT_POLL_MAX_ITERATIONS = int(os.getenv("HEYGEN_POLL_MAX_ITERATIONS", "6"))

# Cap on script length sent to HeyGen to avoid huge videos.
DEFAULT_SCRIPT_CHAR_LIMIT = int(os.getenv("HEYGEN_SCRIPT_CHAR_LIMIT", "1200"))


@dataclass
class VideoStatus:
    """A safe, serializable representation of a HeyGen video job."""

    status: str
    video_id: str | None = None
    video_url: str | None = None
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "video_id": self.video_id,
            "video_url": self.video_url,
            "error": self.error,
        }


def _get_api_key() -> str | None:
    """Return the HeyGen API key from the environment, or None if missing."""
    # Prefer the centralized config value (loaded from ai-service/.env once),
    # fall back to the process environment for test overrides via monkeypatch.
    configured = (CONFIGURED_HEYGEN_KEY or "").strip()
    if configured:
        return configured
    key = os.getenv("HEYGEN_API_KEY", "").strip()
    return key or None


def is_configured() -> bool:
    """Return True if the HeyGen API key is configured."""
    return _get_api_key() is not None


def _build_script(question: str, answer: Mapping[str, Any]) -> str:
    """Build a clean, educational video script from the teacher answer.

    The script must be natural, grounded in the answer content, and
    free of fabricated facts. It should sound like an AI teacher.
    """
    answer_text = str(answer.get("answer") or "").strip()
    explanation_text = str(answer.get("explanation") or "").strip()
    example_text = str(answer.get("example") or "").strip()
    difficulty = str(answer.get("difficulty") or "beginner").strip() or "beginner"

    parts: list[str] = []
    if question:
        parts.append(f"Hello, let's learn about: {question.strip()}.")
    else:
        parts.append("Hello, let's learn something new today.")

    if answer_text:
        parts.append(f"Answer: {answer_text}")
    if explanation_text:
        parts.append(f"Explanation: {explanation_text}")
    if example_text and example_text.lower() != "no example in the provided material.":
        parts.append(f"Example: {example_text}")

    parts.append(f"This explanation was prepared at a {difficulty} level.")

    script = " ".join(parts)
    # Collapse whitespace and trim to a reasonable length.
    script = re.sub(r"\s+", " ", script).strip()
    if len(script) > DEFAULT_SCRIPT_CHAR_LIMIT:
        script = script[: DEFAULT_SCRIPT_CHAR_LIMIT - 3].rstrip() + "..."
    return script


def _request_video_creation(
    client: httpx.Client,
    api_key: str,
    script: str,
) -> dict[str, Any]:
    """POST a video creation request to HeyGen and return the parsed JSON body.

    HeyGen's documented v2 endpoint for avatar video generation is
    POST /v2/video/generate. The request body accepts `video_inputs`
    with a `character` (avatar), `voice` (voice_id), and `script.text`.
    """
    url = f"{HEYGEN_API_BASE}/v2/video/generate"
    headers = {
        "X-Api-Key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload: dict[str, Any] = {
        "video_inputs": [
            {
                "character": {
                    "type": "avatar",
                    "avatar_id": DEFAULT_AVATAR_ID,
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": DEFAULT_VOICE_ID,
                },
            }
        ],
        "dimension": {"width": 720, "height": 480},
    }
    response = client.post(url, json=payload, headers=headers, timeout=30.0)
    response.raise_for_status()
    body = response.json()
    if not isinstance(body, dict):
        raise ValueError("Unexpected HeyGen response: not a JSON object")
    return body


def _extract_video_id(body: dict[str, Any]) -> str | None:
    """Extract a video/job ID from the HeyGen response.

    The HeyGen v2 API typically returns either:
      - {"data": {"video_id": "..."}}
      - {"data": {"id": "..."}}
    We check a few common keys defensively.
    """
    data = body.get("data")
    if isinstance(data, dict):
        for key in ("video_id", "id", "job_id"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    # Some older endpoints return a top-level id.
    for key in ("video_id", "id", "job_id"):
        value = body.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _request_video_status(
    client: httpx.Client,
    api_key: str,
    video_id: str,
) -> dict[str, Any]:
    """GET the status of a HeyGen video job."""
    url = f"{HEYGEN_API_BASE}/v1/video_status.get"
    headers = {
        "X-Api-Key": api_key,
        "Accept": "application/json",
    }
    params = {"video_id": video_id}
    response = client.get(url, headers=headers, params=params, timeout=20.0)
    response.raise_for_status()
    body = response.json()
    if not isinstance(body, dict):
        raise ValueError("Unexpected HeyGen status response: not a JSON object")
    return body


def _poll_video_until_ready(
    client: httpx.Client,
    api_key: str,
    video_id: str,
    *,
    timeout_seconds: float,
    interval_seconds: float,
    max_iterations: int,
) -> VideoStatus:
    """Poll HeyGen until the video is completed or we hit our bounds."""
    deadline = time.monotonic() + max(0.0, timeout_seconds)
    iterations = 0
    while iterations < max(0, max_iterations) and time.monotonic() < deadline:
        iterations += 1
        try:
            body = _request_video_status(client, api_key, video_id)
        except Exception as exc:  # pragma: no cover - network failure path
            logger.warning("[HEYGEN] Status check failed (iteration=%d): %s", iterations, exc)
            time.sleep(interval_seconds)
            continue

        data = body.get("data") if isinstance(body.get("data"), dict) else body
        status_value = (
            (data or {}).get("status")
            or (data or {}).get("state")
            or body.get("status")
            or ""
        )
        status_value = str(status_value).lower().strip()

        video_url = (
            (data or {}).get("video_url")
            or (data or {}).get("url")
            or (data or {}).get("video_url_caption")
            or body.get("video_url")
        )
        error_message = (
            (data or {}).get("error")
            or (data or {}).get("error_message")
            or body.get("error")
        )

        if status_value in {"completed", "complete", "success", "succeeded", "done"}:
            if video_url:
                return VideoStatus(status="completed", video_id=video_id, video_url=str(video_url))
            return VideoStatus(
                status="completed",
                video_id=video_id,
                error="Completed but no video_url returned by HeyGen.",
            )
        if status_value in {"failed", "error", "canceled", "cancelled"}:
            return VideoStatus(
                status="failed",
                video_id=video_id,
                error=str(error_message) if error_message else f"Video generation {status_value}.",
            )

        time.sleep(interval_seconds)

    return VideoStatus(
        status="processing",
        video_id=video_id,
        error="Video still processing; will be available shortly.",
    )


def generate_teacher_video(
    question: str,
    answer: Mapping[str, Any],
    *,
    poll: bool = True,
    poll_timeout_seconds: float = DEFAULT_POLL_TIMEOUT_SECONDS,
    poll_interval_seconds: float = DEFAULT_POLL_INTERVAL_SECONDS,
    poll_max_iterations: int = DEFAULT_POLL_MAX_ITERATIONS,
) -> dict[str, Any]:
    """Generate (or start generating) a HeyGen teacher video for the given answer.

    Parameters
    ----------
    question:
        The student's question (used to introduce the video).
    answer:
        A mapping with the teacher response fields:
        ``answer``, ``explanation``, ``example``, ``difficulty``.
    poll:
        If True (default), poll the HeyGen status endpoint with strict
        bounds so we can return a final video URL when the video is ready
        quickly. If False, return immediately with ``status="processing"``
        and let the frontend poll a separate endpoint.

    Returns
    -------
    dict
        A safe status payload shaped like::

            {
                "status": "processing" | "completed" | "failed" | "disabled",
                "video_id": "..." | None,
                "video_url": "..." | None,
                "error": "..." | None,
            }
    """
    api_key = _get_api_key()
    if not api_key:
        logger.info("[HEYGEN] No HEYGEN_API_KEY configured; skipping video generation.")
        return VideoStatus(status="disabled", error="HEYGEN_API_KEY is not configured.").to_dict()

    script = _build_script(question, answer)
    if not script:
        return VideoStatus(status="failed", error="Empty script; nothing to generate.").to_dict()

    try:
        with httpx.Client() as client:
            body = _request_video_creation(client, api_key, script)
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code if exc.response is not None else "unknown"
        logger.warning("[HEYGEN] Video creation HTTP %s error", status_code)
        return VideoStatus(
            status="failed",
            error=f"HeyGen video creation failed (HTTP {status_code}).",
        ).to_dict()
    except Exception as exc:
        logger.warning("[HEYGEN] Video creation error: %s", exc)
        return VideoStatus(
            status="failed",
            error="HeyGen video creation failed; the text answer is still available.",
        ).to_dict()

    video_id = _extract_video_id(body)
    if not video_id:
        logger.warning("[HEYGEN] No video_id in response")
        return VideoStatus(
            status="failed",
            error="HeyGen did not return a video_id; the text answer is still available.",
        ).to_dict()

    if not poll:
        return VideoStatus(status="processing", video_id=video_id).to_dict()

    try:
        with httpx.Client() as client:
            final_status = _poll_video_until_ready(
                client,
                api_key,
                video_id,
                timeout_seconds=poll_timeout_seconds,
                interval_seconds=poll_interval_seconds,
                max_iterations=poll_max_iterations,
            )
    except Exception as exc:  # pragma: no cover - network failure path
        logger.warning("[HEYGEN] Polling error: %s", exc)
        return VideoStatus(
            status="processing",
            video_id=video_id,
            error="Polling failed; video will be available shortly.",
        ).to_dict()

    return final_status.to_dict()
