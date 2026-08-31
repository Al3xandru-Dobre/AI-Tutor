# Changelog

All notable changes to the Japanese AI Tutor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Historical details are archived in [docs/history/](docs/history/). Intermediate version numbers were reconstructed from historical notes; the dates are taken from the archived documents.

## [3.8.0] - 2025-11-02

### Added
- Complete SM-2 spaced repetition algorithm for vocabulary review (ease factor, review intervals, next review date, lapse tracking)
- Daily review limits (new cards / reviews) and leech detection for cards with 8+ lapses
- AI vocabulary integration fields: `conversationId`, `extractedBy` (manual/ai/hybrid) and `confidence` scoring
- New API endpoints: leech cards, vocabulary by extraction source, vocabulary by conversation
- Expanded vocabulary statistics: retention rate, card maturity (new/learning/mature), average ease factor, AI source breakdown
- Review dashboard UI with due-review queue, leech management and interactive charts
- Backward compatible with existing data; no migration required

## [2.0-advanced-rag] - 2025-11-02

Internal milestone tag (not a semver release).

### Added
- Real transformer embeddings via `@xenova/transformers` (all-MiniLM-L6-v2 default, multilingual option) replacing simulated embeddings, with built-in caching
- Cross-encoder reranking (MS MARCO MiniLM) with hybrid scoring (70% cross-encoder / 30% original) and graceful fallback to heuristic reranking
- Japanese morphological tokenization with Kuromoji: word segmentation, POS tagging, readings, base forms and JLPT level analysis
- Query expansion upgraded to tokenizer-based keyword extraction for better synonym matching
- New dependency: `kuromoji`

## [3.3.0] - 2025-10-24

### Added
- Mistral AI provider (Mistral Large/Medium/Small, Mixtral models)
- OpenRouter provider: unified gateway to 50+ models (Claude, GPT-4, Gemini, ...) with a single API key

### Changed
- Model provider system refactored: provider configurations centralized in `backend/config/modelProviders.js`; adding a provider now requires editing only that file
- `ModelProviderService` refactored to use the centralized config with dynamic initialization; providers without API keys are skipped gracefully
- Backward compatible: existing providers (Ollama, Cerebras, Groq) work unchanged; no breaking changes

## [3.2.0] - 2025-10-04

### Added
- Centralized service initialization (`backend/middlewear/initialise.js`) with singleton pattern and `ensureServicesInitialized` middleware that returns 503 until services are ready
- MVC architecture: business logic extracted from `server.js` into six controllers (chat, document generation, ChromaDB, RAG, orchestration, internet augmentation) plus dedicated route files for every endpoint group
- Dynamic context window management in `ollamaService`: five context presets (4K-16K tokens) with automatic query complexity analysis
- Test coverage for the service initialization flow, middleware protection and context window selection

### Changed
- `server.js` reduced by ~308 lines (-31%); no inline route handlers or global service instances remain
- Faster startup (~200ms) and ~50MB lower memory usage (no duplicate service instances)
- Zero new dependencies; 100% backward compatible (no API, configuration or frontend changes)

### Fixed
- Top-level `await` outside async functions at module load in five controllers
- "Services not initialized" errors by accessing services inside route handlers (28 controller functions across six controllers)

### Performance
- Simple queries ~50% faster (4K vs fixed 8K context); complex queries get up to 16K context; ~30% average reduction in token usage

## [1.0.0] - 2025-08-07

### Added
- **Core Japanese AI Tutor System** — multi-level Japanese learning support (N5-N1), Ollama LLM integration with llama3:8b model, Express.js RESTful API backend, modern web interface with Japanese character support
- **Advanced RAG (Retrieval-Augmented Generation) System** — local knowledge base with Japanese grammar books, PDF parsing and content indexing, smart document retrieval and ranking, context-aware response generation
- **Internet Augmentation Service** — Google Custom Search API integration, trusted Japanese learning website filtering, fallback mode for offline operation, smart query optimization for Japanese content
- **Tutor Orchestration Service** — multi-source intelligence combining local and internet resources, intelligent source prioritization and relevance scoring, adaptive response generation based on user level, comprehensive error handling and fallback mechanisms
- **Docker Deployment System** — complete containerized setup with Docker Compose, GPU acceleration support for NVIDIA cards, CPU-only deployment option, automated model downloading and initialization, health monitoring and service management
- **Development Tools** — automated deployment script, comprehensive API documentation, environment variable management, service status monitoring

### Technical Features
- **Frontend**: Responsive web interface with Japanese Unicode support
- **Backend**: Node.js with Express, CORS, and proper error handling
- **AI Integration**: Ollama service with configurable models
- **Search**: Google Custom Search with Japanese learning site focus
- **Storage**: Local document indexing with PDF support
- **Deployment**: Docker with health checks and volume persistence

### API Endpoints
- `POST /api/chat` - Enhanced chat with multi-source RAG
- `GET /api/health` - Complete system status monitoring
- `GET /api/test` - API functionality verification
- `POST /api/rag/search` - Local content search
- `POST /api/internet/search` - Internet content search
- `POST /api/orchestrator/search` - Advanced multi-source search

### Configuration
- Environment variable support with `.env` files
- Google API integration for enhanced search
- Ollama model configuration
- Service feature flags and customization

### Documentation
- Complete README with setup instructions
- API documentation with examples
- Docker deployment guide
- Troubleshooting and optimization tips
- Development contribution guidelines

### Known Issues
- Requires manual Ollama setup for local development
- Google API credentials needed for full internet search functionality
- Large language models require significant RAM (8GB+ recommended)

### Dependencies
- Node.js 18+
- Ollama with llama3:8b model
- Docker & Docker Compose (for containerized deployment)
- Google Custom Search API (optional, for enhanced internet search)
