"""Tests for the Gemini LLM client, including retry, fallback, and error handling."""
from unittest.mock import MagicMock, patch

import pytest

from app.llm.client import GeminiClient


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
# Happy path
# ---------------------------------------------------------------------------

def test_generate_response_ok() -> None:
    """Primary model returns 200 — result is returned immediately."""
    mock_resp = _mock_response("Hello, world!")

    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_resp
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")
        result = client.generate_response("Say hello")

    assert result == "Hello, world!"
    mock_client.models.generate_content.assert_called_once_with(
        model="gemini-3.7-flash",
        contents="Say hello",
    )


def test_generate_response_ok_custom_model() -> None:
    """When a custom model is passed, it is used instead of the default."""
    mock_resp = _mock_response("Custom model answer")

    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_resp
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key", model="gemini-2.0-flash")
        client.generate_response("Test")

    mock_client.models.generate_content.assert_called_once_with(
        model="gemini-2.0-flash",
        contents="Test",
    )


# ---------------------------------------------------------------------------
# 429 Quota Exhaustion — no retry, no fallback
# ---------------------------------------------------------------------------

def test_429_no_retry_no_fallback() -> None:
    """429 should raise a quota-exceeded error immediately, without retry or fallback."""
    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = [
            _mock_error("429 RESOURCE_EXHAUSTED: Quota exceeded"),
        ]
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")

        with pytest.raises(RuntimeError, match="quota"):
            client.generate_response("Any prompt")

    # Called exactly once — no retries, no fallback
    assert mock_client.models.generate_content.call_count == 1


# ---------------------------------------------------------------------------
# 503 Unavailable — bounded retry then fallback
# ---------------------------------------------------------------------------

def test_503_retries_then_success(monkeypatch) -> None:
    """With 2 retries configured: first attempt 503, second attempt 503, third succeeds."""
    from app.llm import client as client_module
    monkeypatch.setattr(client_module, "GEMINI_MAX_RETRIES_PER_MODEL", 2)
    monkeypatch.setattr(client_module, "GEMINI_RETRY_DELAY_SECONDS", 0.0)

    mock_resp = _mock_response("Retried and succeeded")

    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = [
            _mock_error("503 UNAVAILABLE: model overloaded"),
            _mock_error("503 UNAVAILABLE: still overloaded"),
            mock_resp,
        ]
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")
        result = client.generate_response("Retry test")

    assert result == "Retried and succeeded"
    assert mock_client.models.generate_content.call_count == 3


def test_503_fallback_to_next_model(monkeypatch) -> None:
    """All retries on primary exhausted → fallback model is tried and succeeds."""
    from app.llm import client as client_module
    monkeypatch.setattr(client_module, "GEMINI_MAX_RETRIES_PER_MODEL", 2)
    monkeypatch.setattr(client_module, "GEMINI_RETRY_DELAY_SECONDS", 0.0)

    mock_resp = _mock_response("Fallback succeeded")

    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Primary fails 2 times, fallback succeeds on first try
        mock_client.models.generate_content.side_effect = [
            _mock_error("503 UNAVAILABLE"),
            _mock_error("503 UNAVAILABLE"),
            mock_resp,
        ]
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")
        result = client.generate_response("Fallback test")

    assert result == "Fallback succeeded"
    # 2 attempts on primary + 1 attempt on fallback = 3 total
    assert mock_client.models.generate_content.call_count == 3
    # Fallback model was actually called
    mock_client.models.generate_content.assert_any_call(
        model="gemini-3.5-flash",
        contents="Fallback test",
    )


def test_503_all_models_exhausted(monkeypatch) -> None:
    """All models return 503 → clear unavailability error is raised."""
    from app.llm import client as client_module
    monkeypatch.setattr(client_module, "GEMINI_MAX_RETRIES_PER_MODEL", 1)
    monkeypatch.setattr(client_module, "GEMINI_RETRY_DELAY_SECONDS", 0.0)

    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # 1 primary + 2 fallbacks = 3 calls, all 503
        mock_client.models.generate_content.side_effect = [
            _mock_error("503 UNAVAILABLE"),
            _mock_error("503 UNAVAILABLE"),
            _mock_error("503 UNAVAILABLE"),
        ]
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")

        with pytest.raises(RuntimeError, match="temporarily unavailable"):
            client.generate_response("Will fail")

    # Exactly 3 calls: primary + 2 fallbacks
    assert mock_client.models.generate_content.call_count == 3


# ---------------------------------------------------------------------------
# Other errors — propagate immediately
# ---------------------------------------------------------------------------

def test_other_error_propagates() -> None:
    """Non-429, non-503 errors are raised immediately without retry."""
    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = [
            _mock_error("500 INTERNAL SERVER ERROR"),
        ]
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")

        with pytest.raises(RuntimeError, match="500 INTERNAL SERVER ERROR"):
            client.generate_response("Will fail")

    assert mock_client.models.generate_content.call_count == 1


# ---------------------------------------------------------------------------
# AFC disabled — no generation_config parameter
# ---------------------------------------------------------------------------

def test_afc_not_passed_to_generate_content() -> None:
    """generate_content is called without automatic_function_calling (not supported by google-genai 2.x).

    The installed google-genai Models.generate_content() does NOT accept
    automatic_function_calling as a keyword argument. Teacher generation has no
    tools, so AFC is irrelevant; we just verify the call is a clean text generation
    request.
    """
    mock_resp = _mock_response("AFC not passed")

    with patch("app.llm.client.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_resp
        mock_client_cls.return_value = mock_client

        client = GeminiClient(api_key="test-key")
        client.generate_response("Check AFC")

    call_kwargs = mock_client.models.generate_content.call_args.kwargs
    # The unsupported kwarg must NOT be passed.
    assert "automatic_function_calling" not in call_kwargs, (
        "automatic_function_calling is not a supported Models.generate_content() kwarg "
        "in google-genai >= 1.x; passing it raises TypeError."
    )
    # Ensure no tools or generation_config are passed (clean text-gen call).
    assert "tools" not in call_kwargs
    assert "config" not in call_kwargs or call_kwargs.get("config") is None


# ---------------------------------------------------------------------------
# Error classification
# ---------------------------------------------------------------------------

def test_error_classification_quota() -> None:
    """429 and RESOURCE_EXHAUSTED map to 'quota'."""
    client = GeminiClient.__new__(GeminiClient)  # bypass __init__
    for keyword in ("429", "RESOURCE_EXHAUSTED", "quota exceeded"):
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
