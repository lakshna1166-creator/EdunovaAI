from __future__ import annotations

import logging
import string
import time
from typing import Any

from app.core.config import RAG_SIMILARITY_THRESHOLD
from app.llm.client import GeminiClient
from app.llm.unified import get_llm_client
from app.rag.embeddings import GeminiEmbeddingProvider
from app.rag.retriever import RAGRetriever
from app.rag.vector_store import SupabaseVectorStore

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# RAG / PDF-grounded prompt — STRICT anti-hallucination rules
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_RAG = (
    "You are EduNovaAI, an educational AI teacher.\n\n"
    "PRIMARY SOURCE OF TRUTH:\n"
    "The retrieved PDF context below is the ONLY source you may treat as "
    "authoritative. Every factual claim presented as coming from the uploaded "
    "document MUST be directly supported by the context.\n\n"
    "STRICT RULES — PDF MODE:\n"
    "1. The PDF context is the primary source of truth. Answer from it.\n"
    "2. You MUST NOT invent facts, numbers, definitions, formulas, citations, "
    "page numbers, or statements that are not supported by the retrieved context.\n"
    "3. Answer the question using the information in the retrieved PDF chunks. "
    "Explain clearly in a teacher style and give an example when appropriate.\n"
    "4. Do NOT combine unrelated retrieved chunks to create unsupported conclusions.\n"
    "5. Do NOT pretend that general knowledge came from the PDF.\n"
    "6. Only present a claim as coming from the PDF if the retrieved context "
    "actually supports that statement.\n"
    "7. NEVER respond with phrases like 'the information is not available in the "
    "provided material' or 'I couldn't find it in the document'. If chunks were "
    "provided to you, they are the source — extract the answer from them.\n"
    "8. If you cannot extract a clear answer from the chunks, DO NOT GUESS — "
    "still base your answer strictly on the provided context.\n"
    "9. If you really cannot determine an answer, you may say: "
    '"I couldn\'t find enough information about this in the uploaded document."\n\n'
    "RESPONSE STRUCTURE (keep it concise and focused):\n"
    "1. Direct answer grounded in the PDF context\n"
    "2. Clear explanation in a simple teacher style\n"
    "3. Key points from the PDF\n"
    "4. Simple, consistent example related to the PDF content\n\n"
    "Return ONLY plain text. No JSON, no markdown code fences.\n\n"
    "Accuracy is more important than always producing an answer."
)

# ---------------------------------------------------------------------------
# General knowledge prompt — STRICT anti-hallucination rules
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_GENERAL = (
    "You are EduNovaAI, an educational AI teacher.\n\n"
    "No relevant uploaded document is available. Answer using general knowledge.\n\n"
    "STRICT RULES — GENERAL / NO-PDF MODE:\n"
    "1. NEVER claim your answer came from a document, chapter, paper, or external source.\n"
    "2. NEVER fabricate: statistics, research papers, URLs, citations, book references, "
    "names, dates, scientific results, page numbers, or any factual claim you are not certain about.\n"
    "3. If you are uncertain, explicitly say so instead of guessing.\n"
    "4. If the question cannot be confidently answered, say:\n"
    '   "I don\'t have enough reliable information to answer that accurately."\n'
    "5. Examples must NEVER be attributed to the user's PDF or any document.\n"
    "6. Keep responses concise and focused.\n\n"
    "RESPONSE STRUCTURE (keep it concise and focused):\n"
    "1. Direct definition\n"
    "2. Simple explanation\n"
    "3. Key points\n"
    "4. Real-world examples (clearly labeled as examples)\n"
    "5. Short analogy or takeaway\n\n"
    "Accuracy is more important than always producing an answer."
)


