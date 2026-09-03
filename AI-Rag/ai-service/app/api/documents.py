from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import UPLOAD_DIR
from app.rag.ingestion import DocumentIngestionService
from app.rag.loader import load_pdf_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> dict[str, object]:
    """Upload a PDF document, ingest it, and store the embedded chunks."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is missing a filename.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    target_name = Path(file.filename).name
    saved_path = UPLOAD_DIR / target_name
    if saved_path.exists():
        saved_path = UPLOAD_DIR / f"{Path(file.filename).stem}_uploaded.pdf"

    try:
        with saved_path.open("wb") as file_buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                file_buffer.write(chunk)
    except Exception as exc:  # pragma: no cover - filesystem failure path
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded PDF.",
        ) from exc

    try:
        pages = load_pdf_document(saved_path)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid PDF or could not be read.",
        ) from exc

    try:
        service = DocumentIngestionService()
        result = service.ingest_pdf(saved_path)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {exc}",
        ) from exc

    return {
        "success": True,
        "filename": target_name,
        "pages": len(pages),
        "chunks": len(result),
    }
