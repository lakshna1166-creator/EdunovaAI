from __future__ import annotations

import logging
import time
from typing import Any, Sequence

from app.core.config import SUPABASE_KEY, SUPABASE_URL

try:
    from supabase import create_client
except Exception:  # pragma: no cover - dependency may be absent in some environments
    create_client = None


DEFAULT_EMBEDDING_DIMENSION = 384

logger = logging.getLogger(__name__)


class SupabaseVectorStore:
    """Small Supabase + pgvector-backed vector store for document chunks."""

    def __init__(
        self,
        url: str | None = None,
        key: str | None = None,
        table_name: str = "document_chunks",
        embedding_dimension: int | None = None,
    ) -> None:
        self.url = SUPABASE_URL if url is None else url
        self.key = SUPABASE_KEY if key is None else key
        self.table_name = table_name
        self.embedding_dimension = embedding_dimension or DEFAULT_EMBEDDING_DIMENSION

        if not self.url or not self.key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be configured in the .env file."
            )

        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            if create_client is None:
                raise RuntimeError(
                    "The 'supabase' package is not installed. Install it to use Supabase vector storage."
                )
            self._client = create_client(self.url, self.key)
        return self._client

    def insert_document_chunks(
        self,
        chunks: Sequence[dict[str, Any]],
        embeddings: Sequence[Sequence[float]],
    ) -> list[dict[str, Any]]:
        """Insert document chunk records and their embeddings into Supabase."""
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings must have the same length.")

        records: list[dict[str, Any]] = []
        for chunk, embedding in zip(chunks, embeddings):
            text = str(chunk.get("text", "")).strip()
            metadata = dict(chunk)
            metadata.pop("text", None)
            metadata.pop("embedding", None)
            metadata.pop("page", None)
            metadata.pop("source", None)

            vector = [float(value) for value in embedding]
            if len(vector) != self.embedding_dimension:
                raise ValueError(
                    f"Embedding dimension mismatch: expected {self.embedding_dimension}, got {len(vector)}. "
                    "The Supabase pgvector column must match the embedding model output size."
                )

            records.append(
                {
                    "content": text,
                    "metadata": metadata,
                    "page": chunk.get("page", 1),
                    "source": chunk.get("source", "unknown"),
                    "embedding": vector,
                }
            )

        try:
            response = self._get_client().table(self.table_name).insert(records).execute()
            return response.data or []
        except Exception as exc:
            error_str = str(exc)
            if "PGRST205" in error_str or "Could not find the table" in error_str:
                raise RuntimeError(
                    f"Supabase table 'public.{self.table_name}' was not found in the schema cache (code PGRST205). "
                    "Please run the SQL migration script 'supabase/schema.sql' in your Supabase SQL Editor."
                ) from exc
            raise RuntimeError(f"Failed to insert document chunks into Supabase: {exc}") from exc

    def similarity_search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Return the most relevant chunk records for a query embedding using the match_document_chunks RPC."""
        if top_k <= 0:
            raise ValueError("top_k must be greater than 0.")

        query_vector = [float(value) for value in query_embedding]
        if len(query_vector) != self.embedding_dimension:
            raise ValueError(
                f"Embedding dimension mismatch: expected {self.embedding_dimension}, got {len(query_vector)}. "
                "The query embedding vector must match the Supabase pgvector column size."
            )

        client = self._get_client()

        try:
            logger.info(
                "[VECTOR_STORE] Calling match_document_chunks RPC | query_dim=%d | match_count=%d",
                len(query_vector),
                top_k,
            )
            rpc_start = time.perf_counter()
            response = client.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_vector,
                    "match_count": top_k,
                },
            ).execute()
            rpc_time = time.perf_counter() - rpc_start
            logger.info("[PERF] Supabase retrieval: %.2fs", rpc_time)

            rows = response.data or []
            logger.info("[VECTOR_STORE] RPC returned %d row(s)", len(rows))
            if rows is not None:
                return [
                    {
                        "text": row.get("content") or row.get("text") or "",
                        "metadata": row.get("metadata") or {},
                        "score": float(row.get("similarity") if row.get("similarity") is not None else row.get("score") or 0.0),
                        "page": row.get("page"),
                        "source": row.get("source"),
                    }
                    for row in rows
                ]
        except Exception as rpc_exc:
            logger.error("[VECTOR_STORE] RPC match_document_chunks failed: %s", rpc_exc)
            error_str = str(rpc_exc)
            if "PGRST205" in error_str or "Could not find the table" in error_str:
                raise RuntimeError(
                    f"Supabase table 'public.{self.table_name}' was not found in the schema cache (code PGRST205). "
                    "Please run 'supabase/schema.sql' in your Supabase SQL Editor."
                ) from rpc_exc
            if "PGRST202" in error_str or "Could not find the function" in error_str or "match_document_chunks" in error_str:
                # Attempt table query fallback if table exists, otherwise report clear error
                try:
                    table_response = client.table(self.table_name).select("*").execute()
                    rows = table_response.data or []
                    scored: list[dict[str, Any]] = []
                    for row in rows:
                        record_embedding = row.get("embedding") or []
                        if not record_embedding:
                            continue
                        score = cosine_similarity(query_vector, record_embedding)
                        scored.append(
                            {
                                "text": row.get("content") or row.get("text") or "",
                                "metadata": row.get("metadata") or {},
                                "score": score,
                                "page": row.get("page"),
                                "source": row.get("source"),
                            }
                        )
                    scored.sort(key=lambda item: item["score"], reverse=True)
                    return scored[:top_k]
                except Exception as table_exc:
                    table_err_str = str(table_exc)
                    if "PGRST205" in table_err_str or "Could not find the table" in table_err_str:
                        raise RuntimeError(
                            f"Supabase table 'public.{self.table_name}' was not found in the schema cache (code PGRST205). "
                            "Please run 'supabase/schema.sql' in your Supabase SQL Editor."
                        ) from table_exc
                    raise RuntimeError(
                        f"Supabase similarity search failed: RPC 'match_document_chunks' missing and table query failed: {table_exc}. "
                        "Please run 'supabase/schema.sql' in your Supabase SQL Editor."
                    ) from table_exc

            raise RuntimeError(f"Supabase similarity search failed: {rpc_exc}") from rpc_exc


def cosine_similarity(vector_a: Sequence[float], vector_b: Sequence[float]) -> float:
    """Return cosine similarity between two vectors."""
    if not vector_a or not vector_b:
        return 0.0

    if len(vector_a) != len(vector_b):
        raise ValueError("Vectors must have the same length for similarity comparison.")

    dot_product = sum(a * b for a, b in zip(vector_a, vector_b))
    norm_a = sum(a * a for a in vector_a) ** 0.5
    norm_b = sum(b * b for b in vector_b) ** 0.5

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(dot_product / (norm_a * norm_b))


def insert_document_chunks(
    chunks: Sequence[dict[str, Any]],
    embeddings: Sequence[Sequence[float]],
    url: str | None = None,
    key: str | None = None,
    table_name: str = "document_chunks",
) -> list[dict[str, Any]]:
    """Convenience function for inserting document chunks with embeddings."""
    store = SupabaseVectorStore(url=url, key=key, table_name=table_name)
    return store.insert_document_chunks(chunks, embeddings)


def similarity_search(
    query_embedding: Sequence[float],
    top_k: int = 5,
    url: str | None = None,
    key: str | None = None,
    table_name: str = "document_chunks",
) -> list[dict[str, Any]]:
    """Convenience function for searching relevant document chunks."""
    store = SupabaseVectorStore(url=url, key=key, table_name=table_name)
    return store.similarity_search(query_embedding=query_embedding, top_k=top_k)
