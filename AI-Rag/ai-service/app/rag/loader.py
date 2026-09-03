from __future__ import annotations

from pathlib import Path
from typing import Any

try:
    import pymupdf as fitz
except Exception:  # pragma: no cover - fallback for older local installs
    import fitz

from app.core.config import UPLOAD_DIR


def load_pdf_document(file_path: str | Path) -> list[dict[str, Any]]:
    """Read a PDF from disk and return a list of page dictionaries.

    Each entry has page number, extracted text, and source name.
    """
    pdf_path = Path(file_path)

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError(f"Unsupported file type: {pdf_path.name}. Expected a PDF file.")

    try:
        doc = fitz.open(pdf_path)
    except Exception as exc:  # pragma: no cover - depends on malformed files
        raise RuntimeError(f"Could not open PDF: {pdf_path}. Details: {exc}") from exc

    try:
        if doc.page_count == 0:
            return []

        source_name = pdf_path.name
        pages: list[dict[str, Any]] = []

        for page_number in range(doc.page_count):
            page = doc.load_page(page_number)
            text = page.get_text("text").strip()
            pages.append({
                "page": page_number + 1,
                "text": text,
                "source": source_name,
            })

        return pages
    except Exception as exc:  # pragma: no cover - extraction failure path
        raise RuntimeError(f"Failed to extract text from PDF: {pdf_path}. Details: {exc}") from exc
    finally:
        doc.close()


def load_pdf_from_uploads(file_name: str) -> list[dict[str, Any]]:
    """Load a PDF located in the uploads directory."""
    target_path = UPLOAD_DIR / file_name
    return load_pdf_document(target_path)
