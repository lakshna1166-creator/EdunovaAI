"""Quick performance test for /chat endpoint."""
import json
import time
import requests

BASE_URL = "http://localhost:8000"


def perf_test(question: str, label: str):
    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"Q: {question}")
    print('-' * 60)
    start = time.perf_counter()
    response = requests.post(f"{BASE_URL}/chat", json={"question": question}, timeout=120)
    elapsed = time.perf_counter() - start
    print(f"Status: {response.status_code} | Time: {elapsed:.2f}s")
    try:
        body = response.json()
        print(f"Sources: {len(body.get('sources', []))}")
        answer_preview = body.get('answer', '')[:200]
        print(f"Answer preview: {answer_preview}...")
    except Exception:
        print(f"Response (raw): {response.text[:200]}")
    return elapsed


if __name__ == "__main__":
    # Health check
    r = requests.get(f"{BASE_URL}/health")
    print(f"Health: {r.json()}")

    # Test 1: General knowledge question (no PDF context)
    t1 = perf_test("What is artificial intelligence?", "General: AI definition")

    # Test 2: Another general knowledge question
    t2 = perf_test("Explain Newton's first law of motion.", "General: Newton's law")

    # Test 3: Third request - should be fastest (model already loaded)
    t3 = perf_test("What is photosynthesis?", "General: photosynthesis")

    # Test 4: Validation test - empty question
    r = requests.post(f"{BASE_URL}/chat", json={"question": "   "})
    print(f"\nValidation test (whitespace): {r.status_code} (expected 422)")

    # Test 5: Validation test - missing field
    r = requests.post(f"{BASE_URL}/chat", json={})
    print(f"Validation test (missing field): {r.status_code} (expected 422)")

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"  Request 1: {t1:.2f}s")
    print(f"  Request 2: {t2:.2f}s")
    print(f"  Request 3: {t3:.2f}s")
    print(f"  Note: SentenceTransformer model should be loaded after first request")
    print(f"  and reused for subsequent requests.")
