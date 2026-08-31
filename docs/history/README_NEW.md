# 🇯🇵 Japanese AI Tutor - Complete Refactored Edition

[![Language: Japanese](https://img.shields.io/badge/Language-Japanese-red)](https://github.com/Al3xandru-Dobre/AI-Tutor)
[![AI Powered](https://img.shields.io/badge/AI-Ollama-blue)](https://ollama.ai/)
[![RAG Enhanced](https://img.shields.io/badge/RAG-ChromaDB-green)](https://www.trychroma.com/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Privacy First](https://img.shields.io/badge/Privacy-First-purple)](#)
[![Document Gen](https://img.shields.io/badge/Documents-AI%20Generated-orange)](#)
[![Refactored](https://img.shields.io/badge/Code-Refactored-success)](https://github.com/Al3xandru-Dobre/AI-Tutor)

> **Version 3.2.0** - Complete Backend Refactoring Edition  
> An intelligent Japanese language learning assistant with advanced RAG, privacy-aware history, internet augmentation, AI-powered document generation, and **completely refactored MVC architecture**.

---

## 🎯 What Makes This Special?

This Japanese AI Tutor combines **five powerful AI features** with **clean, maintainable architecture**:

1. **📚 Knowledge Base** - ChromaDB vector search through local Japanese learning materials
2. **🌐 Internet Search** - Real-time web search for current information and examples
3. **🧠 History Context** - References your past conversations for personalized learning
4. **✨ Personalized Learning** - Adapts to your patterns with privacy-first encryption
5. **📄 Document Generation** - Export conversations and create custom study materials with AI

### 🆕 What's New in v3.2.0?

#### 🏗️ **Complete Backend Refactoring**
- **MVC Architecture**: Separated concerns with Controllers, Routes, and Middleware
- **Centralized Initialization**: All services initialized in one place (`middlewear/initialise.js`)
- **Cleaner Codebase**: Reduced `server.js` from ~1000 lines to ~700 lines
- **Better Error Handling**: Graceful service initialization with proper error recovery
- **Route Protection**: Middleware ensures services are ready before handling requests
- **Dynamic Context Windows**: Intelligent query analysis for optimal LLM token allocation

#### 🧠 **Intelligent Context Management**
- **5 Context Presets**: From 4K (simple queries) to 16K (detailed explanations)
- **Automatic Complexity Detection**: Analyzes queries for keywords, length, and complexity
- **Optimized Performance**: Right-sized context windows reduce response time and improve quality

#### 🔧 **Developer Experience**
- **Easy Extension**: Clear patterns for adding new features
- **Better Testing**: Mockable services and isolated controllers
- **No More Race Conditions**: Proper async initialization flow
- **Comprehensive Documentation**: Every major change documented

---

## 📖 Quick Navigation

### For Users
- **[User Guide](USER_GUIDE.md)** - Complete guide for end users ⭐ **Start here!**
- **[Visual Feature Guide](VISUAL_FEATURE_GUIDE.md)** - Visual overview of all features
- **[Privacy & History](HISTORY_CUSTOMIZATION_VERIFICATION.md)** - How your data is protected

### For Developers
- **[System Architecture](SYSTEM_ARCHITECTURE_CLARIFICATION.md)** - Understanding the two RAG systems 🏗️
- **[Refactoring Documentation](REFACTORING_COMPLETE.md)** - Backend refactoring details
- **[Document Generation Refactor](DOCUMENT_GENERATION_REFACTOR.md)** - Document controller architecture
- **[Enhanced RAG Integration](ENHANCED_RAG_INTEGRATION.md)** - Technical implementation
- **[Quick Reference](ENHANCED_RAG_QUICK_REFERENCE.md)** - Developer quick reference
- **[Changelog](CHANGELOG.md)** - Version history

### Deployment
- **[Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Production deployment instructions

---

## ✨ Features

### 🧠 AI-Powered Learning
- **Multi-level Support**: Beginner (N5) to Advanced (N1-N2) JLPT levels
- **Dynamic Context Windows**: Automatically adjusts token allocation based on query complexity
- **Contextual Responses**: Adaptive explanations based on user proficiency
- **Cultural Context**: Includes cultural insights alongside language learning
- **Proper Japanese Text**: Full Unicode support for hiragana, katakana, and kanji

### 📚 ChromaDB-Enhanced RAG System
- **Vector Semantic Search**: Advanced AI-powered semantic search using ChromaDB
- **Local Knowledge Base**: Curated Japanese grammar books and resources (384-dim embeddings)
- **Automatic Chunking**: Intelligent document splitting for optimal retrieval
- **Legacy Fallback**: Keyword search backup when ChromaDB unavailable
- **Real-time Indexing**: New documents automatically processed and embedded

### 🔒 Privacy-Aware Conversation History
- **Encrypted Storage**: Military-grade bcrypt encryption (12 rounds)
- **Perfect Anonymization**: Cryptographic hashing prevents de-anonymization
- **Opt-in/Opt-out**: Complete user control over personalization
- **Local Only**: All data stays on your device, never sent externally
- **Real-time Indexing**: Conversations instantly available for context

### 🌐 Internet Augmentation
- **Google Custom Search**: Integration with Japanese learning websites
- **Trusted Sources**: Jisho.org, Tae Kim's Guide, IMABI, Tofugu, and more
- **Fallback Support**: Works offline with local resources
- **Smart Filtering**: JLPT-aware content filtering and relevance boosting

### 📄 Document Generation System
- **Export Conversations**: Convert any conversation to PDF, DOCX, or Markdown
- **AI-Powered Study Guides**: Generate custom study materials on any topic
- **Japanese Font Support**: Beautiful rendering of Hiragana, Katakana, and Kanji
- **Multiple Formats**: PDF (professional), DOCX (editable), Markdown (plain text)
- **Smart Content Structuring**: AI organizes content into logical sections
- **Level-Appropriate Content**: Materials tailored to your learning level
- **One-Click Export**: Export button in sidebar and chat header

### 🎯 Multi-Source Orchestration
- **Intelligent Coordination**: TutorOrchestrator combines local RAG, internet, and history
- **Parallel Processing**: All sources searched simultaneously for speed
- **Smart Weighting**: Results prioritized by relevance and source reliability
- **Feature Transparency**: UI shows which features contributed (📚🌐🧠✨)

### 🏗️ Modern Architecture (NEW!)
- **MVC Pattern**: Controllers, Routes, and Middleware separation
- **Centralized Services**: Single initialization point for all services
- **RESTful API**: Clean, documented API endpoints
- **Docker Deployment**: Complete containerized setup
- **Health Monitoring**: Comprehensive service status tracking
- **Middleware Protection**: Ensures services ready before handling requests

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Express API    │────│   Ollama LLM    │
│   (HTML/JS)     │    │   (Node.js)      │    │   (llama3:8b)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐    ┌────────▼─────────┐
            │  RAG Service   │    │ Internet Service │
            │ (Local Books)  │    │ (Google Search)  │
            └────────────────┘    └──────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │ Tutor Orchestrator    │
                    │ (Multi-source RAG)    │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │ Document Generator    │
                    │ (PDF/DOCX/Markdown)   │
                    └───────────────────────┘
```

### Backend Architecture (Refactored)

```
┌─────────────────────────────────────────────────────────────┐
│                         server.js                            │
│  • Routes mounting only                                      │
│  • Service initialization trigger                            │
│  • ~700 lines (reduced from 1000+)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──────────────────────┐
                       │                      │
                       ▼                      ▼
        ┌──────────────────────┐   ┌──────────────────────┐
        │  middlewear/         │   │  routes/             │
        │  initialise.js       │   │  • chatRoute.js      │
        │                      │   │  • documentRoute.js  │
        │  • Singleton pattern │   │  • chromaDBRoute.js  │
        │  • getServices()     │   │  • ragRoute.js       │
        │  • Initialize once   │   │  • orchestratorRoute │
        │  • Route protection  │   └──────────┬───────────┘
        └──────────┬───────────┘              │
                   │                          │
                   │                          ▼
                   │              ┌──────────────────────┐
                   │              │  controllers/        │
                   │              │  • chatController    │
                   │              │  • documentGenCtrl   │
                   └──────────────┤  • chromaDBCtrl      │
                                  │  • ragController     │
                                  │  • orchestratorCtrl  │
                                  │  • internetCtrl      │
                                  └──────────┬───────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │  services/               │
                              │  • ollamaService         │
                              │  • ragService            │
                              │  • enhancedRAGService    │
                              │  • IntegratedRAGService  │
                              │  • InternetService       │
                              │  • HistoryRAGService     │
                              │  • OrchestratorService   │
                              │  • DocumentService       │
                              │  • ConversationService   │
                              └──────────────────────────┘
```

### Key Improvements

#### Before Refactoring
- ❌ All services instantiated in `server.js` (150+ lines)
- ❌ Controllers accessing global service instances
- ❌ Race conditions during startup
- ❌ Difficult to test and extend
- ❌ Mixed concerns (initialization + routing)

#### After Refactoring
- ✅ Centralized initialization in `middlewear/initialise.js`
- ✅ Controllers use `getServices()` pattern
- ✅ Middleware protects routes until services ready
- ✅ Clean separation of concerns
- ✅ Easy to mock services for testing
- ✅ No race conditions
- ✅ 308 lines removed from `server.js`

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Ollama** with llama3:8b model
- **Google API credentials** (optional, for enhanced internet search)

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/Al3xandru-Dobre/AI-Tutor.git
cd AI-Tutor

# Run the automated deployment script
chmod +x deploy.sh
./deploy.sh

# Or manually with Docker Compose
docker-compose up -d
```

Your application will be available at:
- **Frontend**: http://localhost:3000
- **API Test**: http://localhost:3000/api/test
- **Health Check**: http://localhost:3000/api/health

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start Ollama (in another terminal)
ollama serve
ollama pull llama3:8b

# Start ChromaDB (optional, for semantic search)
cd backend/chromaDB
docker-compose up -d
cd ../..

# Start the application
npm start
# Or for development with auto-reload
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
# Note: Any multilingual Open Weight Model will work

# Google Custom Search API (Optional)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# ChromaDB Configuration
USE_CHROMADB=true
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=japanese_tutor_knowledge
EMBEDDING_MODEL=all-MiniLM-L6-v2
MAX_CHUNK_SIZE=800
CHUNK_OVERLAP=100

# Dynamic Context Windows
ENABLE_DYNAMIC_CONTEXT=true
MIN_CONTEXT_SIZE=4000
MAX_CONTEXT_SIZE=16000

# Server Configuration
PORT=3000
NODE_ENV=development

# Privacy Settings
ENABLE_HISTORY_RAG=true
ENABLE_ENCRYPTION=true
```

### Google API Setup (Optional)

For enhanced internet search capabilities:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Custom Search API**
4. Create credentials (API Key)
5. Set up a **Custom Search Engine** at [Google CSE](https://cse.google.com/)
6. Add these domains to your search engine:
   - jisho.org
   - guidetojapanese.org
   - imabi.net
   - tofugu.com
   - japanesetest4you.com

---

## 📡 API Endpoints

### Chat & Learning
```
POST   /api/chat                    - Main chat with orchestrated RAG
POST   /api/orchestrator/search     - Advanced multi-source search
GET    /api/orchestrator/stats      - Orchestrator statistics
```

### Document Generation
```
POST   /api/documents/generate/pdf        - Generate PDF from conversation
POST   /api/documents/generate/docx       - Generate DOCX from conversation
POST   /api/documents/generate/markdown   - Generate Markdown from conversation
POST   /api/documents/generate-with-llm   - AI-generated custom study materials
GET    /api/documents/list                - List all generated documents
GET    /api/documents/stats               - Document generation statistics
DELETE /api/documents/:filename           - Delete a generated document
```

### RAG Operations
```
GET    /api/rag/stats                - Local RAG statistics
POST   /api/rag/search               - Search local content
POST   /api/rag/add                  - Add documents to local RAG
GET    /api/chromadb/health          - ChromaDB health check
POST   /api/chromadb/semantic-search - Semantic vector search
GET    /api/chromadb/stats           - ChromaDB collection statistics
POST   /api/chromadb/migrate         - Migrate to ChromaDB
```

### Advanced RAG
```
POST   /api/advancedRAG/advanced-search    - Hybrid search with re-ranking
POST   /api/advancedRAG/expand-query       - Query expansion with synonyms
GET    /api/advancedRAG/hybrid-stats       - Hybrid search statistics
POST   /api/advancedRAG/generate-embedding - Generate embeddings for text
```

### Internet Search
```
GET    /api/internet/status    - Internet service status
POST   /api/internet/search    - Direct internet search
```

### History & Personalization
```
GET    /api/history-rag/stats      - History RAG statistics
POST   /api/history-rag/search     - Search conversation history
GET    /api/user/profile           - User learning profile
POST   /api/history-rag/rebuild    - Rebuild history index
POST   /api/history-rag/toggle     - Enable/disable history feature
GET    /api/history-rag/settings   - Get privacy settings
```

### Conversation Management
```
GET    /api/conversations          - List all conversations
GET    /api/conversations/:id      - Get specific conversation
DELETE /api/conversations/:id      - Delete conversation
```

### System
```
GET    /api/health    - Complete system status
GET    /api/test      - API functionality test
```

---

## 🧪 Example Usage

### Basic Chat Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the difference between は and が?",
    "level": "beginner",
    "conversationId": "optional-conversation-id"
  }'
```

**Response:**
```json
{
  "response": "は (wa) and が (ga) are both particles...",
  "conversationId": "abc123...",
  "metadata": {
    "taskType": "standard_teaching",
    "complexityScore": 45,
    "contextUsed": 8000,
    "sourcesUsed": ["local_rag", "internet"],
    "responseTime": "1.2s"
  }
}
```

### Generate AI-Powered Study Guide
```bash
curl -X POST http://localhost:3000/api/documents/generate-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a comprehensive study guide about Japanese particles with example sentences",
    "level": "intermediate",
    "format": "pdf"
  }' \
  --output particles_guide.pdf
```

### Export Conversation to PDF
```bash
curl -X POST http://localhost:3000/api/documents/generate/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "your-conversation-id",
    "type": "conversation"
  }' \
  --output conversation.pdf
```

### Advanced Semantic Search
```bash
curl -X POST http://localhost:3000/api/chromadb/semantic-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I use keigo with my boss?",
    "level": "advanced",
    "options": {
      "maxResults": 5,
      "minRelevance": 0.7
    }
  }'
```

---

## 📚 Learning Levels

| Level | JLPT | Focus |
|-------|------|-------|
| **🌱 Beginner** | N5 | Basic vocabulary, hiragana/katakana, simple grammar |
| **📚 Elementary** | N4 | Basic kanji, past tense, particles |
| **⚡ Intermediate** | N3 | Complex grammar, honorifics, advanced particles |
| **🎯 Advanced** | N2-N1 | Nuanced expressions, formal language, literature |

---

## 📄 Document Generation Features

### Export Conversations
1. Open any conversation in the sidebar
2. Click the **Export** button (📥)
3. Choose your format: PDF, DOCX, or Markdown
4. Download instantly!

### AI-Powered Document Creation
1. Click **🤖 AI Document Generator** in the sidebar
2. Describe what you want to learn
3. Select your learning level
4. Choose output format
5. AI generates and downloads a comprehensive study guide!

**Example Prompts:**
- "Create a study guide for Japanese verb conjugations with examples"
- "Make a reference sheet for JLPT N3 grammar points with practice sentences"
- "Generate a guide about keigo (honorific language) with business situations"
- "Create practice materials for katakana with common loanwords"

### Supported Formats

| Format | Best For | Features |
|--------|----------|----------|
| **PDF** | Printing, sharing, professional use | Japanese fonts, page numbers, proper formatting |
| **DOCX** | Editing in Microsoft Word | Full Japanese support, easy customization |
| **Markdown** | Plain text, version control | Simple format, lightweight, portable |

---

## 🛠️ Development

### Project Structure (Refactored)
```
AI-Tutor/
├── backend/
│   ├── server.js                          # Express server (simplified)
│   │
│   ├── middlewear/
│   │   └── initialise.js                  # 🆕 Centralized service initialization
│   │
│   ├── routes/                            # 🆕 Route definitions
│   │   ├── chatRoute.js
│   │   ├── documentRoute.js
│   │   ├── chromaDBRoute.js
│   │   ├── ragRoute.js
│   │   ├── internetAugumentationRoute.js
│   │   └── orchestrationRoute.js
│   │
│   ├── controllers/                       # 🆕 Business logic
│   │   ├── chatController.js
│   │   ├── documentGenerationCotnroller.js
│   │   ├── chromaDBController.js
│   │   ├── ragController.js
│   │   ├── internetAugumentationController.js
│   │   ├── orchestrationController.js
│   │   ├── conversationController.js
│   │   └── healthController.js
│   │
│   ├── services/                          # Service layer
│   │   ├── ollamaService.js               # 🆕 Dynamic context windows
│   │   ├── ragService.js
│   │   ├── enhancedRAGService.js
│   │   ├── IntegratedRAGService.js
│   │   ├── InternetAugumentationService.js
│   │   ├── Privacy-Aware HistoryRAGService.js
│   │   ├── TutoreOrchestratorService.js
│   │   ├── DocumentGenerationService.js
│   │   └── conversationService.js
│   │
│   ├── fonts/
│   │   └── NotoSansJP-Regular.otf         # Japanese font for PDFs
│   │
│   ├── data/
│   │   └── grammar/                       # Local Japanese resources
│   │
│   └── chromaDB/
│       └── docker-compose.yml             # ChromaDB setup
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── app-state.js
│       ├── messaging.js
│       ├── conversation-history.js
│       ├── document-generation.js
│       └── settings.js
│
├── generated_documents/                   # Output directory
│
├── docker-compose.yml
├── Dockerfile
├── deploy.sh
├── package.json
└── README.md
```

### Key Architecture Changes

#### Centralized Initialization (`middlewear/initialise.js`)
```javascript
// Singleton pattern - services initialized once
let servicesInitialized = false;
const services = {};

async function initializeAllServices() {
    if (servicesInitialized) return;
    
    // Initialize all services sequentially
    // Proper error handling
    // Clear logging
    
    servicesInitialized = true;
}

function getServices() {
    if (!servicesInitialized) {
        throw new Error('Services not initialized');
    }
    return services;
}

// Express middleware
function ensureServicesInitialized(req, res, next) {
    if (!servicesInitialized) {
        return res.status(503).json({
            error: 'Services not yet initialized',
            retry_after: 3
        });
    }
    next();
}
```

#### Controller Pattern
```javascript
// controllers/chatController.js
const { getServices } = require('../middlewear/initialise');

async function handleChat(req, res) {
    // Get services at request time (not module load time)
    const { ollama, orchestrator, history } = getServices();
    
    // Business logic here
}

module.exports = { handleChat };
```

#### Route Pattern
```javascript
// routes/chatRoute.js
const router = express.Router();
const { handleChat } = require('../controllers/chatController');
const { ensureServicesInitialized } = require('../middlewear/initialise');

// Middleware ensures services ready
router.post('/', ensureServicesInitialized, handleChat);

module.exports = router;
```

### Dynamic Context Windows

The system now intelligently adjusts context window size based on query complexity:

```javascript
// 5 Context Presets
const contextPresets = {
    simple_query: { num_ctx: 4000, num_predict: 1000 },    // "What is は?"
    quick_answer: { num_ctx: 6000, num_predict: 2000 },    // "Translate this"
    standard_teaching: { num_ctx: 8000, num_predict: 3000 }, // "Explain particles"
    exercise_generation: { num_ctx: 12000, num_predict: 4000 }, // "Give me examples"
    detailed_explanation: { num_ctx: 16000, num_predict: 6000 } // "Explain in detail"
};

// Automatic analysis
function analyzeQueryComplexity(userInput, context) {
    let score = 0;
    
    // Check for complexity indicators
    if (userInput.includes('detail') || userInput.includes('explain')) score += 15;
    if (userInput.includes('example') || userInput.includes('practice')) score += 10;
    if (userInput.length > 100) score += 10;
    // ... more heuristics
    
    // Select appropriate preset
    if (score < 20) return 'simple_query';
    if (score < 35) return 'quick_answer';
    if (score < 50) return 'standard_teaching';
    if (score < 70) return 'exercise_generation';
    return 'detailed_explanation';
}
```

### Adding New Endpoints

Follow this pattern for new features:

1. **Create Controller** (`controllers/newController.js`):
```javascript
const { getServices } = require('../middlewear/initialise');

async function newFeature(req, res) {
    const { requiredService } = getServices();
    // Your logic here
}

module.exports = { newFeature };
```

2. **Create Route** (`routes/newRoute.js`):
```javascript
const router = express.Router();
const { newFeature } = require('../controllers/newController');
const { ensureServicesInitialized } = require('../middlewear/initialise');

router.post('/endpoint', ensureServicesInitialized, newFeature);

module.exports = router;
```

3. **Mount in server.js**:
```javascript
const newRoute = require('./routes/newRoute');
app.use('/api/new', newRoute);
```

### Testing

```bash
# Test all endpoints
npm test

# Test specific endpoint
curl http://localhost:3000/api/health

# Test chat with dynamic context
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain in detail the difference between は and が with many examples",
    "level": "intermediate"
  }'

# Check logs for context allocation
# Should show: "Using detailed_explanation context: 16K tokens"
```

---

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f japanese-tutor

# Stop services
docker-compose down

# Update and rebuild
git pull
docker-compose build --no-cache
docker-compose up -d
```

### GPU Support

For NVIDIA GPU acceleration:

```bash
# Default docker-compose.yml includes GPU support
docker-compose up -d

# For CPU-only
docker-compose -f docker-compose.cpu.yml up -d
```

### Health Checks

```bash
# Check all services
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "ollama": "connected",
    "rag": "ready",
    "chromadb": "enabled",
    "internet": "configured",
    "history": "ready",
    "documents": "ready"
  },
  "uptime": "2h 15m"
}
```

---

## 🔧 Troubleshooting

### Server Won't Start

**Issue**: Services not initialized error
```bash
# Check initialization logs
tail -f backend/logs/initialization.log

# Ensure all dependencies are installed
npm install

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

**Issue**: Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process or change PORT in .env
```

### Ollama Connection Failed

```bash
# Start Ollama service
ollama serve

# Pull required model
ollama pull llama3:8b

# Test connection
curl http://localhost:11434/api/tags
```

### ChromaDB Not Working

```bash
# Start ChromaDB
cd backend/chromaDB
docker-compose up -d

# Check status
docker-compose logs chromadb

# System will fallback to legacy mode if ChromaDB unavailable
```

### Japanese Characters Not Showing in PDF

```bash
# Verify font exists
ls backend/fonts/NotoSansJP-Regular.otf

# Download if missing
cd backend/fonts
curl -L -O https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP-Regular.ttf
```

### Dynamic Context Not Working

```bash
# Check environment variable
grep ENABLE_DYNAMIC_CONTEXT .env

# Should be: ENABLE_DYNAMIC_CONTEXT=true

# Check logs for context allocation
# You should see: "🎯 Query analysis: taskType=standard_teaching, score=45"
```

### Performance Issues

**Slow Responses:**
- Ensure Ollama has enough RAM (8GB+ recommended)
- Use GPU acceleration if available
- Check context window size (larger = slower)

**High Memory Usage:**
- Reduce MAX_CONTEXT_SIZE in .env
- Disable ChromaDB if not needed
- Limit conversation history size

---

## 📈 Roadmap

### ✅ Completed (v3.2.0)
- [x] Complete backend refactoring (MVC architecture)
- [x] Centralized service initialization
- [x] Dynamic context windows
- [x] Document generation system
- [x] AI-powered study material creation
- [x] Japanese font support in PDFs
- [x] Export conversation feature
- [x] ChromaDB integration
- [x] Privacy-aware history
- [x] Internet augmentation

### 🚀 In Progress
- [ ] Document preview before download
- [ ] Batch document generation
- [ ] Custom templates for study guides
- [ ] Frontend service status indicator

### 📋 Planned Features
- [ ] Advanced conversation practice mode
- [ ] Kanji stroke order learning
- [ ] Voice input/output integration
- [ ] Mobile app development
- [ ] Personalized learning paths
- [ ] Progress tracking and analytics
- [ ] Multi-language interface
- [ ] Integration with hand drawing for kanji practice
- [ ] Notebook system for saving notes
- [ ] Multiple model tier selection
- [ ] Cloud deployment for mobile support
- [ ] Flashcard generation from conversations
- [ ] Spaced repetition system

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the MVC pattern established in the codebase
4. Add tests if applicable
5. Update documentation
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Follow existing patterns (Controller → Route → Service)
- Use `getServices()` for accessing services
- Add `ensureServicesInitialized` middleware to routes
- Document complex logic with comments
- Update API documentation for new endpoints

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ollama Team** - Excellent local LLM platform
- **ChromaDB** - Powerful vector database
- **Tae Kim** - Comprehensive Japanese grammar guide
- **Google Noto Fonts** - Beautiful CJK font support
- **Japanese Learning Community** - Amazing online resources
- **Docker & Node.js Communities** - Robust development tools
- **PDFKit, DOCX, Markdown-it** - Document generation libraries

---

## 📊 Statistics

- **Lines of Code**: ~15,000+
- **Controllers**: 8
- **Services**: 9
- **Routes**: 7
- **API Endpoints**: 40+
- **Supported Languages**: Japanese, English
- **Document Formats**: PDF, DOCX, Markdown
- **Context Presets**: 5 (4K - 16K tokens)
- **Docker Containers**: 3 (App, ChromaDB, Ollama)

---

## 🔗 Links

- **Repository**: [https://github.com/Al3xandru-Dobre/AI-Tutor](https://github.com/Al3xandru-Dobre/AI-Tutor)
- **Issues**: [Report a bug](https://github.com/Al3xandru-Dobre/AI-Tutor/issues)
- **Discussions**: [Join the conversation](https://github.com/Al3xandru-Dobre/AI-Tutor/discussions)
- **Ollama**: [https://ollama.ai/](https://ollama.ai/)
- **ChromaDB**: [https://www.trychroma.com/](https://www.trychroma.com/)

---

<div align="center">

**Made with ❤️ for Japanese language learners worldwide 🇯🇵**

**Version 3.2.0** - Complete Backend Refactoring Edition

[⬆ Back to Top](#-japanese-ai-tutor---complete-refactored-edition)

</div>
