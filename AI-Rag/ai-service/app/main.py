"""FastAPI application entry point for the EduNovaAI RAG service.

The embedding runtime uses ONNX Runtime + tokenizers (no PyTorch /
sentence-transformers). Peak RSS at startup is ~60-80 MiB, well inside
Render's 512 MiB free tier.

Initialization model:
  * `import onnxruntime` is performed ONCE at application startup on a
    background thread by `app.rag.embeddings.initialize_onnxruntime_diagnostics()`.
  * The FastAPI event loop is NOT blocked by the import — the request
    path NEVER invokes `import onnxruntime`.
  * If the import fails or times out at startup, the service still
    comes up healthy; the chat/teacher endpoints return a 503 with a
    clear, actionable error message instead of hanging for 120 s.
  * The `/health` endpoint remains a pure, lightweight health check.
  * The `/diagnostics/onnx` endpoint exposes the diagnostic state for
    operators (does NOT trigger the import itself).

Every successful request reuses the single in-process ONNX session via
the singleton provider in `app.rag.embeddings`.
"""
from __future__ import annotations

import logging
import sys
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.teacher import router as teacher_router
from app.rag.embeddings import (
    initialize_onnxruntime_diagnostics,
    is_onnxruntime_initialized,
    is_onnxruntime_failed,
    get_onnxruntime_error,
    preload_embedding_model,
    run_tokenizers_diagnostic,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)

# Maximum wall-clock seconds the `import onnxruntime` step may take at
# startup before we declare it timed out. Tuned to be much shorter than
# the 120 s request-timeout the backend enforces, so a slow import does
# not push us over the per-request budget later.
_ONNX_INIT_TIMEOUT_SECONDS = float(os.getenv("ONNX_INIT_TIMEOUT_SECONDS", "60"))

# Whether to additionally preload the FULL ONNX model session (not just
# `import onnxruntime`) at startup. Disabled by default to keep startup
# memory low on Render's 512 MiB free tier. Set to "1" to enable.
_PRELOAD_FULL_SESSION = os.getenv("ONNX_PRELOAD_SESSION", "0") == "1"


@asynccontextmanager
async def lifespan(_: FastAPI):
    """FastAPI lifespan handler.

    Startup sequence:
      1. Log Python / PID / cwd.
      2. Call `initialize_onnxruntime_diagnostics()` on a background
         thread with a bounded timeout. This is the ONLY place where
         `import onnxruntime` is allowed to run. The request path
         will NEVER re-attempt the import.
      3. Optionally preload the full ONNX model session if
         `ONNX_PRELOAD_SESSION=1`. Off by default.

    The FastAPI event loop is NEVER blocked by the ONNX import — the
    function uses a `threading.Thread` + `thread.join(timeout=...)`
    pattern internally, and the rest of startup runs in async context.
    """
    logger.info(
        "[STARTUP] Python %s | PID %d | cwd %s",
        sys.version.split()[0],
        os.getpid(),
        os.getcwd(),
    )
    logger.info(
        "[STARTUP] Application starting | onnx_init_timeout=%.1fs | "
        "preload_session=%s",
        _ONNX_INIT_TIMEOUT_SECONDS,
        _PRELOAD_FULL_SESSION,
    )

    # ---- STEP A: bounded `import onnxruntime` diagnostic ------------
    # This is the safe initialization path. It does NOT block the
    # event loop and does NOT prevent the service from binding the
    # HTTP port.
    try:
        ok = initialize_onnxruntime_diagnostics(
            timeout_seconds=_ONNX_INIT_TIMEOUT_SECONDS
        )
        if ok:
            logger.info(
                "[STARTUP] onnxruntime import OK; chat/teacher endpoints "
                "are ready to serve embedding requests."
            )
        else:
            logger.warning(
                "[STARTUP] onnxruntime import did NOT complete at "
                "startup (failed or timed out). Chat/teacher endpoints "
                "will return 503 with a clear error. Use "
                "GET /diagnostics/onnx to inspect state."
            )
    except Exception as exc:  # noqa: BLE001 - defensive
        logger.exception(
            "[STARTUP] initialize_onnxruntime_diagnostics() raised: %s",
            exc,
        )

    # ---- STEP B: optional full-session preload ---------------------
    if _PRELOAD_FULL_SESSION and is_onnxruntime_initialized():
        try:
            preload_embedding_model()
            logger.info(
                "[STARTUP] ONNX full session preloaded; first request "
                "will skip lazy load."
            )
        except Exception as exc:  # noqa: BLE001 - defensive
            logger.exception(
                "[STARTUP] preload_embedding_model() failed: %s", exc
            )
    elif _PRELOAD_FULL_SESSION and not is_onnxruntime_initialized():
        logger.warning(
            "[STARTUP] ONNX_PRELOAD_SESSION=1 but onnxruntime import "
            "failed — skipping full-session preload."
        )

    yield

    logger.info("[SHUTDOWN] EduNovaAI RAG service shutting down.")


app = FastAPI(title="EduNovaAI Teacher Service", lifespan=lifespan)

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.get("/")
async def root():
    """Root endpoint for Render health checks.

    Returns service status without loading any ML models or dependencies.
    """
    return {
        "status": "ok",
        "service": "EduNovaAI RAG",
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Lightweight health check endpoint.

    This endpoint does NOT:
      * load ONNX Runtime
      * load the tokenizer
      * load PyTorch
      * call Gemini
      * query Supabase
      * perform embedding
      * perform RAG
      * import any heavy native libraries

    It responds quickly and reliably for load balancer / orchestrator
    health checks even when the ONNX runtime has not been initialized
    yet.
    """
    return {"status": "ok"}


@app.get("/diagnostics/onnx")
def diagnostics_onnx() -> dict[str, object]:
    """Inspect ONNX runtime diagnostic state.

    This endpoint does NOT trigger any ONNX import. It only reports
    the cached state set by `initialize_onnxruntime_diagnostics()` at
    application startup.

    Returns:
        Dict with `initialized`, `failed`, and (on failure) `error`.
    """
    initialized = is_onnxruntime_initialized()
    failed = is_onnxruntime_failed()
    payload: dict[str, object] = {
        "initialized": initialized,
        "failed": failed,
    }
    if failed:
        payload["error"] = get_onnxruntime_error()
    return payload


@app.get("/diagnostics/tokenizers")
def diagnostics_tokenizers() -> dict[str, object]:
    """Isolated diagnostic for `import tokenizers`.

    This endpoint spawns a brand-new Python subprocess that runs ONLY
    `import tokenizers` with a hard 20-second timeout. It does NOT
    inherit the application import state. It is safe to call on a
    running service — it will not block the FastAPI event loop.

    The endpoint is intended to determine whether `tokenizers==0.21.0`
    itself hangs under Python 3.14 when imported in a clean process.

    Returns:
        Dict containing:
        - status: "SUCCESS" | "TIMEOUT" | "FAILED"
        - python_version: str
        - elapsed_seconds: float
        - tokenizers_version: str | null
        - stdout: str
        - stderr: str
        - exception: str | null
    """
    return run_tokenizers_diagnostic(timeout_seconds=20.0)
