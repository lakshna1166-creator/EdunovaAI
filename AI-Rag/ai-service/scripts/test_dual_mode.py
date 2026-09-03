"""Quick smoke test for the dual-mode /chat endpoint."""
import json
import sys

import requests


BASE_URL = "http://localhost:8000"


def run_test_case(name: str, payload: dict) -> dict:
    print("=" * 80)
    print(f"TEST: {name}")
    print("=" * 80)
    print(f"Request: {json.dumps(payload)}")
    response = requests.post(f"{BASE_URL}/chat", json=payload, timeout=120)
    print(f"Status: {response.status_code}")
    try:
        body = response.json()
    except Exception:
        body = response.text
    print(f"Response: {json.dumps(body, indent=2)[:2000]}")
    print()
    return body


if __name__ == "__main__":
    # Test 1: No PDF, general AI question
    run_test_case(
        "1. No PDF, AI question",
        {"question": "What is artificial intelligence?"},
    )

    # Test 2: No PDF, Newton's first law
    run_test_case(
        "2. No PDF, Newton's first law",
        {"question": "Explain Newton's first law."},
    )

    # Test 3: No PDF, blockchain (might still be below threshold)
    run_test_case(
        "3. No PDF, blockchain (likely below threshold)",
        {"question": "What is blockchain?"},
    )

    # Test 4: Invalid request - missing question
    run_test_case(
        "4. Invalid request (missing question)",
        {},
    )

    # Test 5: Empty question - should be 422
    run_test_case(
        "5. Empty/whitespace question (should be 422)",
        {"question": "   "},
    )

    print("All tests complete.")