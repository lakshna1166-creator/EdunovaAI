from app.rag.chunker import chunk_text_pages


def test_chunk_text_pages_splits_and_preserves_metadata() -> None:
    pages = [
        {
            "page": 1,
            "text": "This is a long paragraph about Newton's laws and motion. It explains force, mass, and acceleration clearly.",
            "source": "physics.pdf",
        }
    ]

    chunks = chunk_text_pages(pages, chunk_size=8, chunk_overlap=3)

    assert len(chunks) >= 2
    assert all(chunk["page"] == 1 for chunk in chunks)
    assert all(chunk["source"] == "physics.pdf" for chunk in chunks)
    assert all(len(chunk["text"].split()) <= 8 for chunk in chunks)
    assert chunks[0]["text"].startswith("This")


def test_chunk_text_pages_ignores_empty_pages() -> None:
    pages = [
        {"page": 2, "text": "", "source": "notes.pdf"},
        {"page": 3, "text": "Meaningful content for this page.", "source": "notes.pdf"},
    ]

    chunks = chunk_text_pages(pages, chunk_size=5, chunk_overlap=2)

    assert len(chunks) >= 1
    assert all("Meaningful" in chunk["text"] or chunk["text"] for chunk in chunks)


def test_chunk_text_pages_validates_config() -> None:
    pages = [{"page": 1, "text": "Some text to chunk.", "source": "demo.pdf"}]

    try:
        chunk_text_pages(pages, chunk_size=0, chunk_overlap=0)
        assert False, "Expected ValueError for invalid chunk_size"
    except ValueError:
        pass

    try:
        chunk_text_pages(pages, chunk_size=10, chunk_overlap=10)
        assert False, "Expected ValueError for invalid overlap"
    except ValueError:
        pass
