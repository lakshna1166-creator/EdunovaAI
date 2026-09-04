import logging

from fastapi import FastAPI

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.teacher import router as teacher_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(title="EduNovaAI Teacher Service")

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(teacher_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}