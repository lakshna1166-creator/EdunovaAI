import os
from pathlib import Path

from dotenv import load_dotenv

# Central configuration source. Loaded once here so every module can do:
#   from app.core.config import OMNI_API_KEY, SUPABASE_URL, ...
# regardless of the process working directory (uvicorn or pytest).
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# --- Omni (primary LLM, OpenAI-compatible Chat Completions) ---
# Single source of truth names — do NOT rename these.
OMNI_API_KEY = os.getenv("OMNI_API_KEY", "")
OMNI_API_URL = os.getenv("OMNI_API_URL", "").rstrip("/")
# Model id sent in the `model` field (must be an exact id from the provider catalog).
# Override via OMNI_MODEL without changing code. Defaults to a widely available model.
OMNI_MODEL = os.getenv("OMNI_MODEL", "gpt-4o-mini")
OMNI_TIMEOUT_SECONDS = float(os.getenv("OMNI_TIMEOUT_SECONDS", "60"))
OMNI_MAX_RETRIES = int(os.getenv("OMNI_MAX_RETRIES", "1"))
OMNI_RETRY_DELAY_SECONDS = float(os.getenv("OMNI_RETRY_DELAY_SECONDS", "2.0"))

# --- Supabase (RAG vector store) ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# --- Gemini (preserved fallback / legacy LLM) ---
# Kept for backward compatibility. Omni is now the primary LLM; Gemini is used
# only as a fallback when configured, and never exposed to the frontend.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# --- HeyGen (optional video generation, backend-only) ---
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY", "")

# Gemini teacher-generation model configuration.
# Primary model first; fallbacks tried only when the primary returns 503 UNAVAILABLE.
# 429 RESOURCE_EXHAUSTED is treated as quota exhaustion (no retry, no fallback).
# Override the primary model via the GEMINI_MODEL env variable if needed.
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")

# Fallback chain used only after the primary model returns 503 UNAVAILABLE.
# Order matters: the first model in the list is tried first.
GEMINI_FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]

# Maximum number of attempts per model when handling 503 UNAVAILABLE responses.
# Total ceiling = MAX_RETRIES_PER_MODEL * (1 primary + len(fallbacks)).
GEMINI_MAX_RETRIES_PER_MODEL = int(os.getenv("GEMINI_MAX_RETRIES_PER_MODEL", "1"))

# Delay between retry attempts (seconds).
GEMINI_RETRY_DELAY_SECONDS = float(os.getenv("GEMINI_RETRY_DELAY_SECONDS", "2.0"))

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# RAG retrieval similarity threshold for the /chat endpoint dual-mode feature.
# Chunks with a similarity score below this threshold are treated as irrelevant
# and will trigger the general-knowledge fallback instead of the RAG pipeline.
# For cosine similarity from all-MiniLM-L6-v2 embeddings (range -1 to 1):
#   0.70 = lenient (most chunks pass)
#   0.75 = moderate (default)
#   0.80 = strict (only highly relevant chunks pass)
RAG_SIMILARITY_THRESHOLD = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.75"))


# ---------------------------------------------------------------------------
# Safe environment validation helpers (never print secret values)
# ---------------------------------------------------------------------------

def is_omni_configured() -> bool:
    """Return True when both OMNI_API_KEY and OMNI_API_URL are set."""
    return bool(OMNI_API_KEY.strip()) and bool(OMNI_API_URL.strip())


def is_supabase_configured() -> bool:
    """Return True when both SUPABASE_URL and SUPABASE_KEY are set."""
    return bool(SUPABASE_URL.strip()) and bool(SUPABASE_KEY.strip())


def is_gemini_configured() -> bool:
    """Return True when GEMINI_API_KEY is set (optional fallback LLM)."""
    return bool(GEMINI_API_KEY.strip())


def is_heygen_configured() -> bool:
    """Return True when HEYGEN_API_KEY is set (optional video service)."""
    return bool(HEYGEN_API_KEY.strip())


def require_supabase() -> None:
    """Raise a safe error when Supabase is not configured (no values exposed)."""
    if not is_supabase_configured():
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be configured in the .env file.")


def require_omni() -> None:
    """Raise a safe error when Omni is not configured (no values exposed)."""
    if not OMNI_API_KEY.strip():
        raise ValueError("OMNI_API_KEY is not configured")
    if not OMNI_API_URL.strip():
        raise ValueError("OMNI_API_URL is not configured")
