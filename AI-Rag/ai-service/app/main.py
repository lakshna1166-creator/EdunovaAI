import logging

from fastapi import FastAPI

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.teacher import router as teacher_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(title="EduNovaAI Teacher Service")

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.on_event("startup")
async def startup_event() -> None:
    """Pre-load the embedding model at startup to avoid memory spikes during requests.
    
    This loads the SentenceTransformer model during startup when there's more memory
    available, rather than on the first request which could cause timeouts or OOM.
    """
    try:
        from app.rag.embeddings import get_embedding_provider
        
        logger.info("[STARTUP] Pre-loading embedding model...")
        provider = get_embedding_provider()
        # Force model loading by accessing the model property
        _ = provider.model
        logger.info("[STARTUP] Embedding model pre-loaded successfully.")
    except Exception as exc:
        # Log but don't fail startup - the model will be loaded lazily on first request
        logger.warning("[STARTUP] Failed to pre-load embedding model: %s", exc)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}