class GroundedRAGService:
    """Generate grounded answers using only relevant retrieved chunks.

    Supports two modes:
    - RAG / PDF mode: when relevant chunks exist in Supabase.
    - General mode: when no relevant chunks exist, fall back to Gemini's
      general knowledge so the user still receives a useful, educational
      answer instead of an error or "topic not available" string.
    """

    def __init__(
        self,
        retriever: RAGRetriever | None = None,
        gemini_client: GeminiClient | None = None,
        embedding_provider: GeminiEmbeddingProvider | None = None,
        vector_store: SupabaseVectorStore | None = None,
        top_k: int = 5,
        similarity_threshold: float | None = None,
        llm_client: Any | None = None,
    ) -> None:
        if retriever is not None:
            self.retriever = retriever
        else:
            self.retriever = RAGRetriever(
                embedding_provider=embedding_provider or GeminiEmbeddingProvider(),
                vector_store=vector_store or SupabaseVectorStore(),
                top_k=top_k,
                similarity_threshold=(
                    similarity_threshold
                    if similarity_threshold is not None
                    else RAG_SIMILARITY_THRESHOLD
                ),
            )

        self.gemini_client = llm_client or gemini_client or get_llm_client()
        # Back-compat alias: some callers/tests reference .llm_client or .gemini_client.
        self.llm_client = self.gemini_client

    def _build_context(self, chunks: list[dict[str, Any]]) -> str:
        if not chunks:
            return "No relevant context available."

        sections: list[str] = []
        for chunk in chunks:
            text = str(chunk.get("text") or "").strip()
            if not text:
                continue

            source = str(chunk.get("source") or (chunk.get("metadata") or {}).get("source") or "unknown")
            page = chunk.get("page")
            if page is None:
                page = (chunk.get("metadata") or {}).get("page", "unknown")

            sections.append(f"[Source: {source} | Page: {page}]\n{text}")

        return "\n\n".join(sections)

    def _build_pdf_prompt(self, question: str, chunks: list[dict[str, Any]]) -> str:
        """Prompt for the RAG path (PDF chunks are available)."""
        return (
            f"{SYSTEM_PROMPT_RAG}\n\n"
            "Educational context from the uploaded PDF document:\n"
            f"{self._build_context(chunks)}\n\n"
            f"Student question: {question}\n\n"
            "Answer using only the educational context above. "
            "Cite the relevant source and page when possible. "
            "Include simple examples related to the question when appropriate."
        )

    def _build_general_prompt(self, question: str) -> str:
        """Prompt for the no-PDF / general-knowledge fallback path."""
        return (
            f"{SYSTEM_PROMPT_GENERAL}\n\n"
            f"Student question: {question}\n\n"
            "Answer the question using your general knowledge. "
            "Include simple examples. Make the explanation suitable for a learner."
        )

    def _generate_general_answer(self, question: str) -> str:
        """Call the primary LLM using its general knowledge (no PDF context available)."""
        prompt = self._build_general_prompt(question)
        gemini_start = time.perf_counter()
        answer = self.gemini_client.generate_response(prompt).strip()
        gemini_time = time.perf_counter() - gemini_start
        logger.info("[PERF] LLM generation (general mode): %.2fs", gemini_time)
        return answer

    def _is_actually_relevant(
        self, question: str, chunks: list[dict[str, Any]]
    ) -> bool:
        """Check if retrieved chunks actually contain information relevant to the question.

        This goes beyond similarity threshold to ensure we don't use unrelated chunks.
        For example: if the PDF is about photosynthesis and user asks about blockchain,
        we should NOT use the photosynthesis chunks even if some similarity exists.
        """
        if not chunks:
            return False

        # Normalize question for comparison
        question_lower = question.lower()
        # Extract key terms from question (words > 3 chars, excluding common words)
        # Strip punctuation from words to handle questions like "What is AI?"
        stop_words = {
            "what", "is", "are", "was", "were", "the", "a", "an", "of", "in",
            "on", "at", "to", "for", "with", "how", "why", "when", "who",
            "which", "can", "could", "would", "should", "does", "do", "did",
            "explain", "describe", "tell", "about", "mean", "meaning"
        }
        question_words = set()
        for w in question_lower.split():
            # Strip common punctuation
            clean_word = w.strip(string.punctuation)
            if len(clean_word) > 3 and clean_word not in stop_words:
                question_words.add(clean_word)

        if not question_words:
            # If question is too generic, rely on similarity threshold
            return True

        # Check if any chunk contains at least one key term from the question
        relevant_count = 0
        for chunk in chunks:
            chunk_text = (chunk.get("text") or "").lower()
            for word in question_words:
                if word in chunk_text:
                    relevant_count += 1
                    break

        # Require at least one relevant chunk out of the top chunks
        # This ensures we're not using completely unrelated content
        return relevant_count > 0

    def _build_sources(self, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        sources: list[dict[str, Any]] = []
        for chunk in chunks:
            metadata = chunk.get("metadata") or {}
            source = chunk.get("source") or metadata.get("source") or "unknown"
            page = chunk.get("page")
            if page is None:
                page = metadata.get("page")

            sources.append(
                {
                    "source": source,
                    "page": page,
                    "score": float(chunk.get("score") or 0.0),
                    "text": chunk.get("text") or "",
                }
            )
        return sources

    def generate(
        self,
        question: str,
        top_k: int | None = None,
        document_filter: str | None = None,
        user_filter: str | None = None,
    ) -> dict[str, Any]:
        if not question or not question.strip():
            raise ValueError("question must not be empty.")

        default_top_k = getattr(self.retriever, "top_k", 5)
        if not isinstance(default_top_k, int):
            default_top_k = 5

        requested_top_k = default_top_k if top_k is None else top_k
        if requested_top_k <= 0:
            raise ValueError("top_k must be greater than 0.")

        # [PERF] RAG retrieval timing (single embedding call only when needed)
        retrieval_start = time.perf_counter()
        relevant_chunks = self.retriever.retrieve(
            question,
            top_k=requested_top_k,
            document_filter=document_filter,
            user_filter=user_filter,
        )
        retrieval_time = time.perf_counter() - retrieval_start
        logger.info("[PERF] RAG retrieval: %.2fs", retrieval_time)

        # -----------------------------------------------------------------
        # MODE 1: relevant PDF chunks available AND actually relevant to question
        # -----------------------------------------------------------------
        if relevant_chunks and self._is_actually_relevant(question, relevant_chunks):
            logger.info(
                "[CHAT] RAG mode: %d relevant chunk(s) above threshold AND relevant to question",
                len(relevant_chunks),
            )

            # [PERF] RAG context construction timing
            context_start = time.perf_counter()
            prompt = self._build_pdf_prompt(question, relevant_chunks)
            context_time = time.perf_counter() - context_start
            logger.info("[PERF] RAG context construction: %.2fs", context_time)

            # [PERF] Gemini generation timing (single call)
            gemini_start = time.perf_counter()
            answer = self.gemini_client.generate_response(prompt).strip()
            gemini_time = time.perf_counter() - gemini_start
            logger.info("[PERF] LLM generation: %.2fs", gemini_time)

            return {
                "answer": answer,
                "sources": self._build_sources(relevant_chunks),
                "mode": "rag",
            }

        # Chunks exist but are NOT relevant to question (e.g., PDF is about photosynthesis
        # but user asks about blockchain) -> fall through to general knowledge mode

        # -----------------------------------------------------------------
        # MODE 2: no relevant chunks -> general Gemini knowledge fallback
        # -----------------------------------------------------------------
        logger.info(
            "[CHAT] General-knowledge mode: no relevant PDF chunks "
            "(threshold=%s). Using LLM general knowledge.",
            getattr(self.retriever, "similarity_threshold", None),
        )

        answer = self._generate_general_answer(question)

        return {
            "answer": answer,
            "sources": [],
            "mode": "general",
        }


# Module-level cached RAG service instance - initialized once per process
_cached_rag_service: GroundedRAGService | None = None


def get_cached_rag_service() -> GroundedRAGService:
    """Get or create the cached RAG service singleton.
    
    This function ensures the SentenceTransformer model, Supabase client,
    and centralized Gemini client (7-key rotation) are only
    initialized once and reused across requests.
    The cached service uses RAG_SIMILARITY_THRESHOLD so that irrelevant
    chunks do NOT silently trigger the RAG path.
    """
    global _cached_rag_service
    if _cached_rag_service is None:
        logger.info(
            "[PERF] Initializing cached RAG service (first request will load models) "
            "| similarity_threshold=%.2f",
            RAG_SIMILARITY_THRESHOLD,
        )
        _cached_rag_service = GroundedRAGService(
            embedding_provider=GeminiEmbeddingProvider(),
            vector_store=SupabaseVectorStore(),
            llm_client=get_llm_client(),
            top_k=5,
            similarity_threshold=RAG_SIMILARITY_THRESHOLD,
        )
        logger.info("[PERF] Cached RAG service initialized successfully")
    return _cached_rag_service


def answer_question(
    question: str,
    top_k: int = 5,
    document_filter: str | None = None,
    user_filter: str | None = None,
    retriever: RAGRetriever | None = None,
    gemini_client: GeminiClient | None = None,
    embedding_provider: GeminiEmbeddingProvider | None = None,
    vector_store: SupabaseVectorStore | None = None,
    similarity_threshold: float | None = None,
    llm_client: Any | None = None,
) -> dict[str, Any]:
    """Convenience function for dual-mode answer generation.

    When relevant PDF chunks are found (above the similarity threshold), the
    RAG pipeline is used. When no relevant chunks are found, Gemini
    (centralized 7-key rotation) generates a general-knowledge answer
    instead of returning an error.
    """
    # Use cached service unless custom components are explicitly provided
    if retriever is None and gemini_client is None and embedding_provider is None and vector_store is None and llm_client is None:
        service = get_cached_rag_service()
        return service.generate(
            question=question,
            top_k=top_k,
            document_filter=document_filter,
            user_filter=user_filter,
        )

    # Fall back to creating a new service for custom configurations
    service = GroundedRAGService(
        retriever=retriever,
        gemini_client=gemini_client,
        llm_client=llm_client,
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        top_k=top_k,
        similarity_threshold=(
            similarity_threshold
            if similarity_threshold is not None
            else RAG_SIMILARITY_THRESHOLD
        ),
    )
    return service.generate(
        question=question,
        top_k=top_k,
        document_filter=document_filter,
        user_filter=user_filter,
    )
