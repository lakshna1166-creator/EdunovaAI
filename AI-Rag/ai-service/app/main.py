"""FastAPI application entry point for the EduNovaAI RAG service.

Adds a lifespan handler that pre-loads the SentenceTransformer embedding
model exactly once at application startup. Every request then reuses that
single in-process model instance via the singleton provider in
`app.rag.embeddings`.

Render free tier has ~512 MiB RAM, so we:

* Pre-load the model on a single CPU thread (no CUDA kernels).
* Try to load from the local Hugging Face cache only (no remote download
  fallback during runtime; if the model is missing, we fail fast and log
  a clear error so the request returns 503 instead of OOM-ing).
* Force the same singleton to be reused for `/teacher/ask` and every
  other endpoint.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.teacher import router as teacher_router
from app.rag.embeddings import preload_embedding_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Pre-load the shared embedding model exactly once at startup.

    This guarantees that `/teacher/ask` (and any other endpoint that
    embeds text) reuses the same in-process SentenceTransformer instance
    instead of triggering a fresh load — and a fresh remote download —
    inside the request handler, which OOMs the Render free tier.
    """
    logger.info("[STARTUP] Pre-loading shared embedding model (one-time)...")
    try:
        # Force the model to load (and one-time download if the cache is
        # empty). This call is the ONLY place in the process where the
        # model is materialised. Every request handler subsequently
        # reuses the in-memory instance via the singleton provider.
        preload_embedding_model()
        logger.info("[STARTUP] Shared embedding model ready.")
    except Exception as exc:  # pragma: no cover - defensive startup logging
        # Do NOT swallow this silently. Render will restart the service,
        # but the logs will make the root cause obvious.
        logger.exception(
            "[STARTUP] Failed to pre-load embedding model: %s: %s",
            type(exc).__name__,
            exc,
        )
        # Re-raise so Render marks the deploy as failed instead of
        # silently booting an app that will OOM on the first request.
        raise

    yield

    logger.info("[SHUTDOWN] EduNovaAI RAG service shutting down.")


app = FastAPI(title="EduNovaAI Teacher Service", lifespan=lifespan)

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
