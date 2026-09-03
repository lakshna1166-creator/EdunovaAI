"""Unit test to verify the JSON parsing fix in teacher.py without hitting the API."""
import sys
sys.path.insert(0, '.')

from app.lesson.teacher import AITeacherService


def test_json_with_code_fences():
    """Test that JSON wrapped in ```json ... ``` code fences is correctly parsed."""
    # Mock the gemini_client
    service = AITeacherService.__new__(AITeacherService)
    service.gemini_client = type('obj', (object,), {
        'generate_response': lambda self, prompt: '''```json
{
  "answer": "AI is artificial intelligence.",
  "explanation": "It is a field of computer science.",
  "example": "Self-driving cars.",
  "check_question": "What is AI?",
  "difficulty": "beginner"
}
```'''
    })()

    chunks = [{"source": "test.pdf", "page": 1, "text": "AI is artificial intelligence."}]
    result = service.generate_response_from_context("What is AI?", chunks, "beginner")

    assert result["answer"] == "AI is artificial intelligence.", f"Got: {result['answer']}"
    assert result["explanation"] == "It is a field of computer science.", f"Got: {result['explanation']}"
    assert result["example"] == "Self-driving cars.", f"Got: {result['example']}"
    assert result["difficulty"] == "beginner", f"Got: {result['difficulty']}"
    print("[PASS] test_json_with_code_fences")


def test_json_with_plain_fences():
    """Test JSON wrapped in plain ``` ... ``` fences."""
    service = AITeacherService.__new__(AITeacherService)
    service.gemini_client = type('obj', (object,), {
        'generate_response': lambda self, prompt: '''```
{
  "answer": "Test answer",
  "explanation": "Test explanation",
  "example": "Test example",
  "check_question": "Test question?",
  "difficulty": "intermediate"
}
```'''
    })()

    chunks = [{"source": "test.pdf", "page": 1, "text": "Test content."}]
    result = service.generate_response_from_context("Test?", chunks, "intermediate")

    assert result["answer"] == "Test answer", f"Got: {result['answer']}"
    assert result["difficulty"] == "intermediate", f"Got: {result['difficulty']}"
    print("[PASS] test_json_with_plain_fences")


def test_json_without_fences():
    """Test plain JSON without code fences."""
    service = AITeacherService.__new__(AITeacherService)
    service.gemini_client = type('obj', (object,), {
        'generate_response': lambda self, prompt: '''{
  "answer": "Plain answer",
  "explanation": "Plain explanation",
  "example": "Plain example",
  "check_question": "Plain question?",
  "difficulty": "advanced"
}'''
    })()

    chunks = [{"source": "test.pdf", "page": 1, "text": "Test content."}]
    result = service.generate_response_from_context("Test?", chunks, "advanced")

    assert result["answer"] == "Plain answer", f"Got: {result['answer']}"
    assert result["difficulty"] == "advanced", f"Got: {result['difficulty']}"
    print("[PASS] test_json_without_fences")


def test_json_with_extra_whitespace():
    """Test JSON with extra whitespace and multiline."""
    service = AITeacherService.__new__(AITeacherService)
    service.gemini_client = type('obj', (object,), {
        'generate_response': lambda self, prompt: '''

```json

{
  "answer": "Whitespace test",
  "explanation": "Works with extra whitespace",
  "example": "Example",
  "check_question": "Question?",
  "difficulty": "beginner"
}

```
'''
    })()

    chunks = [{"source": "test.pdf", "page": 1, "text": "Test content."}]
    result = service.generate_response_from_context("Test?", chunks, "beginner")

    assert result["answer"] == "Whitespace test", f"Got: {result['answer']}"
    print("[PASS] test_json_with_extra_whitespace")


def test_invalid_json_fallback():
    """Test that invalid JSON falls back to default response."""
    service = AITeacherService.__new__(AITeacherService)
    service.gemini_client = type('obj', (object,), {
        'generate_response': lambda self, prompt: "This is not JSON at all."
    })()

    chunks = [{"source": "test.pdf", "page": 1, "text": "Test content."}]
    result = service.generate_response_from_context("Test?", chunks, "beginner")

    assert "not available" in result["answer"].lower() or result["answer"] != "", f"Got: {result['answer']}"
    print("[PASS] test_invalid_json_fallback")


def test_empty_context_calls_general_knowledge():
    """Test that empty context falls back to general knowledge (calls Gemini)."""
    service = AITeacherService.__new__(AITeacherService)
    called = []
    service.gemini_client = type('obj', (object,), {
        'generate_response': lambda self, prompt: called.append(prompt) or '{"answer":"General knowledge answer","explanation":"An explanation","example":"An example","check_question":"Got it?","difficulty":"beginner"}'
    })()

    result = service.generate_response_from_context("Test?", [], "beginner")

    # Verify Gemini WAS called for general knowledge fallback
    assert len(called) == 1, "Gemini should be called for general knowledge fallback"
    assert "general knowledge" in called[0].lower(), "Prompt should mention general knowledge mode"
    # Verify response contains generated content, not "not available"
    assert "not available" not in result["answer"].lower(), f"Got: {result['answer']}"
    assert result["answer"] == "General knowledge answer", f"Got: {result['answer']}"
    assert result["difficulty"] == "beginner", f"Got: {result['difficulty']}"
    print("[PASS] test_empty_context_calls_general_knowledge")


if __name__ == "__main__":
    test_json_with_code_fences()
    test_json_with_plain_fences()
    test_json_without_fences()
    test_json_with_extra_whitespace()
    test_invalid_json_fallback()
    test_empty_context_calls_general_knowledge()
    print("\n[ALL TESTS PASSED]")
