"""
End-to-end RAG pipeline diagnostic script.
Tests: PDF ingestion → Supabase storage → query embedding → retrieval → Gemini answer.

Run with the venv active:
    python scripts/e2e_rag_test.py
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

# Add project root so app.* imports work
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("e2e_test")


def run():
    pdf_path = Path(__file__).resolve().parents[1] / "data" / "uploads" / "ai_intro.pdf"
    if not pdf_path.exists():
        logger.error("Test PDF not found at %s — run scripts/create_test_pdf.py first", pdf_path)
        sys.exit(1)

    # ------------------------------------------------------------------ #
    # STEP 1 — Ingestion                                                   #
    # ------------------------------------------------------------------ #
    logger.info("=" * 60)
    logger.info("STEP 1 — PDF Ingestion")
    logger.info("=" * 60)

    from app.rag.loader import load_pdf_document
    pages = load_pdf_document(pdf_path)
    logger.info("PDF pages extracted: %d", len(pages))
    total_chars = sum(len(p.get("text", "")) for p in pages)
    logger.info("Characters extracted: %d", total_chars)
    assert pages, "No pages extracted from PDF!"
    assert total_chars > 0, "All pages are empty!"

    from app.rag.chunker import chunk_text_pages
    chunks = chunk_text_pages(pages, chunk_size=400, chunk_overlap=80)
    logger.info("Chunks created: %d", len(chunks))
    assert chunks, "No chunks created!"

    from app.rag.embeddings import GeminiEmbeddingProvider
    embedder = GeminiEmbeddingProvider()
    embeddings = embedder.embed_batch([c["text"] for c in chunks])
    logger.info("Embeddings generated: %d", len(embeddings))
    assert embeddings, "No embeddings generated!"
    dim = len(embeddings[0])
    logger.info("Embedding dimension: %d", dim)
    assert dim == 384, f"Wrong embedding dimension: expected 384, got {dim}"
    assert len(embeddings) == len(chunks), "Chunks/embeddings count mismatch!"

    from app.rag.vector_store import SupabaseVectorStore
    store = SupabaseVectorStore()
    result = store.insert_document_chunks(chunks, embeddings)
    logger.info("Supabase records inserted: %d", len(result))
    assert len(result) == len(chunks), f"Not all chunks were inserted! Expected {len(chunks)}, got {len(result)}"

    # ------------------------------------------------------------------ #
    # STEP 2 — Query embedding                                             #
    # ------------------------------------------------------------------ #
    logger.info("=" * 60)
    logger.info("STEP 2 — Query Embedding")
    logger.info("=" * 60)

    question = "What is AI?"
    logger.info("Query: %s", question)
    q_embedding = embedder.embed_text(question)
    logger.info("Query embedding dimension: %d", len(q_embedding))
    assert len(q_embedding) == 384

    # ------------------------------------------------------------------ #
    # STEP 3 — Vector search                                               #
    # ------------------------------------------------------------------ #
    logger.info("=" * 60)
    logger.info("STEP 3 — Vector Search")
    logger.info("=" * 60)

    retrieved = store.similarity_search(q_embedding, top_k=5)
    logger.info("Retrieved chunks: %d", len(retrieved))
    for i, row in enumerate(retrieved):
        logger.info(
            "  Chunk %d | page=%s | source=%s | score=%.4f | content[:100]=%r",
            i,
            row.get("page"),
            row.get("source"),
            float(row.get("score") or 0.0),
            (row.get("text") or "")[:100],
        )

    assert retrieved, "No chunks retrieved — vector search failed!"
    top_score = retrieved[0].get("score", 0.0)
    logger.info("Top similarity score: %.4f", top_score)

    # ------------------------------------------------------------------ #
    # STEP 4 — Retriever                                                   #
    # ------------------------------------------------------------------ #
    logger.info("=" * 60)
    logger.info("STEP 4 — RAGRetriever")
    logger.info("=" * 60)

    from app.rag.retriever import RAGRetriever
    retriever = RAGRetriever()
    relevant = retriever.retrieve(question, top_k=5)
    logger.info("RAGRetriever chunks after filter: %d", len(relevant))
    assert relevant, "RAGRetriever returned 0 chunks — filter bug!"

    # ------------------------------------------------------------------ #
    # STEP 5 — Gemini answer                                               #
    # ------------------------------------------------------------------ #
    logger.info("=" * 60)
    logger.info("STEP 5 — Gemini Answer Generation")
    logger.info("=" * 60)

    from app.rag.answer import GroundedRAGService
    from app.rag.retriever import RAGRetriever as R2
    svc = GroundedRAGService(retriever=R2())
    response = svc.generate(question)
    answer = response.get("answer", "")
    logger.info("Answer: %s", answer)
    assert answer and "not available" not in answer.lower(), \
        f"Got 'not available' answer even though PDF was ingested: {answer}"

    # ------------------------------------------------------------------ #
    # STEP 6 — Unrelated question                                          #
    # ------------------------------------------------------------------ #
    logger.info("=" * 60)
    logger.info("STEP 6 — Unrelated Question Handling")
    logger.info("=" * 60)

    off_topic = "What is the capital of France?"
    r3 = R2()
    off_topic_response = GroundedRAGService(retriever=r3).generate(off_topic)
    logger.info("Off-topic answer: %s", off_topic_response.get("answer", ""))

    logger.info("=" * 60)
    logger.info("ALL E2E CHECKS PASSED")
    logger.info("=" * 60)


if __name__ == "__main__":
    run()
