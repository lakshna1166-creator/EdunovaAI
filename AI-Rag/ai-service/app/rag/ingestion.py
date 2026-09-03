from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.rag.chunker import chunk_text_pages
from app.rag.embeddings import GeminiEmbeddingProvider
from app.rag.loader import load_pdf_document
from app.rag.vector_store import SupabaseVectorStore

logger = logging.getLogger(__name__)


class DocumentIngestionService:
    """Simple ingestion pipeline: PDF -> chunks -> embeddings -> vector store."""

    def __init__(
        self,
        embedding_provider: GeminiEmbeddingProvider | None = None,
        vector_store: SupabaseVectorStore | None = None,
        chunk_size: int = 400,
        chunk_overlap: int = 80,
    ) -> None:
        self.embedding_provider = embedding_provider or GeminiEmbeddingProvider()
        self.vector_store = vector_store or SupabaseVectorStore()
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def ingest_pdf(self, file_path: str | Path) -> list[dict[str, Any]]:
        """Load a PDF, split it into chunks, generate embeddings, and store them."""
        pages = load_pdf_document(file_path)
        if not pages:
            logger.warning("[INGESTION] No pages extracted from PDF: %s", file_path)
            return []

        total_chars = sum(len(p.get("text", "")) for p in pages)
        logger.info("[INGESTION] PDF pages extracted: %d", len(pages))
        logger.info("[INGESTION] Characters extracted: %d", total_chars)

        chunks = chunk_text_pages(
            pages,
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )
        if not chunks:
            logger.warning("[INGESTION] No chunks created from PDF: %s", file_path)
            return []

        logger.info("[INGESTION] Chunks created: %d", len(chunks))

        texts_for_embedding = [chunk["text"] for chunk in chunks]
        embeddings = self.embedding_provider.embed_batch(texts_for_embedding)

        # Handle edge case where a single embedding is returned as a flat list
        if len(chunks) == 1 and embeddings and not isinstance(embeddings[0], (list, tuple)):
            embeddings = [list(embeddings)]

        logger.info("[INGESTION] Embeddings generated: %d", len(embeddings))
        if embeddings:
            logger.info("[INGESTION] Embedding dimension: %d", len(embeddings[0]))

        if len(embeddings) != len(chunks):
            raise ValueError(
                f"Embedding generation returned {len(embeddings)} vectors for {len(chunks)} chunks. "
                "Expected one vector per chunk."
            )

        result = self.vector_store.insert_document_chunks(chunks, embeddings)
        logger.info("[INGESTION] Supabase records inserted: %d", len(result))
        return result


def ingest_pdf_document(
    file_path: str | Path,
    chunk_size: int = 400,
    chunk_overlap: int = 80,
    embedding_provider: GeminiEmbeddingProvider | None = None,
    vector_store: SupabaseVectorStore | None = None,
) -> list[dict[str, Any]]:
    """Convenience wrapper for the document ingestion pipeline."""
    service = DocumentIngestionService(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return service.ingest_pdf(file_path)
