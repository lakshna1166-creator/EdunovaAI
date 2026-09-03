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
│   ├── llm/             # Omni (primary) + Gemini (fallback) clients
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
- **Omni (OpenAI-compatible Chat Completions)** - Primary LLM for answer generation and quiz creation
- **Google Gemini** - Optional fallback LLM (preserved)
- **PyMuPDF** - PDF text extraction

## Running

```bash
cd EduNovaAI/ai-service
python -m uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

## Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
- `OMNI_API_KEY` - Omni API key (primary LLM, required)
- `OMNI_API_URL` - Omni base URL, e.g. https://api.cheaperinference.com/v1 (required)
- `OMNI_MODEL` - Exact model id from the provider catalog (optional, defaults to gpt-4o-mini)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini API key (optional fallback, preserved)
- `HEYGEN_API_KEY` - HeyGen API key (optional video generation, backend-only)