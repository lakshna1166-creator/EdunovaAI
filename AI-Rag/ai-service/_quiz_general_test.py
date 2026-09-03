"""Test quiz general knowledge fallback."""
import json
import sys
sys.path.insert(0, '.')

from unittest.mock import patch
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Mock response from Gemini for general knowledge quiz
mock_response = (
    '[{"question": "What does RAG stand for?", '
    '"options": ["Retrieval-Augmented Generation", "Random AI Generator", "Recursive AI Graph", "Real-time Answering Generator"], '
    '"correct_answer": "Retrieval-Augmented Generation", '
    '"explanation": "RAG stands for Retrieval-Augmented Generation."}, '
    '{"question": "Which component in RAG fetches relevant documents?", '
    '"options": ["Generator", "Retriever", "Decoder", "Encoder"], '
    '"correct_answer": "Retriever", '
    '"explanation": "The retriever fetches relevant documents from a knowledge base."}]'
)

with patch('app.api.teacher.RAGRetriever.retrieve') as mock_retrieve, \
     patch('app.lesson.teacher.get_llm_client') as mock_get_llm:
    # Empty chunks -> triggers general knowledge fallback
    mock_retrieve.return_value = []
    mock_get_llm.return_value.generate_response.return_value = mock_response
    r = client.post('/teacher/quiz', json={'topic': 'RAG', 'level': 'beginner', 'number_of_questions': 2})
    print('Status:', r.status_code)
    body = r.json()
    print('Number of questions returned:', len(body.get('questions', [])))
    print('First question:', json.dumps(body['questions'][0], indent=2) if body.get('questions') else 'NONE')
