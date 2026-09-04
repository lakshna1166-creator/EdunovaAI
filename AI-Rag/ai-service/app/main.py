"""FastAPI application entry point for the EduNovaAI RAG service.

Adds a lifespan handler for graceful startup/shutdown. SentenceTransformer
is loaded lazily on the first embedding request — NOT during startup — to
avoid OOM on Render's 512 MiB free tier.

Every request reuses the single in-process model instance via the singleton
provider in `app.rag.embeddings`.
"""
from __future__ import annotations

import logging
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

    SentenceTransformer MODEL WEIGHTS are NOT loaded here — the actual
    model is still loaded lazily on the first embedding request via
    get_sentence_transformer(), which keeps peak RSS during startup well
    under Render's 512 MiB free tier.

    What we DO preload at startup is the IMPORT of sentence_transformers
    (which transitively imports torch, numpy, scikit-learn, ~150-250 MiB
    RSS). This is done in a BACKGROUND DAEMON THREAD via
    start_background_import_preload(), so:
      - uvicorn binds to $PORT immediately (no blocking startup work)
      - the ~80 s import runs concurrently with the first request(s)
      - by the time a real RAG request arrives, the import is usually
        already complete and the first request only pays the ~1 s model
        load + ~4 s encode() — instead of ~82 s.

    The model weights themselves (~90 MB safetensors) are STILL loaded
    lazily on the first embedding call to avoid the 512 MiB OOM that the
    previous "load model at startup" approach caused.
    """
    import sys
    import os

    # Lightweight diagnostics — stdlib only, no extra dependencies.
    # These log lines help confirm Python version, PID, and that
    # SentenceTransformer has NOT been imported before the lifespan fires.
    logger.info(
        "[STARTUP] Python %s | PID %d | cwd %s | "
        "SENTENCE_TRANSFORMERS_HOME=%s",
        sys.version.split()[0],
        os.getpid(),
        os.getcwd(),
        os.environ.get("SENTENCE_TRANSFORMERS_HOME", "(not set)"),
    )
    logger.info("[STARTUP] Application starting...")

    # Start the background import preload. This is non-blocking: the
    # import runs in a daemon thread while uvicorn serves health checks
    # and warm-up traffic. Model weights are NOT loaded here.
    from app.rag.embeddings import start_background_import_preload
    start_background_import_preload()

    yield

    logger.info("[SHUTDOWN] EduNovaAI RAG service shutting down.")


app = FastAPI(title="EduNovaAI Teacher Service", lifespan=lifespan)

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
