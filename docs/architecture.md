*System architecture of the Japanese AI Tutor: a Node.js/Express monolith coordinating RAG retrieval, multi-provider LLMs, and per-user encrypted storage.*

# Architecture

## Big Picture

The application is a **monolith**: one Node.js + Express server (`backend/server.js`, port 3000) serves both the REST API and the vanilla HTML/CSS/JS frontend (statically via `express.static('../frontend')`). There is no separate SPA build step.

```
Browser (vanilla JS frontend)
   │  REST + cookies (httpOnly JWT + CSRF)
   ▼
Express server :3000  (backend/server.js)
   │  routes → controllers → services
   ├──► ChromaDB :8000 .......... knowledge-base vectors (Enhanced/Advanced RAG)
   ├──► Ollama :11434 ........... local LLM (llama3:8b by default)
   ├──► Redis :6379 ............. sessions, JWT tokens, rate limits
   ├──► Cloud LLM APIs .......... Cerebras / Groq / Mistral / OpenRouter (optional)
   └──► SMTP (Scaleway) ......... verification / password-reset email (optional)
```

A request flow through chat: the **Tutor Orchestrator Service** collects context from the retrieval systems below, combines and ranks it, then asks the configured LLM provider to generate the answer. Response metadata drives the feature badges (📚 🌐 🧠 ✨) shown in the UI.

## The Retrieval Systems

There are **three distinct retrieval layers**, often confused with each other:

| System | What it searches | Control | Badge |
|--------|------------------|---------|-------|
| **Enhanced RAG** | Local learning materials (grammar books, PDFs in `backend/data/grammar/`) via ChromaDB semantic search | Always on while ChromaDB runs; falls back to keyword search | 📚 |
| **Advanced RAG** | Same corpus, but adds hybrid search (semantic + keyword), query expansion (Kuromoji, up to 5 variants), and Japanese-optimized reranking | Toggleable per request (`useAdvancedRAG`) via the 🔬 button | 🔬 |
| **History RAG** | The user's own past conversations — topics, vocabulary, weak points — for personalization | Off by default; opt-in in Settings; data hashed (HMAC SHA-256) + encrypted (bcrypt) | 🧠 ✨ |

Enhanced and History RAG are independent services wired into the orchestrator; Advanced RAG is an alternate retrieval path for the knowledge base. Toggling personalization in settings only affects History RAG, never the knowledge base.

Internet augmentation is a fourth, orthogonal source: Google Custom Search restricted to trusted Japanese learning sites, toggled per chat.

## Backend Layout

```
backend/
├── server.js               # Entry point: Express app, static frontend, service init
├── routes/                 # Endpoint definitions (authRoute, chatRoute, notebookRoute, …)
├── controllers/            # HTTP handlers, validation, response formatting
├── services/               # Business logic (see below)
├── middlewear/             # Middleware (sic — directory name is misspelled in repo): init, auth, rate limiting
├── models/UserRedis.js     # Redis-backed user model
├── utils/                  # encryption.js, hashing.js (bcrypt + HMAC SHA-256)
├── config/modelProviders.js# Central LLM provider configuration
├── data/                   # JSON stores: conversations, notebooks, vocabulary, grammar (+ training/)
├── chromaDB/               # ChromaDB docker-compose + maintenance CLI
└── fonts/                  # Japanese fonts for PDF generation
```

Key services: `ModelProviderService` (LLM access), `TutorOrchestratorService` (source coordination), `EnhancedRAGService` / `IntegratedRAGService` (Advanced RAG: `HybridSearchService`, `QueryExpansionService`, `FineTunedEmbeddingService`), `PrivacyAwareHistoryRAGService`, `VocabService` + `NotebookService` (SM-2 review), conversation/document-generation services, `AuthService`, `EmailService` (nodemailer/Scaleway), Redis wrapper.

Japanese NLP stack: kuromoji tokenizer, transformers.js embeddings, fine-tuned Japanese embeddings (cl-tohoku/bert-base-japanese-v3 based; training pipeline in `chromaDB-development_and_AI_stuff/`).

## API Surface (summary)

| Group | Endpoints | Purpose |
|-------|-----------|---------|
| `/api/auth` | register, login, verify, forgot/reset, csrf-token, refresh, logout, profile | Account lifecycle |
| `/api/users/me` | profile, settings, stats | Per-user account data |
| `/api/chat` | chat | Main tutoring endpoint (RAG + internet + history flags) |
| `/api/conversations` | CRUD, export, training sync/stats | Conversation history |
| `/api/documents` | generate/{pdf,docx,markdown}, generate-with-llm | Document generation |
| `/api/chromadb` | semantic-search, migrate, stats | Knowledge-base access |
| `/api/rag` | stats, search, advanced-search, expand-query, hybrid-stats, history-rag/* | Retrieval systems |
| `/api/models` | providers, switch, list, stats | LLM provider management |
| `/api/notebooks` | vocabulary CRUD + review/due/leeches (SM-2), notebooks, exercises, guides, analytics, export | Learning notebook |
| `/api/search`, `/api/status` | internet augmentation | Web search + service status |

## Data Storage

- **`backend/data/` JSON files** — conversations, notebooks, vocabulary, grammar documents; per-user files encrypted with bcrypt-derived keys (see `utils/encryption.js`). Generated documents land in `generated_documents/`.
- **Redis** — user accounts (`UserRedis`), access/refresh/CSRF tokens with TTL, verification/reset tokens, rate-limit counters. Persisted via RDB/AOF when configured (see [Redis guide](guides/redis.md)).
- **ChromaDB** — vector collection `japanese_tutor_knowledge` (persistent volume `chroma_data`).

## Deployment Topology

`Dockerfile` (node:18-alpine) + Compose run four containers: `japanese-tutor` (serves frontend + API), `chromadb` (:8000), `ollama` (:11434), and a one-shot `model-init` that pulls `llama3:8b`. `deploy.sh` picks the GPU (`docker-compose.yml`) or CPU (`docker-compose.cpu.yml`) variant automatically. **Redis is not containerized** — run it on the host. Details: [Docker deployment](guides/deployment-docker.md).

## Further Reading

Deep-dives, fix logs, phase reports, and historical design notes live unchanged in [docs/history/](history/). Living docs are indexed in the [README](../README.md); release history is in [CHANGELOG](../CHANGELOG.md).
