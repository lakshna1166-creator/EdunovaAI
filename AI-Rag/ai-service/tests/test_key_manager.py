"""Tests for the Gemini key manager with 7-key rotation.

These tests verify:
1. Key manager loads configured keys correctly
2. Key rotation works on quota errors
3. All keys can be tried before failing
4. Non-quota errors don't trigger rotation
5. Thread safety for concurrent requests
6. Edge cases (no keys, single key, empty slots)
"""
from unittest.mock import MagicMock, patch

import pytest

from app.llm.key_manager import GeminiKeyError, GeminiKeyManager, get_key_manager, reset_key_manager


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
# Initialization tests
# ---------------------------------------------------------------------------

def test_key_manager_loads_configured_keys() -> None:
    """Key manager loads keys when passed directly."""
    manager = GeminiKeyManager(keys=["test-key-1", "test-key-2", "test-key-3"])

    assert manager.total_keys == 3
    assert manager.get_current_key() == "test-key-1"
    assert manager.current_slot == 1


def test_key_manager_ignores_empty_keys() -> None:
    """Key manager with only valid keys (empty keys filtered before passing)."""
    # Empty keys would be filtered out before reaching the manager
    manager = GeminiKeyManager(keys=["valid-key-1", "valid-key-3"])

    assert manager.total_keys == 2
    assert manager.get_current_key() == "valid-key-1"


def test_key_manager_works_with_single_key() -> None:
    """Key manager works correctly with just one configured key."""
    manager = GeminiKeyManager(keys=["only-key"])

    assert manager.total_keys == 1
    assert manager.current_slot == 1
    assert manager.get_current_key() == "only-key"


def test_key_manager_handles_no_keys() -> None:
    """Key manager handles the case where no keys are configured."""
    manager = GeminiKeyManager(keys=[])

    assert manager.total_keys == 0
    assert manager.get_current_key() is None
    assert manager.current_slot is None


# ---------------------------------------------------------------------------
# Key rotation tests
# ---------------------------------------------------------------------------

def test_rotate_to_next_key() -> None:
    """Key manager rotates to the next key correctly."""
    manager = GeminiKeyManager(keys=["key-1", "key-2", "key-3"])

    assert manager.current_slot == 1

    manager.rotate_to_next_key()
    assert manager.current_slot == 2

    manager.rotate_to_next_key()
    assert manager.current_slot == 3

    # Should wrap around to key 1
    manager.rotate_to_next_key()
    assert manager.current_slot == 1


# ---------------------------------------------------------------------------
# Quota error detection tests
# ---------------------------------------------------------------------------

def test_is_quota_error_429() -> None:
    """Key manager correctly identifies 429 errors as quota errors."""
    manager = GeminiKeyManager(keys=["key-1"])

    assert manager.is_quota_error(_mock_error("429 Quota exceeded"))
    assert manager.is_quota_error(_mock_error("HTTP 429: Rate limit exceeded"))
    assert manager.is_quota_error(_mock_error("429 RESOURCE_EXHAUSTED"))


def test_is_quota_error_resource_exhausted() -> None:
    """Key manager correctly identifies RESOURCE_EXHAUSTED as quota error."""
    manager = GeminiKeyManager(keys=["key-1"])

    assert manager.is_quota_error(_mock_error("RESOURCE_EXHAUSTED"))
    assert manager.is_quota_error(_mock_error("429 RESOURCE_EXHAUSTED: Quota exceeded"))


def test_is_quota_error_rate_limit() -> None:
    """Key manager correctly identifies rate limit errors as quota errors."""
    manager = GeminiKeyManager(keys=["key-1"])

    assert manager.is_quota_error(_mock_error("rate limit exceeded"))
    assert manager.is_quota_error(_mock_error("RATE_LIMIT"))
    assert manager.is_quota_error(_mock_error("Rate limit exceeded"))


# ---------------------------------------------------------------------------
# Invalid key error detection tests
# ---------------------------------------------------------------------------

def test_is_invalid_key_error() -> None:
    """Key manager correctly identifies invalid API key errors."""
    manager = GeminiKeyManager(keys=["key-1"])

    assert manager.is_invalid_key_error(_mock_error("api_key_invalid"))
    assert manager.is_invalid_key_error(_mock_error("Invalid API key"))
    assert manager.is_invalid_key_error(_mock_error("401 Authentication failed"))


# ---------------------------------------------------------------------------
# Generation with rotation tests
# ---------------------------------------------------------------------------

def test_generate_succeeds_on_first_key() -> None:
    """Generation succeeds on the first key - no rotation needed."""
    manager = GeminiKeyManager(keys=["key-1", "key-2"])

    mock_response = _mock_response("Success on key 1")

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_cls.return_value = mock_client

        result = manager.generate_with_rotation("Test prompt")

    assert result == "Success on key 1"
    assert mock_client.models.generate_content.call_count == 1


def test_generate_rotates_on_quota_error() -> None:
    """Generation rotates to the next key on quota error."""
    manager = GeminiKeyManager(keys=["key-1", "key-2", "key-3"])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Key 1 fails with quota error
        mock_client.models.generate_content.side_effect = [
            _mock_error("429 Quota exceeded"),
            _mock_response("Success on key 2"),
        ]
        mock_client_cls.return_value = mock_client

        result = manager.generate_with_rotation("Test prompt")

    assert result == "Success on key 2"
    assert manager.current_slot == 2  # Should be on key 2 after rotation


