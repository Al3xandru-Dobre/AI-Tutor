# 🇯🇵 Japanese AI Tutor - Complete Edition v3.3.0

[![Version](https://img.shields.io/badge/Version-3.3.0-blue)](https://github.com/Al3xandru-Dobre/AI-Tutor)
[![Language](https://img.shields.io/badge/Language-Japanese-red)](https://github.com/Al3xandru-Dobre/AI-Tutor)
[![AI](https://img.shields.io/badge/AI-Multi--Provider-blue)](https://github.com/Al3xandru-Dobre/AI-Tutor)
[![RAG Enhanced](https://img.shields.io/badge/RAG-ChromaDB-green)](https://www.trychroma.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Privacy First](https://img.shields.io/badge/Privacy-First-purple)](https://github.com/Al3xandru-Dobre/AI-Tutor)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **The Most Advanced Open-Source Japanese Language Learning Assistant**  
> Combining multi-provider AI, advanced RAG with ChromaDB, privacy-first personalization, internet augmentation, AI-powered document generation, notebook features, and clean MVC architecture.

**Built from scratch with language learning in mind** - featuring educational data from licensed materials, advanced RAG for context understanding, and real-time internet access. Production-ready for learners at all JLPT levels.

---

## 🌟 What Makes This Special?

### 🎯 **Comprehensive Learning Ecosystem**

This isn't just a chatbot - it's a complete Japanese learning platform combining:

**Core Intelligence:**
- 📚 **ChromaDB Vector Search** - Semantic search through curated Japanese learning materials  
- 🌐 **Internet Augmentation** - Real-time web search for current information  
- 🧠 **Privacy-Aware History** - Learns from conversations with military-grade encryption  
- ✨ **Personalized Learning** - Adapts to your patterns and JLPT level  
- 🤖 **Multi-Provider AI** - Ollama (local), Cerebras, Groq, Mistral AI, OpenRouter

**Productivity Features:**
- 📄 **AI Document Generation** - Study guides, flashcards, summaries with LLM  
- 📓 **Smart Notebook** - Vocabulary tracking with spaced repetition (SM-2)  
- 🎨 **Light/Dark Themes** - Beautiful, responsive UI  
- 💾 **Conversation Export** - JSON, PDF, DOCX, Markdown formats  
- �� **Learning Analytics** - Track progress and identify weak points

**Enterprise Architecture:**
- ��️ **MVC Pattern** - Clean Controllers, Routes, Services separation  
- 🔄 **Centralized Init** - No race conditions, proper async flow  
- 🧠 **Advanced RAG** - Hybrid search, query expansion, reranking  
- 🤖 **Transformer Models** - Real semantic embeddings  
- 🇯🇵 **Japanese NLP** - Kuromoji tokenizer, JLPT detection

---

## 📖 Table of Contents

1. [Quick Start](#-quick-start)
2. [What's New in v3.3.0](#-whats-new-in-v330)
3. [Features](#-features-overview)
4. [Installation](#-installation)
5. [Architecture](#-architecture)
6. [Usage Guide](#-usage-guide)
7. [Configuration](#-configuration)
8. [API Documentation](#-api-endpoints)
9. [Development](#-development)
10. [Deployment](#-deployment)
11. [Troubleshooting](#-troubleshooting)
12. [Contributing](#-contributing)
13. [License](#-license)

---

## 🚀 Quick Start

### One-Command Setup (5 Minutes)

```bash
# Clone repository
git clone https://github.com/Al3xandru-Dobre/AI-Tutor-development.git
cd AI-Tutor-development

# Install dependencies
npm install

# Start ChromaDB (required for knowledge base)
cd backend/chromaDB && docker compose up -d && cd ../..

# Start server
npm start

# Open browser → http://localhost:3000
```

**DoneREADME.md* The app runs with default settings. For cloud AI providers, see [Configuration](#-configuration).

### Prerequisites
- **Node.js** 18+
- **Docker** (for ChromaDB)
- **8GB RAM** minimum
- **Ollama** (optional, for local AI) - [Download](https://ollama.ai/)

---

## 🆕 What's New in v3.3.0

### 🚀 Multi-Provider AI System (Major Feature)

**5 AI Providers Supported:**

| Provider | Type | Speed | Cost | Notable Models |
|----------|------|-------|------|----------------|
| **Ollama** | Local | Medium | Free | llama3.1, mistral, qwen2.5 |
| **Cerebras** | Cloud | Ultra-fast | Paid | llama-3.3-70b, gpt-oss-120b |
| **Groq** | Cloud | Very-fast | Paid | llama-3.3-70b-versatile, mixtral-8x7b |
| **Mistral AI** | Cloud | Fast | Paid | mistral-large, mixtral-8x22b, codestral |
| **OpenRouter** | Gateway | Variable | Variable | 50+ models (GPT-4, Claude, Gemini) |

**Key Features:**
- ✅ Dynamic model switching during conversation
- ✅ Centralized configuration in `config/modelProviders.js`
- ✅ Automatic provider detection with API keys
- ✅ Easy extension - add providers by editing one file

**Before**: Hard-coded Ollama, required multiple file edits to add providers  
**After**: Plug-and-play system with automatic initialization

### 🏗️ Complete Backend Refactor (v3.2.0 Foundation)

**MVC Architecture:**
- ✅ Controllers for business logic
- ✅ Routes for endpoint definitions
- ✅ Middleware for initialization and protection
- ✅ Services for reusable components
- ✅ Reduced `server.js` from 1000+ to ~700 lines

**Benefits:**
- No race conditions during startup
- Proper error handling with 503 responses
- Clear initialization sequence
- Easy to test and extend

### 🧠 Intelligent Context Management

**5 Context Window Presets:**
- **4K tokens** - Simple queries, quick responses
- **6K tokens** - Standard questions
- **8K tokens** - Detailed explanations (default)
- **12K tokens** - Complex topics
- **16K tokens** - In-depth discussions

**Automatic Detection:**
- Analyzes query keywords and complexity
- Adjusts context window size dynamically
- Optimizes token usage and response time

### 🔧 Critical Production Fixes

**Stability Improvements:**
- ✅ ONNX Runtime fix - force CPU execution (no crashes)
- ✅ Advanced RAG race condition eliminated
- ✅ ChromaDB embedding function integration
- ✅ Service initialization sequence restored
- ✅ Notebook type error fixes

### 📦 Additional Features

- ✅ Theme toggle (light/dark) with persistence
- ✅ Lazy loading for conversation history
- ✅ Model selector UI in frontend
- ✅ Training data opt-in for exports
- ✅ Comprehensive error handling

---

## ✨ Features Overview

### 📚 ChromaDB-Enhanced RAG System

**Semantic Vector Search:**
- 384-dimensional embeddings using DefaultEmbeddingFunction
- True semantic understanding (meaning, not just keywords)
- Automatic chunking and indexing of documents
- Real-time processing of new materials
- Graceful fallback to keyword search

**Knowledge Base:**
- Curated Japanese grammar books
- JLPT-organized vocabulary
- Cultural context examples
- Example sentences and usage patterns

### 🧠 Advanced RAG Features

**Phase 1 & 2 Complete:**
- ✅ Real transformer embeddings (@xenova/transformers)
- ✅ Cross-encoder reranking (MS MARCO models)
- ✅ Query expansion with Kuromoji tokenizer
- ✅ Hybrid search (semantic + keyword)
- ✅ Japanese NLP (tokenization, JLPT detection)

**Technical Stack:**
- TransformerEmbeddingService - Semantic embeddings
- CrossEncoderService - Relevance scoring
- JapaneseTokenizerService - Morphological analysis
- QueryExpansionService - Keyword extraction
- HybridSearchService - Combined search strategy

### 🤖 Multi-Provider AI Support

**Flexible Model Selection:**
- Switch providers in real-time
- Choose specific models per provider
- Automatic fallback on failure
- Statistics tracking per provider

**Supported Providers:**
1. **Ollama** (Local) - Privacy-first, no API costs
2. **Cerebras** (Cloud) - Ultra-fast inference
3. **Groq** (Cloud) - Very fast, competitive pricing
4. **Mistral AI** (Cloud) - Excellent multilingual support
5. **OpenRouter** (Gateway) - Access to 50+ models

### 🔒 Privacy-Aware Features

**Military-Grade Security:**
- bcrypt encryption (12 rounds) for all data
- Cryptographic hashing for anonymization
- User-controlled personalization toggle
- Local storage only (no cloud sync)
- Zero external tracking

**What's Protected:**
- All conversation history
- User learning patterns
- Vocabulary progress
- Personal notes and flashcards

### 📄 AI-Powered Document Generation

**Export Formats:**
- **PDF** - Professional documents with Japanese fonts
- **DOCX** - Microsoft Word compatible
- **Markdown** - Plain text for editing
- **JSON** - Raw data for analysis

**Generation Types:**
- Study guides with summaries
- Flashcards for vocabulary
- Grammar explanations
- Conversation transcripts
- Custom topic documents (LLM-generated)

**Features:**
- Beautiful rendering of Japanese characters
- Level-appropriate content (JLPT N5-N1)
- Smart content structuring
- One-click export from UI
- Training data opt-in option

### 📓 Smart Notebook System

**Vocabulary Manager:**
- CRUD operations (Create, Read, Update, Delete)
- Search and filtering by JLPT level
- Word type categorization
- Example sentences
- Tag-based organization

**Spaced Repetition:**
- SM-2 algorithm implementation
- Automatic review scheduling
- Mastery level tracking (0-5 scale)
- Next review date calculation
- Difficulty adjustment

**Notebook Features:**
- Multiple entry types (notes, exercises, guides)
- Link vocabulary to entries
- Practice session tracking
- Statistics and analytics
- Import/export functionality

### 🌐 Internet Augmentation

**Real-Time Web Search:**
- Google Custom Search API integration
- Trusted Japanese learning sites
- JLPT-aware content filtering
- Toggle on/off from UI
- Works offline with local resources

**Trusted Sources:**
- Jisho.org (dictionary)
- Tae Kim's Guide (grammar)
- IMABI (advanced learners)
- Tofugu (cultural context)
- Wasabi-jpn (particles)

### 🎨 Modern UI/UX

**Beautiful Interface:**
- Light and dark themes
- Smooth transitions and animations
- Responsive design (mobile, tablet, desktop)
- Loading states and skeleton UI
- Toast notifications

**User Experience:**
- Lazy-loaded conversation history (20 per chunk)
- Real-time model switching
- Feature badges show data sources (📚🌐🧠✨)
- Settings panel with live stats
- Export dropdown in header

---

## 📥 Installation

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Linux, macOS, Windows (WSL2) | Linux/macOS |
| **Node.js** | 18.0+ | 20.0+ |
| **RAM** | 8GB | 16GB |
| **Disk** | 10GB | 20GB |
| **Docker** | 20.0+ | Latest |

### Detailed Setup

#### 1. Install Node.js

```bash
# Check version
node --version  # Should be v18.0.0+

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows: Download from https://nodejs.org/
```

#### 2. Install Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in

# macOS
brew install --cask docker

# Windows: Download Docker Desktop from https://www.docker.com/
```

#### 3. Clone Repository

```bash
git clone https://github.com/Al3xandru-Dobre/AI-Tutor-development.git
cd AI-Tutor-development
```

#### 4. Install Dependencies

```bash
npm install
```

**Installs:**
- Express (web server)
- ChromaDB (vector database)
- @xenova/transformers (embeddings)
- Kuromoji (Japanese tokenizer)
- bcrypt (encryption)
- PDFKit, DOCX (documents)
- And 30+ more packages

#### 5. Start ChromaDB

```bash
cd backend/chromaDB
docker compose up -d

# Verify
curl http://localhost:8000/api/v1/heartbeat
# Should return timestamp

cd ../..
```

#### 6. Configure Environment

```bash
cp .env.example .env
nano .env  # Or your editor
```

**Minimal Configuration (Local Only):**

```env
# Server
PORT=3000
NODE_ENV=development

# ChromaDB
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=japanese_tutor_knowledge

# Ollama (Default, Local)
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
DEFAULT_MODEL_PROVIDER=ollama

# Privacy
HISTORY_RAG_SEED=change-this-to-random-string
```

**Cloud AI Providers (Optional):**

```env
# Cerebras
CEREBRAS_API_KEY=your_cerebras_key
CEREBRAS_MODEL=llama3.1-70b

# Groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile

# Mistral AI
MISTRAL_API_KEY=your_mistral_key
MISTRAL_MODEL=mistral-large-latest

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=anthropic/claude-3-sonnet

# Google Search (for internet augmentation)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

#### 7. Install Ollama (Optional, Local AI)

```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# macOS
brew install ollama

# Pull model
ollama pull llama3.1:8b
```

#### 8. Start Server

```bash
npm start

# Or development mode with auto-reload
npm run dev
```

#### 9. Access Application

Open browser:
```
http://localhost:3000
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────┐
│         FRONTEND (Vanilla JavaScript)       │
│  Chat | Notebook | Settings | Documents     │
└───────────────┬─────────────────────────────┘
                │ REST API
┌───────────────┴─────────────────────────────┐
│          BACKEND (Node.js/Express)          │
│                                             │
│  server.js → Routes → Controllers          │
│                ↓                             │
│         Services (Business Logic)           │
│  ┌──────────────────────────────────────┐  │
│  │ Core: ModelProvider, Orchestrator    │  │
│  │ RAG: Enhanced, Integrated, History   │  │
│  │ NLP: Transformer, CrossEncoder, etc. │  │
│  │ Utils: Internet, Conv, Document, etc.│  │
│  └──────────────────────────────────────┘  │
└─────────────┬───────────────┬───────────────┘
              │               │
      ┌───────┴────┐    ┌────┴────────┐
      │  ChromaDB  │    │ External    │
      │  (Docker)  │    │ APIs        │
      │  Port 8000 │    │ (AI/Search) │
      └────────────┘    └─────────────┘
```

### MVC Pattern (v3.2.0+)

**Controllers** (`backend/controllers/`)
- Handle HTTP requests/responses
- Validate input
- Call services
- Format responses

**Routes** (`backend/routes/`)
- Define API endpoints
- Apply middleware
- Map URLs to controllers

**Services** (`backend/services/`)
- Business logic
- Database interactions
- External API calls
- Stateful, initialized once

**Middleware** (`backend/middlewear/`)
- `initialise.js` - Service management
- `ensureServicesInitialized` - Route protection

---

## 📘 Usage Guide

### Basic Conversation

1. **Ask a question** in the input box
2. **Press Enter** or click send
3. **View response** with feature badges
4. **Check sources** - 📚🌐🧠✨ icons show data sources

**Example:**
```
You: What's the difference between は and が?
AI: は (wa) marks the topic... [detailed explanation]
Features: 📚 Knowledge Base | 🧠 History | ✨ Personalized
```

### Using the Notebook

**Add Vocabulary:**
1. Click "Notebook" in sidebar
2. Click "Add Vocabulary"
3. Fill form (word, reading, meaning, JLPT level)
4. Save

**Review Vocabulary:**
- Spaced repetition algorithm schedules reviews
- Due words highlighted in notebook
- Click "Review" to practice
- Rate difficulty (1-5) for next review date

### Generating Documents

**Export Conversation:**
1. Click "Export" in header
2. Choose format (PDF/DOCX/Markdown)
3. Select conversation or current chat
4. Download

**Generate Study Guide:**
1. Click "Generate Document" in header
2. Choose "Study Guide"
3. Enter topic (e.g., "Japanese particles")
4. Select JLPT level
5. AI generates custom guide
6. Download in preferred format

### Switching AI Models

**Change Provider:**
1. Open model selector (below chat input)
2. Select provider (Ollama, Cerebras, Groq, etc.)
3. Choose specific model
4. Model switches immediately

**View Statistics:**
1. Open Settings (⚙️ icon)
2. Scroll to "Model Provider"
3. See usage stats per provider

### Privacy Settings

**Enable Personalization:**
1. Open Settings
2. Toggle "Enable History-Based Personalization"
3. Data encrypted with bcrypt
4. Disable anytime to stop learning from history

**Export Your Data:**
1. Settings → Export History
2. Choose format (JSON for backup)
3. Optionally contribute to training data
4. Download

---

## ⚙️ Configuration

### Environment Variables

**Complete `.env` Template:**

```env
# ===================================
# SERVER CONFIGURATION
# ===================================
PORT=3000
NODE_ENV=development

# ===================================
# CHROMADB (Vector Database)
# ===================================
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=japanese_tutor_knowledge
EMBEDDING_MODEL=all-MiniLM-L6-v2

# ===================================
# AI PROVIDERS
# ===================================

# Default provider (ollama, cerebras, groq, mistral, openrouter)
DEFAULT_MODEL_PROVIDER=ollama

# Ollama (Local AI)
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=llama3.1:8b

# Cerebras (Cloud - Ultra Fast)
CEREBRAS_API_KEY=your_key_here
CEREBRAS_MODEL=llama3.1-70b
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1

# Groq (Cloud - Very Fast)
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Mistral AI (Cloud - Multilingual)
MISTRAL_API_KEY=your_key_here
MISTRAL_MODEL=mistral-large-latest
MISTRAL_BASE_URL=https://api.mistral.ai/v1

# OpenRouter (Gateway to 50+ Models)
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3-sonnet
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# ===================================
# INTERNET AUGMENTATION
# ===================================
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
INTERNET_SEARCH_ENABLED=true

# ===================================
# PRIVACY & SECURITY
# ===================================
HISTORY_RAG_SEED=change-this-to-random-string-min-32-chars
ENABLE_HISTORY_RAG=false  # User-controlled at runtime
BCRYPT_ROUNDS=12

# ===================================
# ADVANCED RAG SETTINGS
# ===================================
USE_ADVANCED_RAG=true
USE_QUERY_EXPANSION=true
USE_HYBRID_SEARCH=true
USE_CROSS_ENCODER=true
```

### Provider-Specific Configuration

**Ollama Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3.1:8b
ollama pull mistral
ollama pull qwen2.5

# Verify
ollama list
```

**Cerebras Setup:**
1. Sign up at https://cerebras.ai/
2. Get API key from dashboard
3. Add to `.env`:
   ```env
   CEREBRAS_API_KEY=csk-xxxxx
   CEREBRAS_MODEL=llama3.1-70b
   ```

**Groq Setup:**
1. Sign up at https://groq.com/
2. Get API key
3. Add to `.env`:
   ```env
   GROQ_API_KEY=gsk_xxxxx
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

**Mistral AI Setup:**
1. Sign up at https://mistral.ai/
2. Get API key
3. Add to `.env`:
   ```env
   MISTRAL_API_KEY=xxxxx
   MISTRAL_MODEL=mistral-large-latest
   ```

**OpenRouter Setup:**
1. Sign up at https://openrouter.ai/
2. Get API key
3. Add credits to account
4. Add to `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-xxxxx
   OPENROUTER_MODEL=anthropic/claude-3-sonnet
   ```

**Google Custom Search Setup:**
1. Enable Custom Search API
2. Create search engine ID
3. Add to `.env`:
   ```env
   GOOGLE_API_KEY=AIzaSyxxxxx
   GOOGLE_SEARCH_ENGINE_ID=xxxxx
   ```

---

## 🔌 API Endpoints

### Chat Endpoints

**POST `/api/chat`**
```json
{
  "message": "What is the て-form?",
  "level": "beginner",
  "provider": "ollama",
  "model": "llama3.1:8b"
}
```

### Model Provider Endpoints

**GET `/api/models/providers`**  
List all available AI providers with models

**POST `/api/models/switch`**  
Switch to different provider/model
```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

**GET `/api/models/stats`**  
Get usage statistics per provider

### RAG Endpoints

**POST `/api/rag/semantic-search`**  
Advanced semantic search
```json
{
  "query": "particles in Japanese",
  "level": "intermediate",
  "maxResults": 5
}
```

**GET `/api/rag/chroma-stats`**  
ChromaDB collection statistics

**POST `/api/advancedRAG/advanced-search`**  
Hybrid search with query expansion

### Document Endpoints

**POST `/api/documents/generate/pdf`**  
Generate PDF document
```json
{
  "conversationId": "abc123",
  "title": "Japanese Particles Study Guide"
}
```

**POST `/api/documents/generate-with-llm`**  
Generate custom document with AI
```json
{
  "topic": "Japanese verb conjugations",
  "level": "intermediate",
  "type": "study_guide",
  "format": "pdf"
}
```

**GET `/api/documents/list`**  
List generated documents

**DELETE `/api/documents/:filename`**  
Delete generated document

### Conversation Endpoints

**GET `/api/conversations`**  
List conversations (with pagination)
```
/api/conversations?limit=20&offset=0
```

**GET `/api/conversations/:id`**  
Get specific conversation

**DELETE `/api/conversations/:id`**  
Delete conversation

**POST `/api/conversations/:id/export`**  
Export conversation
```json
{
  "format": "json",
  "useForTraining": false
}
```

### Notebook Endpoints

**POST `/api/notebooks/vocabulary`**  
Add vocabulary entry
```json
{
  "word": "食べる",
  "reading": "たべる",
  "meaning": "to eat",
  "jlptLevel": "N5"
}
```

**GET `/api/notebooks/vocabulary`**  
Get all vocabulary

**PUT `/api/notebooks/vocabulary/:id`**  
Update vocabulary entry

**POST `/api/notebooks/vocabulary/:id/review`**  
Record vocabulary review
```json
{
  "difficulty": 3
}
```

**GET `/api/notebooks/vocabulary/review/due`**  
Get vocabulary due for review

### Health & Stats Endpoints

**GET `/api/health`**  
System health check

**GET `/api/chromadb/health`**  
ChromaDB health status

**GET `/api/orchestrator/stats`**  
Orchestrator statistics

**GET `/api/history-rag/stats`**  
History RAG statistics

---

## 💻 Development

### Project Structure

```
AI-Tutor-development/
├── backend/
│   ├── server.js                 # Main entry point
│   ├── config/
│   │   └── modelProviders.js     # AI provider configs
│   ├── controllers/              # MVC Controllers
│   │   ├── chatController.js
│   │   ├── documentGenerationController.js
│   │   ├── ragController.js
│   │   └── ...
│   ├── routes/                   # API Routes
│   │   ├── chatRoute.js
│   │   ├── documentRoute.js
│   │   └── ...
│   ├── middlewear/               # Middleware
│   │   └── initialise.js         # Service initialization
│   ├── services/                 # Business Logic
│   │   ├── ModelProviderService.js
│   │   ├── EnhancedRAGService.js
│   │   ├── TransformerEmbeddingService.js
│   │   └── ...
│   ├── models/                   # Data models
│   ├── data/                     # Local data
│   │   ├── grammar/              # PDF books
│   │   ├── history/              # Conversations
│   │   └── training/             # Training data
│   └── chromaDB/                 # ChromaDB setup
│       ├── docker-compose.yml
│       └── README.md
├── frontend/
│   ├── index.html                # Main page
│   ├── notebook.html             # Notebook feature
│   ├── js/                       # JavaScript modules
│   │   ├── app-init.js
│   │   ├── messaging.js
│   │   ├── model-selector.js
│   │   ├── notebook-api.js
│   │   └── ...
│   ├── styles/                   # CSS files
│   │   ├── style.css
│   │   ├── light-theme.css
│   │   └── ...
│   └── components/               # UI components
├── docs/                         # Documentation
│   ├── README.md
│   ├── USER_GUIDE.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── ...
├── package.json
├── .env.example
└── docker-compose.yml
```

### Adding a New AI Provider

**Before (Old Way):**
- Edit constructor in ModelProviderService
- Add initialization logic (20+ lines)
- Add test method
- Add fetch models method
- Add generate method
- Update switch statements
- Update getAvailableProviders

**After v3.3.0 (New Way):**

1. **Edit one file**: `backend/config/modelProviders.js`

```javascript
const PROVIDER_CONFIGS = {
  myprovider: {
    name: 'My AI Provider',
    type: 'cloud',
    enabled: !!process.env.MYPROVIDER_API_KEY,
    apiKey: process.env.MYPROVIDER_API_KEY,
    baseUrl: 'https://api.myprovider.com/v1',
    models: [
      { id: 'model-1', name: 'Model 1', description: '...' },
      { id: 'model-2', name: 'Model 2', description: '...' }
    ],
    defaultModel: 'model-1',
    config: {
      temperature: 0.7,
      max_tokens: 2000
    }
  }
};
```

2. **That's it!** System handles everything automatically.

### Development Workflow

**Start Development Server:**
```bash
npm run dev  # Auto-reloads on file changes
```

**Run Tests:**
```bash
# Currently manual testing
npm test  # TODO: Add automated tests
```

**Lint Code:**
```bash
# TODO: Add ESLint configuration
```

**Build for Production:**
```bash
npm start  # Production mode
```

### Code Style Guidelines

- **JavaScript**: ES6+, async/await preferred
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for functions, inline for complex logic
- **Error Handling**: Try-catch blocks, meaningful error messages
- **Async**: Proper async/await, no callback hell

### Debugging

**Enable Debug Logging:**
```bash
export DEBUG=app:*
npm run dev
```

**Check Service Status:**
```bash
curl http://localhost:3000/api/health | jq
```

**View ChromaDB Logs:**
```bash
cd backend/chromaDB
docker compose logs -f
```

**Test Specific Endpoints:**
```bash
# Test chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "level": "beginner"}'

# Test model provider
curl http://localhost:3000/api/models/providers | jq
```

---

## 🚢 Deployment

### Docker Deployment (Recommended)

**Full Stack with Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CHROMA_DB_URL=http://chromadb:8000
    depends_on:
      - chromadb
    volumes:
      - ./backend/data:/app/backend/data
      - ./generated_documents:/app/generated_documents
    restart: unless-stopped

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - ANONYMIZED_TELEMETRY=FALSE
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    restart: unless-stopped

volumes:
  chroma-data:
  ollama-data:
```

**Deploy:**
```bash
docker compose up -d
```

### Manual Deployment

**1. Install Dependencies:**
```bash
npm install --production
```

**2. Configure Environment:**
```bash
cp .env.example .env
# Edit .env with production values
```

**3. Start Services:**
```bash
# Start ChromaDB
cd backend/chromaDB && docker compose up -d && cd ../..

# Start app with PM2
npm install -g pm2
pm2 start backend/server.js --name japanese-tutor
pm2 save
pm2 startup  # Follow instructions
```

**4. Setup Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000\;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**5. Enable SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Cloud Deployment

**Heroku:**
```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create japanese-tutor

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set OLLAMA_HOST=your-ollama-url
# ... other vars

# Deploy
git push heroku main
```

**AWS EC2:**
1. Launch Ubuntu 20.04 instance (t3.medium or larger)
2. Install Node.js, Docker, Nginx
3. Clone repository
4. Follow manual deployment steps
5. Configure security groups (ports 80, 443, 3000)

**DigitalOcean:**
1. Create Droplet (Ubuntu 20.04, 8GB RAM)
2. Follow manual deployment steps
3. Use DigitalOcean firewall
4. Optional: Use managed database for ChromaDB

---

## 🔧 Troubleshooting

### Common Issues

**ChromaDB Connection Failed:**
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution:**
```bash
# Check if ChromaDB is running
cd backend/chromaDB
docker compose ps

# If not running
docker compose up -d

# Check logs
docker compose logs chromadb

# Verify connection
curl http://localhost:8000/api/v1/heartbeat
```

**Ollama Not Responding:**
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**Solution:**
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Pull model if needed
ollama pull llama3.1:8b
```

**Services Not Initialized:**
```
503 Service Unavailable - Services not yet initialized
```

**Solution:**
- Wait 10-30 seconds after server start
- Check server logs for initialization errors
- Ensure ChromaDB is running
- Verify `.env` configuration

**ONNX Runtime Error:**
```
terminate called after throwing 'Ort::Exception'
```

**Solution:**
- Already fixed in v3.3.0
- Force CPU execution in TransformerEmbeddingService
- No GPU required

**Notebook Type Errors:**
```
TypeError: guides.forEach is not a function
```

**Solution:**
- Already fixed in v3.3.0
- Array validation added to all display functions
- Backend returns proper arrays

### Performance Issues

**Slow First Response:**
- Normal - transformer models load on first use
- Subsequent responses are faster (50-100ms)

**High Memory Usage:**
- Expected with transformer models (~2-4GB)
- Consider using smaller models
- Adjust Node.js memory: `node --max-old-space-size=4096 backend/server.js`

**ChromaDB Slow:**
- Index large collections during off-hours
- Consider upgrading hardware
- Use SSD for Docker volumes

### Logs and Debugging

**Server Logs:**
```bash
# Development
npm run dev  # Logs to console

# Production
pm2 logs japanese-tutor
```

**ChromaDB Logs:**
```bash
cd backend/chromaDB
docker compose logs -f chromadb
```

**Check Service Status:**
```bash
curl http://localhost:3000/api/health | jq
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Start

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/my-feature`
3. **Make changes** and test thoroughly
4. **Commit**: `git commit -m "feat: add my feature"`
5. **Push**: `git push origin feature/my-feature`
6. **Create Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test all features
- No breaking changes without discussion

### Areas for Contribution

- [ ] Unit and integration tests
- [ ] Additional AI providers
- [ ] UI/UX improvements
- [ ] Mobile app
- [ ] Voice input/output
- [ ] Additional language support
- [ ] Performance optimizations
- [ ] Bug fixes

---

## 📚 Documentation

**User Documentation:**
- [User Guide](USER_GUIDE.md) - Complete end-user guide
- [Visual Feature Guide](VISUAL_FEATURE_GUIDE.md) - Visual overview
- [Privacy Guide](HISTORY_CUSTOMIZATION_VERIFICATION.md) - Data protection

**Technical Documentation:**
- [System Architecture](SYSTEM_ARCHITECTURE_CLARIFICATION.md) - Architecture deep dive
- [RAG Integration](ENHANCED_RAG_INTEGRATION.md) - Technical implementation
- [Model Provider Refactor](MODEL_PROVIDER_REFACTOR_v3.3.0.md) - v3.3.0 changes
- [Backend Refactoring](REFACTORING_COMPLETE.md) - MVC implementation
- [Advanced RAG](ADVANCED_RAG_IMPLEMENTATION_SUMMARY.md) - Phase 1 & 2 details

**Feature Documentation:**
- [Notebook Feature](NOTEBOOK_FEATURE.md) - Notebook system details
- [Document Generation](DOCUMENT_GENERATION_REFACTOR.md) - Export features
- [Export Feature](EXPORT_FEATURE.md) - Conversation exports
- [Theme Toggle](THEME_TOGGLE_IMPLEMENTATION.md) - UI themes

**Deployment & Fixes:**
- [Docker Deployment](DOCKER_DEPLOYMENT.md) - Production deployment
- [ChromaDB Setup](QUICKSTART_CHROMADB.md) - ChromaDB quick start
- [Production Fixes](PRODUCTION_FIXES.md) - Critical fixes
- [App Blocking Fix](APP_BLOCKING_FIX.md) - Initialization issues

**Development:**
- [Changelog](CHANGELOG.md) - Version history
- [Changelog v3.2.0](CHANGELOG_V3.2.0.md) - v3.2.0 details
- [Roadmap](ROADMAP.md) - Future plans
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

---

## 📜 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- **Ollama**: Apache 2.0
- **ChromaDB**: Apache 2.0
- **@xenova/transformers**: Apache 2.0
- **Kuromoji**: Apache 2.0
- **Express**: MIT
- See `package.json` for complete list

---

## �� Acknowledgments

**AI Models & Providers:**
- [Ollama](https://ollama.ai/) - Local AI infrastructure
- [Cerebras](https://cerebras.ai/) - Ultra-fast inference
- [Groq](https://groq.com/) - High-speed AI
- [Mistral AI](https://mistral.ai/) - Multilingual models
- [OpenRouter](https://openrouter.ai/) - Model aggregation

**Technologies:**
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [Xenova Transformers](https://huggingface.co/docs/transformers.js) - Embeddings
- [Kuromoji](https://github.com/takuyaa/kuromoji.js) - Japanese tokenizer
- [Express](https://expressjs.com/) - Web framework
- [PDFKit](https://pdfkit.org/) - PDF generation

**Educational Resources:**
- Tae Kim's Guide to Japanese Grammar
- IMABI
- Jisho.org
- All licensed materials used for training

---

## 📞 Contact & Support

**Issues & Bugs:**
- [GitHub Issues](https://github.com/Al3xandru-Dobre/AI-Tutor-development/issues)

**Discussions:**
- [GitHub Discussions](https://github.com/Al3xandru-Dobre/AI-Tutor-development/discussions)

**Email:**
- For collaboration inquiries: [Your Email]

**Community:**
- Join our Discord (coming soon)
- Follow on Twitter (coming soon)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star on GitHub! ⭐

---

## 📊 Project Stats

- **Version**: 3.7.0
- **Total Files**: 150+
- **Lines of Code**: ~15,000+
- **Dependencies**: 40+
- **AI Providers**: 5
- **Languages**: JavaScript, Python (utilities)
- **Supported JLPT Levels**: N5-N1

---

**Built with ❤️ for Japanese language learners worldwide**

_Last Updated: November 2, 2025_
