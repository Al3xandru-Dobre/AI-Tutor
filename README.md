# Japanese AI Tutor

A privacy-aware Japanese language learning assistant. It answers questions with retrieval-augmented generation over your own learning materials, augments answers with live web search when you want it, remembers past conversations for personalized follow-ups (opt-in, hashed and encrypted), and includes a notebook with SM-2 spaced repetition. Answers come from the LLM provider you choose — a local Ollama model by default, or a cloud provider if you add an API key.

## Features

| Area | What you get |
|------|--------------|
| Chat tutoring | JLPT-aware explanations (N5–N1), conversation history, guest mode, light/dark themes |
| Knowledge base (Enhanced RAG) | Always-on semantic search over local grammar books and PDFs via ChromaDB |
| Advanced RAG (toggle) | Hybrid semantic + keyword search, Kuromoji query expansion, Japanese-optimized reranking |
| Internet augmentation | Optional live web search limited to trusted Japanese learning sites |
| History RAG (opt-in) | Privacy-aware personalization from your past conversations (hashed + encrypted, local only) |
| Notebook | Vocabulary CRUD, SM-2 review scheduling with leech detection, exercises, study guides, analytics, export |
| Document generation | Export conversations and LLM-written study guides as PDF, DOCX, Markdown, or JSON |
| Multi-provider LLMs | Ollama (default), Cerebras, Groq, Mistral AI, OpenRouter — switchable at runtime |
| Accounts | Email verification, password reset, JWT sessions in httpOnly cookies, CSRF protection, rate limiting |

## Tech Stack

- **Backend:** Node.js 18+, Express monolith (`backend/server.js`, port 3000) — routes → controllers → services; also serves the frontend statically (no build step)
- **Frontend:** vanilla HTML/CSS/JS (`frontend/`)
- **AI/NLP:** Ollama + OpenAI-compatible cloud providers, ChromaDB, kuromoji, transformers.js, fine-tuned Japanese embeddings (BERT-based)
- **Storage:** JSON files in `backend/data/` (encrypted per user), Redis (sessions, tokens, rate limits), ChromaDB (vectors)
- **Documents:** pdfkit, docx, marked, puppeteer; Japanese fonts in `backend/fonts/`
- **Auth:** bcrypt + HMAC SHA-256, JWT access/refresh cookies, CSRF, nodemailer (Scaleway SMTP)

## Quick Start

Prerequisites: **Node.js 18+**, **Docker** (ChromaDB), **Redis** (accounts/rate limiting — see [docs/guides/redis.md](docs/guides/redis.md)), and **Ollama** for local AI (`ollama pull llama3:8b`).

```bash
git clone https://github.com/Al3xandru-Dobre/AI-Tutor-development.git
cd AI-Tutor-development

npm install                 # dependencies
./setup-dev.sh              # checks prerequisites, creates .env, verifies Ollama
./setup-chromadb.sh         # ChromaDB container + embeddings tooling (or: cd backend/chromaDB && docker compose up -d)
./setup-auth.sh             # auth-oriented checks (Redis, secrets); optional data cleanup

npm run dev                 # or: npm start
# open http://localhost:3000
```

Configure `.env` (created from `.env.example`): Ollama settings work out of the box; add `CEREBRAS_API_KEY` / `GROQ_API_KEY` / `MISTRAL_API_KEY` / `OPENROUTER_API_KEY` for cloud providers and `GOOGLE_API_KEY` + `GOOGLE_SEARCH_ENGINE_ID` for internet augmentation. All variables are documented in `.env.example` and [docs/plans/auth.md](docs/plans/auth.md) (auth-related).

**Docker alternative** — full stack (app + ChromaDB + Ollama + model download) in one step; `deploy.sh` auto-selects the GPU or CPU compose file:

```bash
./deploy.sh
```

See [docs/guides/deployment-docker.md](docs/guides/deployment-docker.md).

## Project Structure

```
AI-Tutor-development/
├── backend/
│   ├── server.js              # Express app + static frontend + service init
│   ├── routes/ controllers/ services/ middlewear/   # MVC-ish layers
│   ├── config/modelProviders.js                     # LLM provider config
│   ├── models/UserRedis.js    # Redis-backed user model
│   ├── utils/                 # hashing, encryption
│   ├── data/                  # JSON stores: conversations, notebooks, vocabulary, grammar
│   └── chromaDB/              # ChromaDB compose file + maintenance CLI
├── frontend/                  # vanilla HTML/CSS/JS (chat, notebook, auth, settings pages)
├── chromaDB-development_and_AI_stuff/   # embedding training pipeline (Python)
├── docs/                      # living documentation (index below)
├── deploy.sh docker-compose.yml docker-compose.cpu.yml Dockerfile
├── setup-dev.sh setup-auth.sh setup-chromadb.sh
└── .env.example
```

## Architecture

One Express server serves both API and frontend and coordinates four kinds of dependencies: ChromaDB (knowledge base, port 8000), Ollama/cloud LLMs (port 11434 or remote), Redis (port 6379), and SMTP. Retrieval has three layers — Enhanced RAG (always-on knowledge base), Advanced RAG (toggleable hybrid search), and History RAG (opt-in conversation memory). Full details, folder map, and API surface: **[docs/architecture.md](docs/architecture.md)**.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | System architecture, backend layout, RAG systems, API surface, data storage |
| [docs/guides/user-guide.md](docs/guides/user-guide.md) | End-user guide: chat, toggles, history, privacy, export, troubleshooting |
| [docs/guides/deployment-docker.md](docs/guides/deployment-docker.md) | Docker Compose deployment (GPU/CPU) |
| [docs/guides/redis.md](docs/guides/redis.md) | Redis installation and configuration (Docker, native, cloud) |
| [docs/guides/chromadb.md](docs/guides/chromadb.md) | ChromaDB setup and the RAG modes (Enhanced / Advanced / History) |
| [docs/guides/notebook.md](docs/guides/notebook.md) | Notebook usage: vocabulary, SM-2 reviews, exercises, analytics |
| [docs/guides/model-providers.md](docs/guides/model-providers.md) | The 5 LLM providers, env vars, and how to add a new one |
| [docs/plans/auth.md](docs/plans/auth.md) | Auth system design and implementation status |
| [docs/plans/notebook-roadmap.md](docs/plans/notebook-roadmap.md) | Notebook roadmap (Phase 1 implemented; later phases planned) |
| [docs/plans/visual-redesign.md](docs/plans/visual-redesign.md) | UI/visual redesign plan |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [ROADMAP.md](ROADMAP.md) | Project roadmap |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [LICENSE](LICENSE) | MIT license |

Historical notes (fix logs, phase reports, past release checklists) are archived in [docs/history/](docs/history/).

## Scripts

| Script | Purpose |
|--------|---------|
| `./setup-dev.sh` | Development setup: prerequisites check, `.env` creation, Ollama/model check |
| `./setup-auth.sh` | Auth setup: dependencies, `.env`, Redis check, optional data cleanup |
| `./setup-chromadb.sh` | ChromaDB stack: Node + Python deps, container start, integration test |
| `./deploy.sh` | Docker deployment; picks GPU or CPU compose file automatically |
| `./test-enhanced-rag.sh` | Smoke-test the RAG pipeline against a running server |
| `./test-export-feature.sh` | Smoke-test conversation export endpoints |
| `node test-advanced-rag.js` | Exercise the Advanced RAG endpoints |

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for workflow and guidelines. Bug reports and feature ideas go through GitHub issues.

## License

Released under the [MIT License](LICENSE).
