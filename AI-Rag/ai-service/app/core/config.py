import os
from pathlib import Path

from dotenv import load_dotenv

# Central configuration source. Loaded once here so every module can do:
#   from app.core.config import GEMINI_API_KEYS, SUPABASE_URL, ...
# regardless of the process working directory (uvicorn or pytest).
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# --- Gemini (primary LLM with 7-key rotation) ---
# Load all configured Gemini keys (1-7). Empty/missing keys are ignored.
# Key rotation happens transparently inside the centralized Gemini key manager.
GEMINI_API_KEYS = []
for i in range(1, 10):
    key = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
    if key:
        GEMINI_API_KEYS.append(key)

# Gemini model configuration.
# Use gemini-3.6-flash as the primary model (widely available, good performance).
# Override via GEMINI_MODEL env variable if needed.
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# Fallback chain used only after the primary model returns 503 UNAVAILABLE.
# Order matters: the first model in the list is tried first.
GEMINI_FALLBACK_MODELS = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

# Maximum number of attempts per model when handling 503 UNAVAILABLE responses.
# Total ceiling = MAX_RETRIES_PER_MODEL * (1 primary + len(fallbacks)).
GEMINI_MAX_RETRIES_PER_MODEL = int(os.getenv("GEMINI_MAX_RETRIES_PER_MODEL", "1"))

# Delay between retry attempts (seconds).
GEMINI_RETRY_DELAY_SECONDS = float(os.getenv("GEMINI_RETRY_DELAY_SECONDS", "2.0"))

# --- Supabase (RAG vector store) ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# --- HeyGen (optional video generation, backend-only) ---
HEYGEN_API_KEY = os.getenv("HEYGEN_API_KEY", "")

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

def is_supabase_configured() -> bool:
    """Return True when both SUPABASE_URL and SUPABASE_KEY are set."""
    return bool(SUPABASE_URL.strip()) and bool(SUPABASE_KEY.strip())


def is_gemini_configured() -> bool:
    """Return True when at least one Gemini API key is configured."""
    return len(GEMINI_API_KEYS) > 0


def is_heygen_configured() -> bool:
    """Return True when HEYGEN_API_KEY is set (optional video service)."""
    return bool(HEYGEN_API_KEY.strip())


def require_supabase() -> None:
    """Raise a safe error when Supabase is not configured (no values exposed)."""
    if not is_supabase_configured():
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be configured in the .env file.")


def require_gemini() -> None:
    """Raise a safe error when no Gemini API key is configured (no values exposed)."""
    if not is_gemini_configured():
        raise ValueError("At least one GEMINI_API_KEY must be configured in the .env file.")
