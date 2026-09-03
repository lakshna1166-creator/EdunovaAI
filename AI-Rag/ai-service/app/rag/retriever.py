from __future__ import annotations

import logging
from typing import Any, Sequence

from app.core.config import RAG_SIMILARITY_THRESHOLD
from app.rag.embeddings import GeminiEmbeddingProvider
from app.rag.vector_store import SupabaseVectorStore

logger = logging.getLogger(__name__)


class RAGRetriever:
    """Retrieve the most relevant text chunks for a user question."""

    def __init__(
        self,
        embedding_provider: GeminiEmbeddingProvider | None = None,
        vector_store: SupabaseVectorStore | None = None,
        top_k: int = 5,
        similarity_threshold: float | None = None,
    ) -> None:
        self.embedding_provider = embedding_provider or GeminiEmbeddingProvider()
        self.vector_store = vector_store or SupabaseVectorStore()
        self.top_k = top_k
        # Optional minimum similarity score for a chunk to be considered
        # relevant. Chunks below this threshold are filtered out so that
        # unrelated rows in Supabase do NOT silently trigger the RAG path.
        # Set similarity_threshold=None to disable filtering entirely.
        if similarity_threshold is not None:
            self.similarity_threshold = float(similarity_threshold)
        elif RAG_SIMILARITY_THRESHOLD is not None:
            self.similarity_threshold = float(RAG_SIMILARITY_THRESHOLD)
        else:
            self.similarity_threshold = None

    def retrieve(
        self,
        question: str,
        top_k: int | None = None,
        document_filter: str | None = None,
        user_filter: str | None = None,
    ) -> list[dict[str, Any]]:
        """Embed a question and find the most relevant document chunks in Supabase."""
        if not question or not question.strip():
            raise ValueError("question must not be empty.")

        if top_k is None:
            top_k = self.top_k
        if top_k <= 0:
            raise ValueError("top_k must be greater than 0.")

        logger.info("[RETRIEVER] Query: %s", question)

        query_embedding = self.embedding_provider.embed_text(question)
        if not query_embedding:
            raise RuntimeError("The embedding provider returned an empty vector for the question.")

        logger.info("[RETRIEVER] Query embedding dimension: %d", len(query_embedding))

        results = self.vector_store.similarity_search(query_embedding=query_embedding, top_k=top_k)

        logger.info("[RETRIEVER] Retrieved %d chunk(s) from Supabase", len(results))

        filtered: list[dict[str, Any]] = []
        for row in results:
            metadata = row.get("metadata") or {}
            source = row.get("source") or metadata.get("source") or ""
            page = row.get("page")
            score = float(row.get("score") or 0.0)

            if document_filter and str(source).lower() != str(document_filter).lower():
                continue
            # Only filter by user_id when the chunk explicitly has a user_id that
            # does NOT match the requested filter.  Chunks without any user_id
            # (e.g. PDF documents uploaded without a user context) are always
            # included so that the /chat and /teacher endpoints can find them.
            if user_filter and metadata.get("user_id") is not None:
                if str(metadata.get("user_id")).lower() != str(user_filter).lower():
                    continue

            # Relevance threshold: drop chunks that are not similar enough to
            # the user's question. This prevents unrelated rows in Supabase
            # from silently triggering the RAG path. Set similarity_threshold
            # to None on the retriever to disable filtering entirely.
            if self.similarity_threshold is not None and score < self.similarity_threshold:
                logger.debug(
                    "[RETRIEVER] Dropping chunk below similarity threshold: "
                    "score=%.4f < threshold=%.4f",
                    score,
                    self.similarity_threshold,
                )
                continue

            filtered.append(
                {
                    "text": row.get("text") or "",
                    "score": score,
                    "page": page,
                    "source": source,
                    "metadata": metadata,
                }
            )

        logger.info(
            "[RETRIEVER] Chunks after filter (threshold=%s): %d",
            self.similarity_threshold,
            len(filtered),
        )
        return filtered[:top_k]


def retrieve_relevant_chunks(
    question: str,
    top_k: int = 5,
    document_filter: str | None = None,
    user_filter: str | None = None,
    embedding_provider: GeminiEmbeddingProvider | None = None,
    vector_store: SupabaseVectorStore | None = None,
    similarity_threshold: float | None = None,
) -> list[dict[str, Any]]:
    """Convenience function for RAG retrieval."""
    retriever = RAGRetriever(
        embedding_provider=embedding_provider,
        vector_store=vector_store,
        top_k=top_k,
        similarity_threshold=similarity_threshold,
    )
    return retriever.retrieve(
        question=question,
        top_k=top_k,
        document_filter=document_filter,
        user_filter=user_filter,
    )
