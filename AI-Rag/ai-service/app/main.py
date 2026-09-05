"""FastAPI application entry point for the EduNovaAI RAG service.

The embedding runtime uses ONNX Runtime + tokenizers (no PyTorch /
sentence-transformers). Peak RSS at startup is ~60-80 MiB, well inside
Render's 512 MiB free tier. The ONNX model is loaded lazily on the first
embedding request.

Every request reuses the single in-process ONNX session via the singleton
provider in `app.rag.embeddings`.
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """FastAPI lifespan handler.

    The ONNX embedding model is NOT loaded here. It is loaded lazily on
    the first embedding request (via `get_onnx_session()` inside
    `app.rag.embeddings`). This keeps peak RSS during startup to only
    what the stdlib + FastAPI + uvicorn + supabase-py use (~30-50 MiB),
    well under Render's 512 MiB free tier.

    No background import preload is needed because:
    - `onnxruntime` and `tokenizers` are pure-Python + pre-compiled
      wheels with no expensive C++ initialisation (unlike torch);
    - they do not trigger any network requests on import;
    - import time is < 1 s, so the first request cost is negligible.
    """
    logger.info(
        "[STARTUP] Python %s | PID %d | cwd %s",
        sys.version.split()[0],
        os.getpid(),
        os.getcwd(),
    )
    logger.info("[STARTUP] Application starting (ONNX embedding runtime — lazy load on first request)...")

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
        "service": "EduNovaAI RAG"
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Lightweight health check endpoint.

    This endpoint does NOT:
    - load ONNX Runtime
    - load the tokenizer
    - load PyTorch
    - call Gemini
    - query Supabase
    - perform embedding
    - perform RAG

    It responds quickly and reliably for load balancer / orchestrator health checks.
    """
    return {"status": "ok"}
