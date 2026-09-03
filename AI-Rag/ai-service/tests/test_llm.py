"""Tests for the Gemini LLM client with key rotation.

These tests verify that the GeminiClient uses the centralized key manager
and that error classification works correctly.
"""
from unittest.mock import MagicMock, patch

import pytest

from app.llm.client import GeminiClient
from app.llm.key_manager import GeminiKeyManager


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _mock_response(text: str) -> MagicMock:
    mock = MagicMock()
    mock.text = text
    return mock


def _mock_error(message: str) -> Exception:
    return Exception(message)


# ---------------------------------------------------------------------------
# Happy path tests
# ---------------------------------------------------------------------------

def test_generate_response_ok() -> None:
    """Key manager returns 200 — result is returned immediately."""
    mock_resp = _mock_response("Hello, world!")

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_resp
        mock_client_cls.return_value = mock_client

        client = GeminiClient(model="gemini-2.0-flash")
        result = client.generate_response("Say hello")

    assert result == "Hello, world!"
    mock_client.models.generate_content.assert_called_once_with(
        model="gemini-2.0-flash",
        contents="Say hello",
    )


def test_generate_response_ok_custom_model() -> None:
    """When a custom model is passed, it is used instead of the default."""
    mock_resp = _mock_response("Custom model answer")

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_resp
        mock_client_cls.return_value = mock_client

        client = GeminiClient(model="gemini-2.0-flash-exp")
        result = client.generate_response("Test")

    mock_client.models.generate_content.assert_called_once_with(
        model="gemini-2.0-flash-exp",
        contents="Test",
    )


# ---------------------------------------------------------------------------
# Error classification tests
# ---------------------------------------------------------------------------

def test_error_classification_quota() -> None:
    """429 and RESOURCE_EXHAUSTED map to 'quota'."""
    client = GeminiClient.__new__(GeminiClient)  # bypass __init__
    for keyword in ("429", "RESOURCE_EXHAUSTED", "quota exceeded", "rate limit"):
        err = _mock_error(f"Error: {keyword}")
        kind, msg = client._classify_error(err)
        assert kind == "quota", f"Failed for: {keyword}"


def test_error_classification_unavailable() -> None:
    """503 and UNAVAILABLE map to 'unavailable'."""
    client = GeminiClient.__new__(GeminiClient)
    for keyword in ("503", "UNAVAILABLE", "high demand"):
        err = _mock_error(f"Error: {keyword}")
        kind, msg = client._classify_error(err)
        assert kind == "unavailable", f"Failed for: {keyword}"


def test_error_classification_other() -> None:
    """Unrecognised errors map to 'other'."""
    client = GeminiClient.__new__(GeminiClient)
    for msg in ("500 Internal Error", "network timeout", "some other problem"):
        err = _mock_error(msg)
        kind, _ = client._classify_error(err)
        assert kind == "other", f"Failed for: {msg}"


# ---------------------------------------------------------------------------
# Key rotation integration tests (via GeminiClient)
# ---------------------------------------------------------------------------

def test_client_rotates_on_quota_error() -> None:
    """GeminiClient rotates to next key on quota error."""
    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Key 1 fails with quota, key 2 succeeds
        mock_client.models.generate_content.side_effect = [
            _mock_error("429 Quota exceeded"),
            _mock_response("Success on key 2"),
        ]
        mock_client_cls.return_value = mock_client

        # Create a test manager with specific keys
        test_manager = GeminiKeyManager(keys=["key-1", "key-2"])

        with patch("app.llm.client.get_key_manager", return_value=test_manager):
            client = GeminiClient()
            result = client.generate_response("Test prompt")

    assert result == "Success on key 2"


def test_client_raises_when_all_keys_exhausted() -> None:
    """GeminiClient raises RuntimeError when all keys are exhausted."""
    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Both keys fail with quota
        mock_client.models.generate_content.side_effect = [
            _mock_error("429 Quota exceeded"),
            _mock_error("429 Quota exceeded"),
        ]
        mock_client_cls.return_value = mock_client

        # Create a test manager with specific keys
        test_manager = GeminiKeyManager(keys=["key-1", "key-2"])

        with patch("app.llm.client.get_key_manager", return_value=test_manager):
            client = GeminiClient()

            with pytest.raises(RuntimeError, match="All configured Gemini API keys are currently unavailable"):
                client.generate_response("Test prompt")
