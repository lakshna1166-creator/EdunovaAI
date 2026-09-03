from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_upload_document_success() -> None:
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    with patch("app.api.documents.load_pdf_document", return_value=[{"page": 1, "text": "hello", "source": "sample.pdf"}]), patch("app.api.documents.DocumentIngestionService") as mock_service_cls:
        mock_service = mock_service_cls.return_value
        mock_service.ingest_pdf.return_value = [
            {"text": "hello", "page": 1, "source": "sample.pdf"},
            {"text": "hello there", "page": 1, "source": "sample.pdf"},
        ]

        response = client.post(
            "/documents/upload",
            files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["filename"] == "sample.pdf"
    assert payload["pages"] == 1
    assert payload["chunks"] == 2


def test_upload_document_rejects_non_pdf() -> None:
    response = client.post(
        "/documents/upload",
        files={"file": ("notes.txt", b"not a pdf", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are allowed."


def test_upload_document_rejects_invalid_pdf_content() -> None:
    invalid_pdf = b"not really a pdf"

    with patch("app.api.documents.load_pdf_document", side_effect=Exception("bad pdf")):
        response = client.post(
            "/documents/upload",
            files={"file": ("broken.pdf", invalid_pdf, "application/pdf")},
        )

    assert response.status_code == 400
    assert "valid PDF" in response.json()["detail"]
