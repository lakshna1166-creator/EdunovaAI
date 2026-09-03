# EduNovaAI

## Overview
EduNovaAI is an educational AI teacher service built with FastAPI. It provides:

- **Chat** (`/chat`) - RAG-powered answers using PDF context with general-knowledge fallback
- **Teacher** (`/teacher/ask`, `/teacher/quiz`, `/teacher/evaluate`) - Structured teaching responses, quiz generation, and answer evaluation
- **Documents** (`/documents/upload`) - PDF upload, extraction, chunking, embedding, and Supabase storage

## Architecture

```
ai-service/
├── app/
│   ├── main.py          # FastAPI app entry point
│   ├── api/             # HTTP routes
│   ├── rag/             # RAG pipeline (embeddings, retrieval, vector store, answer)
│   ├── llm/             # Centralized Gemini client with 7-key rotation
│   ├── lesson/          # Teacher service (JSON generation, quiz, evaluation)
│   ├── core/            # Configuration
│   ├── services/        # External service integrations (reserved)
│   └── ...
├── tests/
├── scripts/
├── supabase/
├── data/
│   ├── uploads/         # Uploaded PDFs
│   └── processed/       # Processed data
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Tech Stack
- **FastAPI** - HTTP framework
- **SentenceTransformers** (all-MiniLM-L6-v2, 384-dim) - Local embeddings
- **Supabase pgvector** - Vector storage with `match_document_chunks` RPC
- **Google Gemini (gemini-2.0-flash, 7-key rotation)** - Sole LLM for answer generation and quiz creation
- **PyMuPDF** - PDF text extraction

## Running

```bash
cd EduNovaAI/ai-service
python -m uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

## Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
- `GEMINI_API_KEY_1` ... `GEMINI_API_KEY_7` - Google Gemini API keys (at least 1 required; empty slots ignored; rotation automatic)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `GEMINI_MODEL` - Gemini model id (optional, defaults to gemini-2.0-flash)
- `HEYGEN_API_KEY` - HeyGen API key (optional video generation, backend-only)