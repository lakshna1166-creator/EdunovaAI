from __future__ import annotations

from typing import Any


DEFAULT_CHUNK_SIZE = 400
DEFAULT_CHUNK_OVERLAP = 80


def chunk_text_pages(
    pages: list[dict[str, Any]],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[dict[str, Any]]:
    """Split a list of page dictionaries into overlapping text chunks.

    Each chunk keeps the metadata from the source page: text, page, source.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0")
    if chunk_overlap < 0:
        raise ValueError("chunk_overlap must be greater than or equal to 0")
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    chunks: list[dict[str, Any]] = []

    for page in pages:
        text = str(page.get("text", "")).strip()
        if not text:
            continue

        words = text.split()
        if not words:
            continue

        step = chunk_size - chunk_overlap
        if step <= 0:
            raise ValueError("chunk_size must be larger than chunk_overlap")

        for start_index in range(0, len(words), step):
            end_index = start_index + chunk_size
            slice_words = words[start_index:end_index]
            if not slice_words:
                continue

            chunk_text = " ".join(slice_words)
            chunks.append({
                "text": chunk_text,
                "page": page.get("page", 1),
                "source": page.get("source", "unknown"),
            })

            if end_index >= len(words):
                break

    return chunks