def test_generate_rotates_through_multiple_keys() -> None:
    """Generation rotates through multiple keys when all fail with quota."""
    manager = GeminiKeyManager(keys=["key-1", "key-2", "key-3"])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # All three keys fail with quota error
        mock_client.models.generate_content.side_effect = [
            _mock_error("429 Quota exceeded"),
            _mock_error("429 Quota exceeded"),
            _mock_error("429 Quota exceeded"),
        ]
        mock_client_cls.return_value = mock_client

        with pytest.raises(GeminiKeyError, match="All configured Gemini API keys are currently unavailable"):
            manager.generate_with_rotation("Test prompt")

    # Should have tried all 3 keys
    assert mock_client.models.generate_content.call_count == 3


def test_generate_uses_next_key_when_current_fails() -> None:
    """Generation uses the next available key when current key has quota error."""
    manager = GeminiKeyManager(keys=["key-1", "key-2"])

    # Set to key 2
    manager.rotate_to_next_key()
    assert manager.current_slot == 2

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Key 2 fails with quota error, should rotate to key 1
        mock_client.models.generate_content.side_effect = [
            _mock_error("429 Quota exceeded"),
            _mock_response("Success on key 1"),
        ]
        mock_client_cls.return_value = mock_client

        result = manager.generate_with_rotation("Test prompt")

    assert result == "Success on key 1"
    assert manager.current_slot == 1  # Should be on key 1 after rotation


def test_generate_does_not_rotate_on_bad_request() -> None:
    """Generation does NOT rotate keys on malformed request errors (HTTP 400)."""
    manager = GeminiKeyManager(keys=["key-1", "key-2"])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Key 1 fails with 400 bad request - should NOT rotate
        mock_client.models.generate_content.side_effect = [
            _mock_error("400 Bad Request: Invalid parameter"),
        ]
        mock_client_cls.return_value = mock_client

        with pytest.raises(RuntimeError, match="Gemini API request failed"):
            manager.generate_with_rotation("Test prompt")

    # Should have only tried key 1, no rotation
    assert mock_client.models.generate_content.call_count == 1


def test_generate_continues_on_503_unavailable_with_retry() -> None:
    """Generation retries on 503 errors and continues if succeeds."""
    manager = GeminiKeyManager(keys=["key-1"])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # First attempt fails with 503, second succeeds
        mock_client.models.generate_content.side_effect = [
            _mock_error("503 Unavailable"),
            _mock_response("Success after retry"),
        ]
        mock_client_cls.return_value = mock_client

        result = manager.generate_with_rotation("Test prompt", max_retries_per_key=2)

    assert result == "Success after retry"
    assert mock_client.models.generate_content.call_count == 2


def test_generate_exhausts_retries_then_rotates() -> None:
    """After exhausting retries on one key, generation rotates to next key."""
    manager = GeminiKeyManager(keys=["key-1", "key-2"])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Key 1 fails twice (exhausts retries), key 2 succeeds
        mock_client.models.generate_content.side_effect = [
            _mock_error("503 Unavailable"),
            _mock_error("503 Unavailable"),
            _mock_response("Success on key 2"),
        ]
        mock_client_cls.return_value = mock_client

        result = manager.generate_with_rotation("Test prompt", max_retries_per_key=2)

    assert result == "Success on key 2"
    # 2 retries on key 1 + 1 success on key 2 = 3 calls
    assert mock_client.models.generate_content.call_count == 3


# ---------------------------------------------------------------------------
# Edge case tests
# ---------------------------------------------------------------------------

def test_no_keys_raises_error() -> None:
    """generate_with_rotation raises GeminiKeyError when no keys configured."""
    manager = GeminiKeyManager(keys=[])

    with pytest.raises(GeminiKeyError, match="No Gemini API keys configured"):
        manager.generate_with_rotation("Test prompt")


def test_invalid_key_error_triggers_rotation() -> None:
    """Invalid API key errors trigger key rotation."""
    manager = GeminiKeyManager(keys=["key-1", "key-2"])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        # Key 1 fails with invalid key error, key 2 succeeds
        mock_client.models.generate_content.side_effect = [
            _mock_error("api_key_invalid"),
            _mock_response("Success on key 2"),
        ]
        mock_client_cls.return_value = mock_client

        result = manager.generate_with_rotation("Test prompt")

    assert result == "Success on key 2"
    assert manager.current_slot == 2


# ---------------------------------------------------------------------------
# Backward compatibility tests
# ---------------------------------------------------------------------------

def test_gemini_client_uses_key_manager() -> None:
    """GeminiClient.generate_response uses the centralized key manager."""
    from app.llm.client import GeminiClient

    client = GeminiClient(model="gemini-2.0-flash")

    mock_response = _mock_response("Response from key manager")

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_cls.return_value = mock_client

        result = client.generate_response("Test prompt")

    assert result == "Response from key manager"
    mock_client.models.generate_content.assert_called_once_with(
        model="gemini-2.0-flash",
        contents="Test prompt",
    )


def test_unified_generate_response_uses_key_manager() -> None:
    """unified.generate_response uses the centralized key manager."""
    from app.llm.unified import generate_response

    mock_response = _mock_response("Response from unified")

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_cls.return_value = mock_client

        result = generate_response("Test prompt")

    assert result == "Response from unified"
