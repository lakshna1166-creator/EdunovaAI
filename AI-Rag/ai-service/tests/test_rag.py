from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
import fitz

from app.rag.ingestion import DocumentIngestionService, ingest_pdf_document
from app.rag.loader import load_pdf_document, load_pdf_from_uploads
from app.core.config import UPLOAD_DIR


@pytest.fixture
def sample_pdf_path(tmp_path: Path) -> Path:
    pdf_path = tmp_path / "sample.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "This is page one.")
    doc.save(pdf_path)
    doc.close()
    return pdf_path


def test_load_pdf_document_extracts_page_text(sample_pdf_path: Path) -> None:
    pages = load_pdf_document(sample_pdf_path)

    assert isinstance(pages, list)
    assert len(pages) == 1
    assert pages[0]["page"] == 1
    assert pages[0]["source"] == sample_pdf_path.name
    assert "This is page one." in pages[0]["text"]


def test_load_pdf_document_handles_empty_pdf(tmp_path: Path) -> None:
    empty_path = tmp_path / "empty.pdf"
    doc = fitz.open()
    doc.new_page()
    doc.save(empty_path)
    doc.close()

    pages = load_pdf_document(empty_path)
    assert len(pages) == 1
    assert pages[0]["page"] == 1
    assert pages[0]["text"] == ""


def test_load_pdf_document_raises_for_missing_file(tmp_path: Path) -> None:
    missing = tmp_path / "missing.pdf"

    with pytest.raises(FileNotFoundError):
        load_pdf_document(missing)


def test_load_pdf_from_uploads_reads_upload_directory() -> None:
    upload_dir = UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = upload_dir / "uploaded.pdf"

    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Uploaded example")
    doc.save(pdf_path)
    doc.close()

    pages = load_pdf_from_uploads("uploaded.pdf")

    assert len(pages) == 1
    assert pages[0]["source"] == "uploaded.pdf"
    assert "Uploaded example" in pages[0]["text"]


def test_document_ingestion_service_ingests_pdf_pipeline(sample_pdf_path: Path) -> None:
    embedding_provider = MagicMock()
    embedding_provider.embed_batch.return_value = [[0.1, 0.2]]

    vector_store = MagicMock()
    vector_store.insert_document_chunks.return_value = [{"ok": True}]

    service = DocumentIngestionService(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        chunk_size=10,
        chunk_overlap=2,
    )

    result = service.ingest_pdf(sample_pdf_path)

    assert result == [{"ok": True}]
    embedding_provider.embed_batch.assert_called_once()
    vector_store.insert_document_chunks.assert_called_once()


def test_ingest_pdf_document_helper_uses_service(sample_pdf_path: Path) -> None:
    service = MagicMock()
    service.ingest_pdf.return_value = [{"inserted": 1}]

    with patch("app.rag.ingestion.DocumentIngestionService", return_value=service):
        result = ingest_pdf_document(sample_pdf_path)

    assert result == [{"inserted": 1}]
    service.ingest_pdf.assert_called_once_with(sample_pdf_path)
