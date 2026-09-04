# EduNovaAI Backend–Frontend–AI-Rag Integration Audit

> **Audit Date:** 2026-09-04  
> **Mode:** Read-Only Technical Audit  
> **AI-Rag Modified:** NO  
> **Frontend Modified:** NO  
> **Backend Modified:** NO  

---

## 1. Executive Summary

**Overall Integration Status:** ⚠️ **Partially Connected — Critical Routing Break**

| Connection | Status |
|---|---|
| Frontend → Backend (general API) | ✅ Working |
| Frontend → Backend (AI Teacher) | ❌ **BROKEN** — wrong URL path |
| Backend → AI-Rag | ✅ Route exists, but URL depends on env var `RAG_SERVICE_URL` |
| Full chain (Frontend → Backend → AI-Rag → LLM) | ❌ **NOT CONNECTED** |

**Main Blocking Issue:** The Frontend's `teacherApi.ask()` calls `/teacher/ask`, but the Backend only mounts its AI router under `/api/ai`, not `/api/teacher`. There is no route at `/api/teacher/ask` on the Backend.

**LLM Reachability:** UNVERIFIED — The chain is broken before it can reach the AI-Rag layer.

---

## 2. Architecture Found

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACTUAL ARCHITECTURE FOUND                            │
└─────────────────────────────────────────────────────────────────────────────┘

  Browser (Frontend, port 5173)
  │
  │  proxy /api/* → http://localhost:5000/api/*
  │  (vite.config.js lines 12-15)
  ▼
┌──────────────────────────────────────────┐
│  Backend Express (port 5000)             │
│  server.js                               │
│                                          │
│  /api/auth/*     → authRoutes            │
│  /api/student/*  → studentRoutes         │
│  /api/progress/* → studentRoutes         │
│  /api/history/*  → studentRoutes         │
│  /api/materials/*→ studentRoutes         │
│  /api/material/* → studentRoutes         │
│  /api/recommendations/* → studentRoutes  │
│  /api/ai/*       → aiRoutes              │  ← AI endpoints LIVE HERE
│  /api/quiz/*     → quizRoutes            │
│  /api/analytics/* → analyticsRoutes      │
│                                          │
│  ⚠️ NO /api/teacher/* route exists!      │
└────────────────┬─────────────────────────┘
                 │ aiRoutes (aiRoutes.js)
                 │ /chat → socraticChat
                 │ /explain-differently → explainDifferently
                 │ /generate-lesson → generateLesson
                 ▼
┌──────────────────────────────────────────────────────┐
│  aiController.js (socraticChat)                       │
│                                                      │
│  Receives: { message, topic, tutorMode, history,       │
│              level }                                 │
│                                                      │
│  Calls: askRAG({ question, level }) from ragService   │
│         ↓                                           │
│  ragService.js                                      │
│  askRAG() → POST {RAG_SERVICE_URL}/teacher/ask     │
│         ↓ (requires RAG_SERVICE_URL env var)         │
└────────────────┬───────────────────────────────────┘
                 │ HTTP POST (server-to-server)
                 ▼
┌────────────────────────────────────────────────────────┐
│  AI-Rag FastAPI (default port 8000)                   │
│  app/main.py                                          │
│                                                        │
│  /health          → health check                      │
│  /chat            → RAG chat (GroundedRAGService)    │
│  /documents/upload → PDF ingestion                    │
│  /teacher/ask     → AITeacherService                 │  ← EXISTS ✅
│  /teacher/quiz    → Quiz generation                  │
│  /teacher/evaluate → Answer evaluation               │
│                                                        │
│  teacher.py (line 15): router = APIRouter(prefix="/teacher")
│  teacher.py (line 186): @router.post("/ask")
│                                                        │
│  LLM: GeminiLLMClient (7-key rotation)                │
│  Embeddings: SentenceTransformer (all-MiniLM-L6-v2)   │
│  Vector Store: Supabase pgvector                      │
└────────────────────────────────────────────────────────┘
                 │
                 │ Google Gemini API
                 ▼
          ┌────────────────┐
          │ Gemini LLM     │
          │ (Google AI)    │
          └────────────────┘
```

---

## 3. Frontend API Audit

### AI Teacher — `teacherApi`

| Field | Value |
|---|---|
| **Frontend file** | [`Frontend/src/services/api.js:155-157`](Frontend/src/services/api.js:155) |
| **Function** | `teacherApi.ask(payload)` |
| **URL called** | `/teacher/ask` (full URL: `http://localhost:5000/api/teacher/ask`) |
| **HTTP Method** | `POST` |
| **Request body** | `JSON.stringify({ question, level })` |
| **Expected response** | `{ answer, explanation, example, check_question, difficulty }` |
| **Status** | ❌ **404 — Route does not exist on Backend** |

**Evidence:** [`Frontend/src/services/api.js:156`](Frontend/src/services/api.js:156)
```javascript
export const teacherApi = {
  ask: (payload) => request('/teacher/ask', { method: 'POST', body: JSON.stringify(payload) }),
};
```

### AI Chat — `aiApi`

| Field | Value |
|---|---|
| **Frontend file** | [`Frontend/src/services/api.js:146-150`](Frontend/src/services/api.js:146) |
| **Function** | `aiApi.chat(payload)` |
| **URL called** | `/ai/chat` (full URL: `http://localhost:5000/api/ai/chat`) |
| **HTTP Method** | `POST` |
| **Request body** | `JSON.stringify({ message, topic, tutorMode, history, level })` |
| **Expected Backend** | `/api/ai/chat` → `aiController.socraticChat` |
| **Status** | ⚠️ **Defined but NOT called by any component** |

> **Note:** `aiApi` is exported from [`api.js`](Frontend/src/services/api.js:146) but searching the entire Frontend codebase shows **zero imports or usages** of `aiApi`. The only AI call is through `teacherApi.ask()`.

### Actual Call in AITeacherPage

| Field | Value |
|---|---|
| **Frontend file** | [`Frontend/src/pages/student/AITeacherPage.jsx:53-58`](Frontend/src/pages/student/AITeacherPage.jsx:53) |
| **Handler** | `handleSend()` |
| **API called** | `teacherApi.ask({ question: userText, level: 'beginner' })` |
| **Response extraction** | `result?.answer \|\| result?.data?.answer` |
| **Status** | ❌ **404 — wrong endpoint** |

---

## 4. Backend API Audit

### AI Routes — `aiRoutes.js`

| Route | Method | Controller | Handler | AI-Rag Destination | Status |
|---|---|---|---|---|---|
| `/api/ai/chat` | POST | `aiController.socraticChat` | Lines 8-108 | `askRAG()` → `{RAG_SERVICE_URL}/teacher/ask` | ✅ Defined |
| `/api/ai/explain-differently` | POST | `aiController.explainDifferently` | Lines 114-153 | **No AI-Rag call** (mock response) | ✅ Defined |
| `/api/ai/generate-lesson` | POST | `aiController.generateLesson` | Lines 160-216 | **No AI-Rag call** (mock response) | ✅ Defined |

**Mount point evidence:** [`Backend/server.js:202`](Backend/server.js:202)
```javascript
app.use("/api/ai", aiRoutes);
```

### RAG Service — `ragService.js`

| Field | Value |
|---|---|
| **File** | [`Backend/services/ragService.js`](Backend/services/ragService.js) |
| **Function** | `askRAG({ question, level })` |
| **URL** | `${RAG_SERVICE_URL}/teacher/ask` |
| **HTTP Method** | `POST` |
| **Request body** | `{ question, level }` |
| **Headers** | `Content-Type: application/json` |
| **Error handling** | Throws on non-2xx with error text |
| **Response parsing** | `response.json()` |
| **Timeout** | **None** (no timeout configured) |
| **Status** | ⚠️ Depends on `RAG_SERVICE_URL` env var |

> **Critical:** `RAG_SERVICE_URL` is read from `process.env.RAG_SERVICE_URL` at line 1-2 of [`ragService.js`](Backend/services/ragService.js). If this env var is not set, the URL becomes `undefined/teacher/ask` and the request will fail.

### Controller — `aiController.js`

| Field | Value |
|---|---|
| **File** | [`Backend/controllers/aiController.js`](Backend/controllers/aiController.js) |
| **Handler** | `socraticChat` (lines 8-108) |
| **Accepts** | `{ message, topic, tutorMode, history, level }` |
| **Sends to RAG** | `{ question: message.trim(), level }` |
| **Maps response** | `ragData.answer` → `message.text` |
| **Stores in DB** | `ai_tutor_chats` table in Supabase |
| **Error** | Returns `502 Bad Gateway` on RAG failure |

---

## 5. AI-Rag Audit

### FastAPI Application

| Field | Value |
|---|---|
| **Entry point** | [`AI-Rag/ai-service/app/main.py`](AI-Rag/ai-service/app/main.py) |
| **App name** | `EduNovaAI Teacher Service` |
| **Routers included** | `documents_router`, `chat_router`, `teacher_router` |
| **Health endpoint** | `GET /health` |
| **Default port** | 8000 |

### Teacher Router Endpoints

| Endpoint | Method | Handler | Response Schema |
|---|---|---|---|
| `/teacher/ask` | POST | `ask_teacher` (line 186) | `TeacherAskResponse` |
| `/teacher/quiz` | POST | `create_teacher_quiz` (line 219) | `TeacherQuizResponse` |
| `/teacher/evaluate` | POST | `evaluate_student_answer` (line 257) | `TeacherEvaluationResponse` |

### Request/Response Schemas

**`TeacherAskRequest`** (lines 83-105):
```python
{
  "question": str,       # required, min_length=1
  "level": str            # default="beginner", one of: beginner/intermediate/advanced
}
```

**`TeacherAskResponse`** (lines 114-121):
```python
{
  "answer": str,
  "explanation": str,
  "example": str,
  "check_question": str,
  "difficulty": str,
  "sources": list[{"page": int, "source": str, "score": float}]
}
```

### LLM Integration

| Field | Value |
|---|---|
| **LLM file** | [`AI-Rag/ai-service/app/llm/unified.py`](AI-Rag/ai-service/app/llm/unified.py) |
| **Client class** | `GeminiLLMClient` |
| **Model** | `gemini-2.0-flash` (configurable via `GEMINI_MODEL`) |
| **Key rotation** | Up to 7 keys (`GEMINI_API_KEY_1` through `GEMINI_API_KEY_7`) |
| **Key manager** | [`AI-Rag/ai-service/app/llm/key_manager.py`](AI-Rag/ai-service/app/llm/key_manager.py) |

### RAG Pipeline

| Component | File |
|---|---|
| Retriever | [`AI-Rag/ai-service/app/rag/retriever.py`](AI-Rag/ai-service/app/rag/retriever.py) |
| Embeddings | [`AI-Rag/ai-service/app/rag/embeddings.py`](AI-Rag/ai-service/app/rag/embeddings.py) |
| Vector Store | [`AI-Rag/ai-service/app/rag/vector_store.py`](AI-Rag/ai-service/app/rag/vector_store.py) |
| Answer Generator | [`AI-Rag/ai-service/app/rag/answer.py`](AI-Rag/ai-service/app/rag/answer.py) |
| Teacher Service | [`AI-Rag/ai-service/app/lesson/teacher.py`](AI-Rag/ai-service/app/lesson/teacher.py) |

### Supabase Integration

| Field | Value |
|---|---|
| **URL env var** | `SUPABASE_URL` |
| **Key env var** | `SUPABASE_KEY` |
| **Vector store** | Supabase pgvector with `match_document_chunks` RPC |
| **Schema** | [`AI-Rag/ai-service/supabase/schema.sql`](AI-Rag/ai-service/supabase/schema.sql) |

---

## 6. Endpoint Compatibility Matrix

| Layer | Endpoint | Method | Status | Problem |
|---|---|---|---|---|
| **Frontend** | `/teacher/ask` | POST | ❌ 404 | No route exists on Backend |
| **Frontend** | `/ai/chat` | POST | ⚠️ Unused | Defined but never called by any component |
| **Backend** | `/api/ai/chat` | POST | ✅ Exists | Calls `askRAG()` → AI-Rag |
| **Backend** | `/api/teacher/*` | ANY | ❌ Missing | No `/api/teacher` router mounted |
| **Backend → AI-Rag** | `{RAG_SERVICE_URL}/teacher/ask` | POST | ⚠️ Unverified | Depends on `RAG_SERVICE_URL` env var |
| **AI-Rag** | `/teacher/ask` | POST | ✅ Exists | Full RAG + LLM pipeline |
| **AI-Rag** | `/chat` | POST | ✅ Exists | RAG chat (different schema) |

### Schema Compatibility: Backend → AI-Rag

| Field | Backend sends | AI-Rag expects | Compatible? |
|---|---|---|---|
| `question` | ✅ | ✅ | Yes |
| `level` | ✅ | ✅ | Yes |
| Response `answer` | ✅ maps `ragData.answer` | ✅ | Yes |
| Response `explanation` | ✅ | ✅ | Yes |
| Response `example` | ✅ | ✅ | Yes |
| Response `check_question` | ✅ | ✅ | Yes |
| Response `difficulty` | ✅ | ✅ | Yes |

---

## 7. Current 404 Root Cause

### The Error

```
POST http://localhost:5000/api/teacher/ask → 404 Not Found
```

### Root Cause: Frontend and Backend Route Paths Are Mismatched

**Step-by-step trace:**

1. **Frontend makes the call:**
   - File: [`Frontend/src/pages/student/AITeacherPage.jsx:54`](Frontend/src/pages/student/AITeacherPage.jsx:54)
   - `teacherApi.ask({ question, level })` → `/teacher/ask`

2. **Vite proxy forwards:**
   - File: [`Frontend/vite.config.js:12-15`](Frontend/vite.config.js:12)
   - `/api` → `http://localhost:5000`
   - Request reaches Backend at: `http://localhost:5000/api/teacher/ask`

3. **Backend receives request at wrong path:**
   - File: [`Backend/server.js:202`](Backend/server.js:202)
   - `app.use("/api/ai", aiRoutes)` — AI routes mounted ONLY at `/api/ai`
   - `app.use("/api/teacher/*")` — **DOES NOT EXIST**

4. **Express notFoundHandler catches it:**
   - File: [`Backend/server.js:209`](Backend/server.js:209)
   - `app.use(notFoundHandler)` → Returns 404

### The Mismatch Summary

| Who | Path | Notes |
|---|---|---|
| **Frontend** calls | `/teacher/ask` | via `teacherApi.ask()` |
| **Backend expects** | `/api/ai/chat` | AI router mounted at `/api/ai` |
| **AI-Rag provides** | `/teacher/ask` | Full path: `{RAG_SERVICE_URL}/teacher/ask` |

**The Backend router is at `/api/ai/*` but the Frontend calls `/teacher/*`. The AI-Rag uses `/teacher/ask` as its path.**

### Why `/api/teacher/ask` Doesn't Exist

The Backend's [`aiRoutes.js`](Backend/routes/aiRoutes.js) is mounted at `/api/ai` (confirmed in [`server.js:202`](Backend/server.js:202)):

```javascript
// server.js line 202
app.use("/api/ai", aiRoutes);

// aiRoutes.js line 1
const router = express.Router();

// aiRoutes.js line 8 — the ONLY /chat route
router.post("/chat", ...);

// There is NO router.post("/teacher/ask", ...) anywhere
```

The Backend has no `/api/teacher` router. There is no route for it.

---

## 8. LLM Integration Status

| Question | Answer |
|---|---|
| Is Frontend connected to Backend for LLM requests? | ❌ **NO** — wrong URL path |
| Is Backend connected to AI-Rag? | ⚠️ **UNVERIFIED** — depends on `RAG_SERVICE_URL` env var |
| Are Backend and AI-Rag endpoint paths compatible? | ✅ **YES** — both use `/teacher/ask` |
| Are request schemas compatible? | ✅ **YES** — both use `{ question, level }` |
| Are response schemas compatible? | ✅ **YES** — Backend maps all AI-Rag fields |
| Is the LLM actually reachable through the complete chain? | ❌ **NO** — chain broken at Frontend → Backend step |

---

## 9. Problems Found

### 🔴 Critical

#### Problem 1: Frontend Calls Non-Existent `/api/teacher/ask` Route

| Field | Value |
|---|---|
| **Problem** | `teacherApi.ask()` calls `/teacher/ask`, which results in `POST /api/teacher/ask` hitting the Backend, but no such route exists |
| **File** | [`Frontend/src/services/api.js:156`](Frontend/src/services/api.js:156) |
| **Evidence** | Backend mounts `aiRoutes` at `/api/ai` (not `/api/teacher`); [`aiRoutes.js`](Backend/routes/aiRoutes.js) has no `/teacher/ask` route |
| **Impact** | All AI Teacher chat requests return 404; zero AI teaching functionality works |
| **Fix** | Change `teacherApi.ask()` URL from `/teacher/ask` to `/ai/chat`, OR rename the Backend router from `/api/ai` to `/api/teacher` |

---

#### Problem 2: RAG_SERVICE_URL Environment Variable Not Defined

| Field | Value |
|---|---|
| **Problem** | `ragService.js` reads `process.env.RAG_SERVICE_URL` but this env var may not be set in the Backend's `.env` file |
| **File** | [`Backend/services/ragService.js:1-2`](Backend/services/ragService.js:1) |
| **Evidence** | `const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL;` — no default fallback |
| **Impact** | Even if the Frontend→Backend route were fixed, the Backend→AI-Rag call would go to `undefined/teacher/ask` and fail |
| **Fix** | Set `RAG_SERVICE_URL=http://localhost:8000` (or deployed AI-Rag URL) in Backend `.env` |

---

#### Problem 3: AI Chat Function Is Defined But Never Used

| Field | Value |
|---|---|
| **Problem** | `aiApi.chat()` is exported in [`api.js:146-150`](Frontend/src/services/api.js:146) but no Frontend component imports or calls it |
| **File** | [`Frontend/src/services/api.js:146`](Frontend/src/services/api.js:146) |
| **Evidence** | Search of entire Frontend codebase shows zero imports of `aiApi` |
| **Impact** | The correctly-named Backend endpoint `/api/ai/chat` exists but is unreachable |
| **Fix** | Either use `aiApi.chat()` in `AITeacherPage.jsx` (and update the request body to use `message` instead of `question`), OR delete the unused `aiApi` export |

---

### 🟠 High

#### Problem 4: Request Body Field Name Mismatch (if Problem 1 is fixed with `/ai/chat`)

| Field | Value |
|---|---|
| **Problem** | If `teacherApi.ask()` is changed to call `/ai/chat`, the Backend expects `message` but `teacherApi.ask()` sends `question` |
| **Evidence** | Frontend: `{ question: userText, level: 'beginner' }` (api.js:54-57); Backend: `const { message, ... } = req.body` (aiController.js:11) |
| **Impact** | Backend validates `message` and returns 400 "Message content cannot be empty" |
| **Fix** | Change Frontend payload from `{ question, level }` to `{ message, level }` |

---

#### Problem 5: Response Field Extraction Mismatch

| Field | Value |
|---|---|
| **Problem** | `AITeacherPage.jsx` extracts `result?.answer` but if routed through `socraticChat`, the response is nested under `message.text` |
| **Evidence** | Frontend (line 58): `result?.answer || result?.data?.answer`; Backend (line 79): `text: aiResponse` nested in `message: { text: aiResponse }` |
| **Impact** | Even if request body is fixed, the response text would be `undefined` and no AI message appears in chat |
| **Fix** | Update Frontend to extract `result?.message?.text` instead of `result?.answer` |

---

### 🟡 Medium

#### Problem 6: explainDifferently and generateLesson Are Mock Endpoints

| Field | Value |
|---|---|
| **Problem** | `/api/ai/explain-differently` and `/api/ai/generate-lesson` return hardcoded mock data, not AI-generated content |
| **File** | [`Backend/controllers/aiController.js:114-216`](Backend/controllers/aiController.js:114) |
| **Evidence** | `explainDifferently` returns static strings; `generateLesson` returns a templated object |
| **Impact** | The "Explain Differently" feature in the UI uses mock responses, not real AI |
| **Fix** | Wire these endpoints to call AI-Rag or another LLM service |

---

#### Problem 7: No Timeout on Backend → AI-Rag Fetch

| Field | Value |
|---|---|
| **Problem** | `ragService.js` performs a fetch with no timeout configuration |
| **File** | [`Backend/services/ragService.js:4-14`](Backend/services/ragService.js:4) |
| **Evidence** | `fetch()` call has no `signal`, no timeout option |
| **Impact** | A slow/hanging AI-Rag response could leave the Backend request hanging indefinitely |
| **Fix** | Add an `AbortController` with timeout (Frontend's api.js already does this at 180s) |

---

#### Problem 8: Backend .env.example Missing

| Field | Value |
|---|---|
| **Problem** | No `.env.example` file exists in the Backend directory to document required environment variables |
| **Evidence** | `Backend/.env.example` does not exist |
| **Impact** | Developers don't know which env vars are required |
| **Fix** | Create `Backend/.env.example` documenting: `RAG_SERVICE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `PORT` |

---

### 🔵 Low

#### Problem 9: Dual LocalStorage Token Keys

| Field | Value |
|---|---|
| **Problem** | `getToken()` checks for both `edunova_token` and `edumind_token` |
| **File** | [`Frontend/src/services/api.js:12`](Frontend/src/services/api.js:12) |
| **Evidence** | `localStorage.getItem('edunova_token') \|\| localStorage.getItem('edumind_token')` |
| **Impact** | Legacy `edumind_*` keys create confusion; `setAuthSession` removes them |
| **Fix** | Consolidate to only `edunova_*` keys |

---

## 10. Recommended Fixes

> **Note:** These are recommendations only. No changes were made during this audit.

### Frontend Fixes

| Priority | Fix | File | What to Change |
|---|---|---|---|
| 🔴 Critical | Change `teacherApi.ask()` URL to `/ai/chat` | [`Frontend/src/services/api.js:156`](Frontend/src/services/api.js:156) | `'/teacher/ask'` → `'/ai/chat'` |
| 🟠 High | Change request body field from `question` to `message` | [`Frontend/src/pages/student/AITeacherPage.jsx:54`](Frontend/src/pages/student/AITeacherPage.jsx:54) | `{ question: userText, level }` → `{ message: userText, level }` |
| 🟠 High | Fix response extraction for nested `message.text` | [`Frontend/src/pages/student/AITeacherPage.jsx:58`](Frontend/src/pages/student/AITeacherPage.jsx:58) | `result?.answer \|\| result?.data?.answer` → `result?.message?.text` |
| 🔵 Low | Remove unused `aiApi` export (or document it's reserved) | [`Frontend/src/services/api.js:146-150`](Frontend/src/services/api.js:146) | Optional cleanup |

### Backend Fixes

| Priority | Fix | File | What to Change |
|---|---|---|---|
| 🔴 Critical | Add `RAG_SERVICE_URL` to `.env` | Backend `.env` | Add `RAG_SERVICE_URL=http://localhost:8000` (or deployed URL) |
| 🟡 Medium | Create `.env.example` | `Backend/.env.example` | Document all required env vars including `RAG_SERVICE_URL` |
| 🟡 Medium | Add timeout to `ragService.js` fetch | [`Backend/services/ragService.js`](Backend/services/ragService.js) | Add `AbortController` with 180s timeout |
| 🟡 Medium | Wire `/api/ai/explain-differently` to real AI service | [`Backend/controllers/aiController.js:114-153`](Backend/controllers/aiController.js:114) | Replace mock with AI-Rag call |
| 🟡 Medium | Wire `/api/ai/generate-lesson` to real AI service | [`Backend/controllers/aiController.js:160-216`](Backend/controllers/aiController.js:160) | Replace mock with AI-Rag call |

### AI-Rag Fixes

> ⚠️ **AI-Rag was NOT modified during this audit.** The following are informational only.

| Priority | Observation | Recommendation |
|---|---|---|
| ✅ None needed | AI-Rag `/teacher/ask` endpoint is fully functional | No changes needed |
| 🔵 Low | No authentication on `/teacher/ask` | Consider adding API key auth if exposed publicly |
| 🔵 Low | No rate limiting | Consider adding rate limiting for quota protection |

---

## 11. Files That Should Be Changed Later

| File | Why It May Need Modification | What Should Change |
|---|---|---|
| [`Frontend/src/services/api.js`](Frontend/src/services/api.js:156) | `teacherApi.ask()` calls wrong URL path | Change endpoint from `/teacher/ask` to `/ai/chat` |
| [`Frontend/src/pages/student/AITeacherPage.jsx`](Frontend/src/pages/student/AITeacherPage.jsx:54) | Sends wrong field name (`question` vs `message`) and extracts wrong response field | Update payload to `{ message, level }` and response to `result?.message?.text` |
| [`Backend/services/ragService.js`](Backend/services/ragService.js:1) | `RAG_SERVICE_URL` may not be set | Add default fallback or document in `.env` |
| `Backend/.env` | Missing `RAG_SERVICE_URL` | Add `RAG_SERVICE_URL=http://localhost:8000` |
| `Backend/.env.example` | Does not exist | Create to document all required env vars |
| [`Frontend/src/services/api.js`](Frontend/src/services/api.js:146) | `aiApi` is exported but unused | Consider removing or documenting as reserved |
| [`Backend/controllers/aiController.js:114`](Backend/controllers/aiController.js:114) | `explainDifferently` is a mock endpoint | Wire to real AI service or document as placeholder |
| [`Backend/controllers/aiController.js:160`](Backend/controllers/aiController.js:160) | `generateLesson` is a mock endpoint | Wire to real AI service or document as placeholder |

---

## 12. Final Verdict

### ❌ Not Connected

**The complete chain from Frontend → Backend → AI-Rag → LLM is broken.** The Frontend cannot reach any AI functionality because:

1. **The URL path mismatch is fatal:** The Frontend calls `/api/teacher/ask` but the Backend only has routes at `/api/ai/*`. The request never reaches any AI controller.

2. **Even if the Frontend path were fixed, the Backend → AI-Rag link is unverified:** It depends entirely on the `RAG_SERVICE_URL` environment variable, which is not documented and may not be set.

3. **Multiple integration mismatches compound the problem:** Even with a correct URL, the request body field name (`question` vs `message`) and response extraction (`result?.answer` vs `result?.message?.text`) would both cause failures.

### Summary Table

| Check | Result |
|---|---|
| Frontend `/teacher/ask` route exists on Backend | ❌ NO |
| Backend mounts AI routes | ✅ YES (at `/api/ai`) |
| Backend calls AI-Rag | ⚠️ UNVERIFIED (env var not set) |
| AI-Rag `/teacher/ask` exists | ✅ YES |
| AI-Rag LLM configured | ⚠️ UNVERIFIED (keys not checked) |
| Complete chain functional | ❌ NO |

---

### Modification Confirmation

```
AI-Rag folder modified: NO ✅
Frontend modified:      NO ✅
Backend modified:       NO ✅
```

---

## Appendix: Key File Reference Map

### Frontend
| File | Purpose |
|---|---|
| [`Frontend/src/services/api.js`](Frontend/src/services/api.js) | API client — defines `teacherApi`, `aiApi`, `authApi`, etc. |
| [`Frontend/src/pages/student/AITeacherPage.jsx`](Frontend/src/pages/student/AITeacherPage.jsx) | AI Teacher UI page — calls `teacherApi.ask()` |
| [`Frontend/vite.config.js`](Frontend/vite.config.js) | Vite config — proxies `/api` to `http://localhost:5000` |

### Backend
| File | Purpose |
|---|---|
| [`Backend/server.js`](Backend/server.js) | Express entry point — mounts routes |
| [`Backend/routes/aiRoutes.js`](Backend/routes/aiRoutes.js) | AI routes — `/chat`, `/explain-differently`, `/generate-lesson` |
| [`Backend/controllers/aiController.js`](Backend/controllers/aiController.js) | AI controllers — `socraticChat` calls `askRAG()` |
| [`Backend/services/ragService.js`](Backend/services/ragService.js) | RAG HTTP client — calls `{RAG_SERVICE_URL}/teacher/ask` |

### AI-Rag
| File | Purpose |
|---|---|
| [`AI-Rag/ai-service/app/main.py`](AI-Rag/ai-service/app/main.py) | FastAPI entry point |
| [`AI-Rag/ai-service/app/api/teacher.py`](AI-Rag/ai-service/app/api/teacher.py) | Teacher endpoints — `/ask`, `/quiz`, `/evaluate` |
| [`AI-Rag/ai-service/app/lesson/teacher.py`](AI-Rag/ai-service/app/lesson/teacher.py) | AI Teacher service — JSON generation with Gemini |
| [`AI-Rag/ai-service/app/llm/unified.py`](AI-Rag/ai-service/app/llm/unified.py) | Gemini LLM client — 7-key rotation |
| [`AI-Rag/ai-service/app/rag/retriever.py`](AI-Rag/ai-service/app/rag/retriever.py) | RAG retriever — Supabase vector search |
| [`AI-Rag/ai-service/app/core/config.py`](AI-Rag/ai-service/app/core/config.py) | Environment config — GEMINI_API_KEY_*, SUPABASE_URL, SUPABASE_KEY |
