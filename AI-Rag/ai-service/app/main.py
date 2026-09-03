import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.teacher import router as teacher_router
from app.rag.answer import get_cached_rag_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context: warm up the cached RAG service at startup
    so the embedding model is loaded once and reused across requests.
    """
    logger = logging.getLogger(__name__)
    logger.info("[STARTUP] Warming up cached RAG service (loading models once)...")
    # Initialize the cached RAG service - this loads SentenceTransformer
    # and creates the Supabase + Gemini clients exactly once.
    get_cached_rag_service()
    logger.info("[STARTUP] Cached RAG service ready for fast /chat responses")
    yield
    # Shutdown: nothing to clean up explicitly.


app = FastAPI(title="EduNovaAI Teacher Service", lifespan=lifespan)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
