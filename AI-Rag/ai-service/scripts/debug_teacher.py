"""Debug script to trace the teacher generation pipeline end-to-end.

Usage:
    python scripts/debug_teacher.py
    python scripts/debug_teacher.py --question "What is AI?" --level beginner

This script:
1. Retrieves relevant chunks from the RAG vector store
2. Builds the teacher prompt with context
3. Calls the Gemini API
4. Parses the JSON response
5. Prints the final structured output

Useful for:
- Verifying RAG retrieval is working
- Checking what prompt is sent to Gemini
- Debugging JSON parsing issues
- Testing different student levels
"""
import argparse
import json
import logging
import sys

sys.path.insert(0, ".")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

from app.lesson.teacher import AITeacherService
from app.rag.retriever import RAGRetriever
from app.lesson.teacher import _strip_markdown_fences


def main():
    parser = argparse.ArgumentParser(description="Debug the AI Teacher generation pipeline.")
    parser.add_argument(
        "--question",
        default="What is AI?",
        help="Question to ask the teacher.",
    )
    parser.add_argument(
        "--level",
        default="beginner",
        choices=["beginner", "intermediate", "advanced"],
        help="Student level.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of context chunks to retrieve.",
    )
    parser.add_argument(
        "--skip-api",
        action="store_true",
        help="Only test RAG retrieval, skip Gemini API call.",
    )
    args = parser.parse_args()

    print("\n" + "=" * 70)
    print(" AI TEACHER DEBUG SCRIPT")
    print("=" * 70)
    print(f"  Question : {args.question}")
    print(f"  Level    : {args.level}")
    print(f"  Top-K    : {args.top_k}")
    print(f"  Skip API : {args.skip_api}")
    print("=" * 70 + "\n")

    # Step 1: RAG Retrieval
    print("\n=== STEP 1: RAG RETRIEVAL ===")
    try:
        retriever = RAGRetriever()
        chunks = retriever.retrieve(question=args.question, top_k=args.top_k)
        print(f"Retrieved {len(chunks)} chunks:")
        for i, chunk in enumerate(chunks, 1):
            score = chunk.get("score", 0.0)
            source = chunk.get("source", "unknown")
            page = chunk.get("page", "?")
            text_preview = (chunk.get("text") or "")[:120].replace("\n", " ")
            print(f"  {i}. [{score:.3f}] {source} (p.{page})")
            print(f"     {text_preview}...")
        print()
    except Exception as exc:
        print(f"  ERROR during retrieval: {exc}")
        return

    if args.skip_api:
        print("\n[SKIP] Skipping Gemini API call (--skip-api flag)")
        return

    # Step 2: Build prompt
    print("\n=== STEP 2: PROMPT ===")
    try:
        service = AITeacherService()
        prompt = service._build_teacher_prompt(args.question, chunks, args.level)
        print(f"Prompt length: {len(prompt)} characters")
        print("\n--- Prompt (first 1500 chars) ---")
        print(prompt[:1500])
        if len(prompt) > 1500:
            print(f"\n... [{len(prompt) - 1500} more characters]")
        print("--- End of prompt ---\n")
    except Exception as exc:
        print(f"  ERROR building prompt: {exc}")
        return

    # Step 3: Call Gemini
    print("\n=== STEP 3: GEMINI API ===")
    try:
        raw_response = service.gemini_client.generate_response(prompt)
        print(f"Raw response length: {len(raw_response)} characters")
        print("\n--- Raw response (repr) ---")
        print(repr(raw_response[:800]))
        if len(raw_response) > 800:
            print(f"  ... [{len(raw_response) - 800} more chars]")
        print("--- End of raw response ---\n")
    except Exception as exc:
        print(f"  ERROR calling Gemini: {exc}")
        return

    # Step 4: Strip code fences
    print("\n=== STEP 4: CODE FENCE STRIPPING ===")
    clean = _strip_markdown_fences(raw_response)
    print(f"Starts with code fence: {raw_response.strip().startswith('```')}")
    print(f"Clean response length: {len(clean)} characters")
    print("\n--- Clean response (first 800 chars) ---")
    print(clean[:800])
    if len(clean) > 800:
        print(f"  ... [{len(clean) - 800} more chars]")
    print("--- End of clean response ---\n")

    # Step 5: Parse JSON
    print("\n=== STEP 5: JSON PARSING ===")
    try:
        parsed = json.loads(clean)
        print("  JSON parse: SUCCESS")
        print("\n--- Parsed response ---")
        print(json.dumps(parsed, indent=2, ensure_ascii=False))
        print("--- End of parsed response ---\n")
    except json.JSONDecodeError as exc:
        print(f"  JSON parse: FAILED")
        print(f"  Error: {exc}")
        print(f"  Position: line {exc.lineno}, column {exc.colno}")
        # Show the problematic area
        lines = clean.split("\n")
        start = max(0, exc.lineno - 3)
        end = min(len(lines), exc.lineno + 2)
        print("\n  Context around error:")
        for i, line in enumerate(lines[start:end], start + 1):
            marker = " >>> " if i == exc.lineno else "     "
            print(f"  {marker}Line {i}: {line[:120]}")
        return

    # Step 6: Final result
    print("\n=== STEP 6: FINAL RESULT ===")
    print(f"  Answer  : {parsed.get('answer', 'N/A')[:200]}")
    print(f"  Level   : {parsed.get('difficulty', 'N/A')}")
    print(f"  Sources : {len(chunks)} chunks retrieved")

    print("\n" + "=" * 70)
    print(" DEBUG COMPLETE")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
