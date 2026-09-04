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

    SentenceTransformer is NOT loaded here. The model is loaded lazily on
    the first embedding request, then cached as a singleton for the rest
    of the process. This keeps FastAPI startup lightweight so the
    container can bind to $PORT within Render's 512 MiB free tier.
    """
    logger.info("[STARTUP] Application starting...")
    logger.info("[STARTUP] Skipping SentenceTransformer preload (lazy load on first request).")

    yield

    logger.info("[SHUTDOWN] EduNovaAI RAG service shutting down.")


app = FastAPI(title="EduNovaAI Teacher Service", lifespan=lifespan)

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
