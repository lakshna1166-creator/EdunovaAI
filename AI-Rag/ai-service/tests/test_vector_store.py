from unittest.mock import MagicMock, patch

import pytest

from app.rag.vector_store import (
    DEFAULT_EMBEDDING_DIMENSION,
    SupabaseVectorStore,
    cosine_similarity,
    insert_document_chunks,
    similarity_search,
)


def test_cosine_similarity_returns_expected_score() -> None:
    score = cosine_similarity([1, 0], [1, 0])
    assert score == 1.0

    score = cosine_similarity([1, 0], [0, 1])
    assert score == 0.0


def test_cosine_similarity_handles_zero_and_mismatched_vectors() -> None:
    assert cosine_similarity([], []) == 0.0
    assert cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0

    with pytest.raises(ValueError, match="same length"):
        cosine_similarity([1.0, 0.0], [1.0, 0.0, 0.0])


# 1. document_chunks record creation
def test_vector_store_insert_document_chunks_builds_expected_records() -> None:
    store = SupabaseVectorStore(
        url="https://example.supabase.co",
        key="secret-key",
        embedding_dimension=384,
    )
    client = MagicMock()
    table = MagicMock()
    execute = MagicMock()
    execute.execute.return_value = MagicMock(data=[{"id": 1, "inserted": True}])
    table.insert.return_value = execute
    client.table.return_value = table

    dummy_384_embedding = [0.05] * 384

    with patch.object(store, "_get_client", return_value=client):
        result = store.insert_document_chunks(
            [
                {
                    "text": "Newton's laws explain classical mechanics.",
                    "page": 3,
                    "source": "physics_lesson.pdf",
                    "user_id": "student-42",
                    "topic": "Forces",
                }
            ],
            [dummy_384_embedding],
        )

    assert result == [{"id": 1, "inserted": True}]
    client.table.assert_called_once_with("document_chunks")
    table.insert.assert_called_once()

    inserted_records = table.insert.call_args[0][0]
    assert len(inserted_records) == 1
    record = inserted_records[0]
    assert record["content"] == "Newton's laws explain classical mechanics."
    assert record["page"] == 3
    assert record["source"] == "physics_lesson.pdf"
    assert record["metadata"] == {"user_id": "student-42", "topic": "Forces"}
    assert len(record["embedding"]) == 384
    assert record["embedding"] == dummy_384_embedding


# 2. embedding dimension validation
def test_vector_store_embedding_dimension_validation_on_insert() -> None:
    store = SupabaseVectorStore(
        url="https://example.supabase.co",
        key="secret-key",
        embedding_dimension=384,
    )

    with pytest.raises(ValueError, match="Embedding dimension mismatch: expected 384, got 3"):
        store.insert_document_chunks(
            [{"text": "Short vector test"}],
            [[0.1, 0.2, 0.3]],
        )


def test_vector_store_embedding_dimension_validation_on_search() -> None:
    store = SupabaseVectorStore(
        url="https://example.supabase.co",
        key="secret-key",
        embedding_dimension=384,
    )

    with pytest.raises(ValueError, match="Embedding dimension mismatch: expected 384, got 2"):
        store.similarity_search([0.1, 0.2], top_k=5)


# 3. Supabase configuration validation
def test_vector_store_requires_supabase_config() -> None:
    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_KEY must be configured"):
        SupabaseVectorStore(url="", key="")

    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_KEY must be configured"):
        SupabaseVectorStore(url="https://example.supabase.co", key="")

    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_KEY must be configured"):
        SupabaseVectorStore(url="", key="some-key")


# 4. similarity search RPC call
def test_vector_store_similarity_search_calls_match_document_chunks_rpc() -> None:
    store = SupabaseVectorStore(
        url="https://example.supabase.co",
        key="secret-key",
        embedding_dimension=384,
    )
    client = MagicMock()
    dummy_query_vector = [0.1] * 384

    client.rpc.return_value.execute.return_value = MagicMock(
        data=[
            {
                "id": 10,
                "content": "Force equals mass times acceleration.",
                "metadata": {"section": "2.1"},
                "similarity": 0.95,
                "page": 5,
                "source": "physics.pdf",
            }
        ]
    )

    with patch.object(store, "_get_client", return_value=client):
        results = store.similarity_search(dummy_query_vector, top_k=3)

    client.rpc.assert_called_once_with(
        "match_document_chunks",
        {
            "query_embedding": dummy_query_vector,
            "match_count": 3,
        },
    )
    assert len(results) == 1
    assert results[0]["text"] == "Force equals mass times acceleration."
    assert results[0]["score"] == 0.95
    assert results[0]["page"] == 5
    assert results[0]["source"] == "physics.pdf"
    assert results[0]["metadata"] == {"section": "2.1"}


# 5. handling missing Supabase configuration via helpers
def test_convenience_helpers_pass_config() -> None:
    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_KEY must be configured"):
        insert_document_chunks(chunks=[], embeddings=[], url="", key="")

    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_KEY must be configured"):
        similarity_search(query_embedding=[0.1] * 384, top_k=5, url="", key="")


# 6. database error handling
def test_vector_store_insert_handles_missing_table_error() -> None:
    store = SupabaseVectorStore(
        url="https://example.supabase.co",
        key="secret-key",
        embedding_dimension=384,
    )
    client = MagicMock()
    client.table.return_value.insert.return_value.execute.side_effect = Exception(
        "{'message': \"Could not find the table 'public.document_chunks' in the schema cache\", 'code': 'PGRST205'}"
    )

    dummy_vector = [0.1] * 384
    with patch.object(store, "_get_client", return_value=client):
        with pytest.raises(RuntimeError, match="PGRST205"):
            store.insert_document_chunks([{"text": "Sample"}], [dummy_vector])


def test_vector_store_search_handles_missing_rpc_and_table_error() -> None:
    store = SupabaseVectorStore(
        url="https://example.supabase.co",
        key="secret-key",
        embedding_dimension=384,
    )
    client = MagicMock()
    client.rpc.return_value.execute.side_effect = Exception(
        "{'message': \"Could not find the function 'public.match_document_chunks' in the schema cache\", 'code': 'PGRST202'}"
    )
    client.table.return_value.select.return_value.execute.side_effect = Exception(
        "{'message': \"Could not find the table 'public.document_chunks' in the schema cache\", 'code': 'PGRST205'}"
    )

    dummy_vector = [0.1] * 384
    with patch.object(store, "_get_client", return_value=client):
        with pytest.raises(RuntimeError, match="PGRST205|supabase/schema.sql"):
            store.similarity_search(dummy_vector, top_k=3)
