"""Central configuration module.

This module loads environment variables from .env and defines application-wide
constants. It is the single source of truth for configuration and must NOT
import from app.llm modules or itself.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Final

from dotenv import load_dotenv

# ----------------------------------------------------------------------
# Load .env file
# ----------------------------------------------------------------------

_PROJECT_ROOT = Path(__file__).parent.parent.parent
_ENV_PATH = _PROJECT_ROOT / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)
else:
    # Try relative path as fallback
    load_dotenv()

# ----------------------------------------------------------------------
# Gemini API Configuration
# ----------------------------------------------------------------------

# Load Gemini API keys (GEMINI_API_KEY_1 through GEMINI_API_KEY_17)
# Empty/missing keys are ignored
_GEMINI_KEYS: list[str] = []
for i in range(1, 18):
    key = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
    if key:
        _GEMINI_KEYS.append(key)

# Tuple for immutability (exposed as read-only)
GEMINI_API_KEYS: Final[tuple[str, ...]] = tuple(_GEMINI_KEYS)

# Primary Gemini model
DEFAULT_GEMINI_MODEL: Final[str] = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Fallback models (tried in order if primary model is unavailable)
_GEMINI_FALLBACK_MODELS = os.getenv("GEMINI_FALLBACK_MODELS", "gemini-1.5-flash,gemini-1.5-pro")
GEMINI_FALLBACK_MODELS: Final[tuple[str, ...]] = tuple(
    m.strip() for m in _GEMINI_FALLBACK_MODELS.split(",") if m.strip()
)

# Retry configuration
GEMINI_MAX_RETRIES_PER_MODEL: Final[int] = int(
    os.getenv("GEMINI_MAX_RETRIES_PER_MODEL", "3")
)
GEMINI_RETRY_DELAY_SECONDS: Final[float] = float(
    os.getenv("GEMINI_RETRY_DELAY_SECONDS", "2.0")
)

# ----------------------------------------------------------------------
# Supabase Configuration
# ----------------------------------------------------------------------

SUPABASE_URL: Final[str] = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: Final[str] = os.getenv("SUPABASE_KEY", "")

# ----------------------------------------------------------------------
# RAG Configuration
# ----------------------------------------------------------------------

RAG_SIMILARITY_THRESHOLD: Final[float] = float(
    os.getenv("RAG_SIMILARITY_THRESHOLD", "0.5")
)

# ----------------------------------------------------------------------
# File / Upload paths
# ----------------------------------------------------------------------

# Resolved relative to project root
_DATA_DIR = _PROJECT_ROOT / "data"
UPLOAD_DIR: Final[Path] = _DATA_DIR / "uploads"
PROCESSED_DIR: Final[Path] = _DATA_DIR / "processed"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------


def is_gemini_configured() -> bool:
    """Return True if at least one Gemini API key is configured."""
    return len(GEMINI_API_KEYS) > 0
