# 🇯🇵 Japanese AI Tutor

An intelligent Japanese language learning assistant powered by AI, featuring advanced RAG (Retrieval-Augmented Generation) with ChromaDB vector database for better understanding of the context, privacy-aware conversation history, real-time internet search integration, and **AI-powered document generation**. Unlike other LLM's, this is build from scratch with language learning in mind and is fine-tunned and trainned on adequite educational data. For now I used books and manuals with permisive licence. I will soon publish the open models used in deploying the app, but for now the app is in development and not ready for production. I suggest to stick to the user guide and choose a local LLM easy to run. Due to advanced RAG system, and internet access it will do well in most of the cases, but it is not perfect yet.
I value openess and fairness, and want to provide an usefull tool for everyone. If you are interested in developing together don't hesitate to reach me.

![Japanese AI Tutor](https://img.shields.io/badge/Language-Japanese-red)
![AI Powered](https://img.shields.io/badge/AI-Ollama-blue)
![RAG Enhanced](https://img.shields.io/badge/RAG-ChromaDB-green)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue)
![Privacy First](https://img.shields.io/badge/Privacy-First-purple)

## 🎯 What Makes This Special?

This Japanese AI Tutor combines **five powerful features** to create the ultimate learning experience:

1. **📚 Knowledge Base** - ChromaDB vector search through local Japanese learning materials
2. **🌐 Internet Search** - Real-time web search for current information and examples
3. **🧠 History** - References your past conversations for contextual understanding
4. **✨ Personalized** - Adapts to your learning patterns with privacy-first encryption
5. **📄 Document Generation** - Export conversations and create custom study materials with AI

Each response shows which features contributed, giving you transparency and control!

## 📖 Quick Links

- **[User Guide](USER_GUIDE.md)** - Complete guide for end users ⭐ **Start here!**
- **[System Architecture](SYSTEM_ARCHITECTURE_CLARIFICATION.md)** - Understanding the two RAG systems 🏗️ **Important!**
- **[Visual Feature Guide](VISUAL_FEATURE_GUIDE.md)** - Visual overview of all features
- **[Enhanced RAG Integration](ENHANCED_RAG_INTEGRATION.md)** - Technical implementation details
- **[Quick Reference](ENHANCED_RAG_QUICK_REFERENCE.md)** - Developer quick reference
- **[History Customization](HISTORY_CUSTOMIZATION_VERIFICATION.md)** - Privacy feature verification

## ✨ Features

### 🧠 AI-Powered Learning
- **Multi-level Support**: Beginner (N5) to Advanced (N1-N2) JLPT levels
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
- **Fallback Support**: Works offline with local resources when internet is unavailable
- **Smart Filtering**: JLPT-aware content filtering and relevance boosting

### 📄 Document Generation System (NEW!)
- **Export Conversations**: Convert any conversation to PDF, DOCX, or Markdown
- **AI-Powered Study Guides**: Generate custom study materials on any topic
- **Japanese Font Support**: Beautiful rendering of Hiragana, Katakana, and Kanji
- **Multiple Formats**:
  - **PDF** - Professional documents with proper formatting
  - **DOCX** - Microsoft Word compatible files
  - **Markdown** - Plain text for easy editing
- **Smart Content Structuring**: AI organizes content into logical sections
- **Level-Appropriate Content**: Materials tailored to your learning level
- **One-Click Export**: Export button in sidebar and chat header
- **Custom Generation**: Describe what you want to learn and AI creates it

### 🎯 Multi-Source Orchestration
- **Intelligent Coordination**: TutorOrchestrator combines local RAG, internet, and history
- **Parallel Processing**: All sources searched simultaneously for speed
- **Smart Weighting**: Results prioritized by relevance and source reliability
- **Feature Transparency**: UI shows which features contributed to each response (📚🌐🧠✨)

### 🚀 Modern Architecture
- **Docker Deployment**: Complete containerized setup
- **RESTful API**: Clean, documented API endpoints
- **Real-time Processing**: Fast response times with Ollama integration
- **Health Monitoring**: Comprehensive service status tracking

### 🌟 Future Plans
- **Integration with hand drawing**
- **Notebooks and save chats or important information**
- **Multiple model tier selection**
- **Mobile Phone support via Cloud deployment**
- **Make sure the text is generated with indentation, to make the prompts look more highlighted**
- **Document preview and editing before download**
- **Batch document generation**

## 🏗️ Architecture

### High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Frontend (HTML/CSS/JavaScript)                        │     │
│  │  • Chat Interface  • Document Generation UI            │     │
│  │  • Conversation History  • Settings Panel              │     │
│  └────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP/REST API
┌───────────────────────────────▼─────────────────────────────────┐
│                      API LAYER (Express.js)                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  server.js - Route Mounting & Initialization          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Routes (/api/*)          Middleware              Controllers    │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ chatRoute    │──────│ initialise   │──────│ chatCtrl     │  │
│  │ documentRoute│      │              │      │ documentCtrl │  │
│  │ ragRoute     │      │ - getServices│      │ ragCtrl      │  │
│  │ chromaDBRoute│      │ - ensure     │      │ chromaDBCtrl │  │
│  │ orchestrator │      │   Services   │      │ orchestrCtrl │  │
│  │ internet     │      │   Initialized│      │ internetCtrl │  │
│  │ conversation │      └──────────────┘      │ conversCtrl  │  │
│  └──────────────┘                            │ healthCtrl   │  │
│                                               └──────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       SERVICE LAYER                              │
│                                                                   │
│  Core AI Service                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  OllamaService (Dynamic Context: 4K-16K tokens)        │     │
│  │  • Query Complexity Analysis                            │     │
│  │  • 5 Context Presets                                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Orchestration                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  TutorOrchestratorService                              │     │
│  │  • Multi-source coordination                            │     │
│  │  • Smart weighting & ranking                            │     │
│  └────────────────┬───────────────────────────────────────┘     │
│                   │                                               │
│     ┌─────────────┼─────────────┬──────────────┐                │
│     │             │             │              │                │
│  ┌──▼──────┐  ┌──▼──────┐  ┌───▼───────┐  ┌──▼──────┐          │
│  │ RAG     │  │Advanced │  │ History   │  │Internet │          │
│  │ Service │  │RAG      │  │ RAG       │  │Service  │          │
│  │         │  │(Hybrid) │  │ Service   │  │(Google) │          │
│  │• Legacy │  │• Query  │  │• Privacy  │  │• Custom │          │
│  │• Keyword│  │  Expand │  │• Encrypt  │  │  Search │          │
│  │         │  │• Rerank │  │• Profile  │  │• Trust  │          │
│  └────┬────┘  └────┬────┘  └────┬──────┘  └─────────┘          │
│       │            │             │                               │
│       └────────────┼─────────────┘                               │
│                    │                                             │
│  ┌─────────────────▼──────────────────────────────────┐         │
│  │  IntegratedRAGService (Enhanced RAG)               │         │
│  │  • Hybrid Search (Keyword + Semantic)              │         │
│  │  • Query Expansion                                 │         │
│  │  • Embedding Service                               │         │
│  └────────────────┬───────────────────────────────────┘         │
│                   │                                             │
│  Other Services   │                                             │
│  ┌────────────────▼───────────────────────────────────┐         │
│  │  DocumentGenerationService                         │         │
│  │  • PDF/DOCX/Markdown Generation                    │         │
│  │  • Japanese Font Support                           │         │
│  │  • AI-powered Study Guide Creation                 │         │
│  └────────────────────────────────────────────────────┘         │
│  ┌────────────────────────────────────────────────────┐         │
│  │  ConversationService                               │         │
│  │  • History Management                              │         │
│  │  • Conversation Storage                            │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      DATA/EXTERNAL LAYER                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  ChromaDB    │  │  Ollama LLM  │  │ Google API   │          │
│  │  Vector DB   │  │  llama3:8b   │  │ Custom Search│          │
│  │  Port: 8000  │  │  Port: 11434 │  │              │          │
│  │              │  │              │  │              │          │
│  │• Semantic    │  │• Multi-lang  │  │• Trusted     │          │
│  │  Search      │  │• Dynamic Ctx │  │  Sources     │          │
│  │• 384-dim     │  │• 4K-16K      │  │• Jisho.org   │          │
│  │  Embeddings  │  │  tokens      │  │• Tae Kim     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Local Storage │  │Japanese Fonts│  │Generated Docs│          │
│  │• Grammar PDFs│  │• NotoSansJP  │  │• PDF/DOCX/MD │          │
│  │• Conversation│  │• Unicode     │  │• Study Guides│          │
│  │  History     │  │  Support     │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### MVC Architecture Detail

```
📁 Project Structure
│
├── 🌐 Frontend Layer
│   ├── index.html (Main UI)
│   ├── style.css
│   └── js/
│       ├── app-state.js (State management)
│       ├── messaging.js (Chat logic)
│       ├── conversation-history.js
│       ├── document-generation.js
│       └── settings.js
│
├── 🔧 Backend Layer (MVC Pattern)
│   │
│   ├── server.js ⭐ (Entry point - simplified to ~700 lines)
│   │   • Route mounting
│   │   • Service initialization trigger
│   │   • Error handling
│   │
│   ├── 🎛️ Middleware
│   │   └── initialise.js (Centralized initialization)
│   │       • initializeAllServices() - Singleton pattern
│   │       • getServices() - Service accessor
│   │       • ensureServicesInitialized - Route protection
│   │
│   ├── 🛣️ Routes (API Endpoint Definitions)
│   │   ├── chatRoute.js (Chat & conversations)
│   │   ├── documentRoute.js (Document generation)
│   │   ├── chromaDBRoute.js (ChromaDB operations)
│   │   ├── ragRoute.js (RAG operations)
│   │   ├── orchestrationRoute.js (Multi-source search)
│   │   ├── internetAugumentationRoute.js (Internet search)
│   │   └── conversationRoute.js (Conversation management)
│   │
│   ├── 🎮 Controllers (Business Logic)
│   │   ├── chatController.js
│   │   │   • handleChat() - Main chat logic
│   │   │   • startConversation()
│   │   │   • getConversation()
│   │   │   • deleteConversation()
│   │   │
│   │   ├── documentGenerationCotnroller.js
│   │   │   • generatePDF()
│   │   │   • generateDOCX()
│   │   │   • generateMarkdown()
│   │   │   • generateWithLLM() - AI-powered
│   │   │   • listDocuments()
│   │   │   • deleteDocument()
│   │   │
│   │   ├── chromaDBController.js
│   │   │   • healthCheck()
│   │   │   • semanticSearch()
│   │   │   • getCollectionStats()
│   │   │   • reMigration()
│   │   │
│   │   ├── ragController.js (13 functions)
│   │   │   • RAG operations
│   │   │   • Advanced RAG (hybrid search)
│   │   │   • History RAG (privacy-aware)
│   │   │   • User profile
│   │   │
│   │   ├── orchestrationController.js
│   │   ├── internetAugumentationController.js
│   │   └── healthController.js
│   │
│   ├── 🔧 Services (Core Business Logic)
│   │   ├── ollamaService.js ⭐ (LLM with dynamic context)
│   │   │   • 5 context presets (4K-16K)
│   │   │   • Query complexity analysis
│   │   │   • Smart token allocation
│   │   │
│   │   ├── ragService.js (Legacy RAG)
│   │   │   • Keyword search
│   │   │   • PDF parsing
│   │   │   • Document chunking
│   │   │
│   │   ├── enhancedRAGService.js (ChromaDB RAG)
│   │   │   • Vector semantic search
│   │   │   • ChromaDB integration
│   │   │   • Collection management
│   │   │
│   │   ├── IntegratedRAGService.js (Advanced RAG)
│   │   │   • Hybrid search (keyword + semantic)
│   │   │   • Query expansion
│   │   │   • Re-ranking
│   │   │   • Embedding service
│   │   │
│   │   ├── Privacy-Aware HistoryRAGService.js
│   │   │   • Encrypted conversation history
│   │   │   • Learning profile
│   │   │   • Privacy controls
│   │   │
│   │   ├── InternetAugumentationService.js
│   │   │   • Google Custom Search
│   │   │   • Trusted sources
│   │   │   • JLPT filtering
│   │   │
│   │   ├── TutoreOrchestratorService.js
│   │   │   • Multi-source coordination
│   │   │   • Intelligent weighting
│   │   │   • Result merging
│   │   │
│   │   ├── DocumentGenerationService.js
│   │   │   • PDF/DOCX/Markdown generation
│   │   │   • Japanese font handling
│   │   │   • AI-powered content creation
│   │   │
│   │   └── conversationService.js
│   │       • Conversation management
│   │       • History storage
│   │
│   ├── 📁 Data & Resources
│   │   ├── data/
│   │   │   ├── grammar/ (Japanese learning materials)
│   │   │   ├── embedding_cache.json
│   │   │   └── migration-status.json
│   │   │
│   │   └── fonts/
│   │       └── NotoSansJP-Regular.otf
│   │
│   └── 🗄️ ChromaDB
│       ├── docker-compose.yml
│       └── chroma_data/ (Vector database storage)
│
└── 📄 Generated Documents
    └── generated_documents/
        ├── *.pdf
        ├── *.docx
        └── *.md
```

### Request Flow Example

```
1. User sends chat message
   │
   ▼
2. POST /api/chat → chatRoute.js
   │
   ▼
3. ensureServicesInitialized middleware checks if services ready
   │  ├─ Not ready → Return 503 (Service Unavailable)
   │  └─ Ready → Continue
   │
   ▼
4. chatController.handleChat()
   │  ├─ getServices() → Retrieves all initialized services
   │  ├─ Analyze query complexity → Select context preset (4K-16K)
   │  └─ Call orchestrator
   │
   ▼
5. TutorOrchestratorService
   │  ├─ Parallel search across sources:
   │  │  ├─ RAG Service (local knowledge)
   │  │  ├─ Advanced RAG (semantic search via ChromaDB)
   │  │  ├─ History RAG (past conversations)
   │  │  └─ Internet Service (Google search)
   │  │
   │  ├─ Intelligent weighting & ranking
   │  └─ Merge results
   │
   ▼
6. OllamaService.tutorChat()
   │  ├─ Use selected context preset
   │  ├─ Generate response with LLM
   │  └─ Return with metadata
   │
   ▼
7. Response sent to client
   │  ├─ AI response
   │  ├─ Metadata (context used, sources, complexity)
   │  └─ Conversation ID
```

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Ollama** with llama3:8b model
- **Google API credentials** (optional, for enhanced internet search)

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd AI-Tutor-development

# Run the automated deployment script
./deploy.sh

# Or manually with Docker Compose
docker-compose up -d
```

Your application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/test
- **Health Check**: http://localhost:3000/api/health

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Google API credentials (optional)

# Start Ollama (in another terminal)
ollama serve
ollama pull llama3:8b

# Start the application
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b // an alternative would be this model hf.co/dahara1/gemma-3-1b-it-qat-japanese-imatrix:Q4_K_M , very easy to run and efficient and even better in some scenarios
# Note: Any multilingual Open Weight Model will work

# Google Custom Search API (Optional)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# ChromaDB Configuration
USE_CHROMADB=true
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=japanese_tutor_knowledge
EMBEDDING_MODEL=all-MiniLM-L6-v2 //also you can experiment with this Xenova/paraphrase-multilingual-mpnet-base-v2 , works great for non-latin languages
MAX_CHUNK_SIZE=800
CHUNK_OVERLAP=100

# Server Configuration
PORT=3000
NODE_ENV=development
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

## 📡 API Endpoints

### Chat & Learning
- `POST /api/chat` - Main chat interface with orchestrated RAG
- `POST /api/orchestrator/search` - Advanced multi-source search

### Document Generation (NEW!)
- `POST /api/documents/generate/pdf` - Generate PDF from conversation
- `POST /api/documents/generate/docx` - Generate DOCX from conversation
- `POST /api/documents/generate/markdown` - Generate Markdown from conversation
- `POST /api/documents/generate-with-llm` - **AI-generated custom study materials**
- `GET /api/documents/list` - List all generated documents
- `GET /api/documents/stats` - Document generation statistics
- `DELETE /api/documents/:filename` - Delete a generated document

### Service Management
- `GET /api/health` - Complete system status
- `GET /api/test` - API functionality test

### RAG Operations
- `GET /api/rag/stats` - Local RAG statistics
- `POST /api/rag/search` - Search local content
- `POST /api/rag/add` - Add documents to local RAG
- `GET /api/chromadb/health` - ChromaDB health check
- `POST /api/rag/semantic-search` - Semantic vector search
- `GET /api/rag/chroma-stats` - ChromaDB statistics
- `POST /api/rag/migrate` - Migrate to ChromaDB

### Internet Search
- `GET /api/internet/status` - Internet service status
- `POST /api/internet/search` - Direct internet search

### History & Personalization
- `GET /api/history-rag/stats` - History RAG statistics
- `POST /api/history-rag/search` - Search conversation history
- `GET /api/user/profile` - User learning profile
- `POST /api/history-rag/rebuild` - Rebuild history index
- `POST /api/history-rag/toggle` - Enable/disable history feature

### Conversation Management
- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation

## 🧪 Example Usage

### Basic Chat Request
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the difference between は and が?",
    "level": "beginner"
  }'
```

### Generate AI-Powered Study Guide
```bash
curl -X POST http://localhost:3000/api/documents/generate-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a study guide about Japanese honorifics with examples",
    "level": "intermediate",
    "format": "pdf"
  }' \
  --output study_guide.pdf
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

### Advanced Orchestrated Search
```bash
curl -X POST http://localhost:3000/api/orchestrator/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Japanese verb conjugation",
    "level": "intermediate"
  }'
```

## 📚 Learning Levels

- **🌱 Beginner (N5)**: Basic vocabulary, hiragana/katakana, simple grammar
- **📚 Elementary (N4)**: Basic kanji, past tense, particles
- **⚡ Intermediate (N3)**: Complex grammar, honorifics, advanced particles
- **🎯 Advanced (N2-N1)**: Nuanced expressions, formal language, literature

## 📄 Document Generation Features

### Export Conversations
1. Open any conversation in the sidebar
2. Click the **Export** button (📥)
3. Choose your format: PDF, DOCX, or Markdown
4. Download instantly!

### AI-Powered Document Creation
1. Click **🤖 AI Document Generator** in the sidebar
2. Describe what you want to learn (e.g., "Create a beginner's guide to particles")
3. Select your learning level
4. Choose output format
5. AI generates and downloads a comprehensive study guide!

**Example Prompts:**
There are already suggested prompts on hoover.
- "Create a study guide for Japanese verb conjugations"
- "Make a reference sheet for JLPT N3 grammar points"
- "Generate a guide about keigo (honorific language)"
- "Create practice materials for hiragana with examples"

### Supported Document Formats

| Format | Best For | Features |
|--------|----------|----------|
| **PDF** | Print, sharing, professional documents | Japanese font support, page numbers, formatting |
| **DOCX** | Editing in Word | Full Japanese support, easy customization |
| **Markdown** | Plain text, note-taking | Simple format, version control friendly |

## 🛠️ Development

### Project Structure
```
AI-Tutor-development/
├── backend/
│   ├── server.js                          # Main Express server
│   ├── services/
│   │   ├── ollamaService.js               # Ollama LLM integration
│   │   ├── ragService.js                  # Local RAG system
│   │   ├── enhancedRAGService.js          # ChromaDB integration
│   │   ├── InternetAugumentationService.js # Google Search
│   │   ├── TutoreOrchestratorService.js   # Multi-source orchestration
│   │   ├── conversationService.js         # Conversation management
│   │   ├── Privacy-Aware HistoryRAGService.js # History with privacy
│   │   └── DocumentGenerationService.js   # PDF/DOCX/Markdown generation
│   ├── fonts/
│   │   └── NotoSansJP-Regular.otf        # Japanese font for PDFs
│   └── data/
│       └── grammar/                       # Local Japanese grammar resources
├── generated_documents/                   # Auto-created document output directory
├── frontend/
│   ├── index.html                        # Web interface
│   └── js/
│       ├── app-state.js                  # Application state
│       ├── messaging.js                  # Chat functionality
│       ├── conversation-history.js       # History management
│       ├── document-generation.js        # Document generation UI
│       └── settings.js                   # Settings panel
├── docker-compose.yml                    # Docker deployment
├── Dockerfile                            # Container definition
└── deploy.sh                            # Automated deployment
```

### Adding New Resources

To add new Japanese learning materials:

```bash
# Add PDF or text files to the grammar directory
cp your-grammar-book.pdf backend/data/grammar/

# The RAG service will automatically index new files on restart
npm restart
```

### Installing Additional Fonts

To add more fonts for document generation:

```bash
# Download a TTF or OTF font
cd backend/fonts/
curl -O https://example.com/your-font.ttf

# Update DocumentGenerationService.js to use the new font
```

### Running Tests

```bash
# Test all endpoints
curl http://localhost:3000/api/test

# Test health status
curl http://localhost:3000/api/health

# Test chat functionality
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "level": "beginner"}'

# Test document generation
curl -X POST http://localhost:3000/api/documents/generate-with-llm \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test study guide",
    "level": "beginner",
    "format": "pdf"
  }' \
  --output test.pdf
```

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update and rebuild
docker-compose build --no-cache
docker-compose up -d
```

### GPU Support

For NVIDIA GPU acceleration:

```bash
# Use the default docker-compose.yml (includes GPU support)
docker-compose up -d

# For CPU-only deployment
docker-compose -f docker-compose.cpu.yml up -d
```

## 🔧 Troubleshooting

### Common Issues

**Ollama Connection Failed**
```bash
# Start Ollama service
ollama serve

# Pull required model
ollama pull llama3:8b
```

**RAG Service Not Loading**
```bash
# Check if grammar files exist
ls backend/data/grammar/

# Check server logs
docker-compose logs japanese-tutor
```

**Google API Not Working**
- Verify API credentials in `.env`
- Check API quota limits
- Ensure Custom Search Engine is configured

**Japanese Characters Not Showing in PDF**
```bash
# Verify font exists
ls backend/fonts/NotoSansJP-Regular.otf

# Font will be automatically downloaded on first run
# If missing, download manually from:
# https://fonts.google.com/noto/specimen/Noto+Sans+JP
```

**Document Generation Slow**
- AI document generation can take 10-30 seconds depending on complexity
- Ensure Ollama is running with sufficient resources (8GB+ RAM recommended)
- Check Ollama logs: `ollama serve`
- This is still in BETA, may not work as intended all the time, and also the structure needs adjustments
- Make sure you have a compatible Japanese Font to use in order to better display the characters

### Performance Optimization

- **Memory**: Allocate at least 8GB RAM for Ollama
- **GPU**: Use NVIDIA GPU for faster inference (3-5x speedup)
- **Storage**: SSD recommended for model loading and document generation
- **ChromaDB**: Runs on port 8000, ensure no conflicts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code structure and naming conventions
- Add comments for complex logic
- Update README for new features
- Test all changes locally before submitting PR
- Update API documentation for new endpoints

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama Team** - For the excellent local LLM platform
- **ChromaDB** - For the powerful vector database
- **Tae Kim** - For the comprehensive Japanese grammar guide
- **Google Noto Fonts** - For excellent CJK font support
- **Japanese Learning Community** - For the amazing online resources
- **Docker & Node.js Communities** - For the robust development tools
- **PDFKit & DOCX** - For document generation libraries

## 📈 Roadmap

### In Progress
- [x] Document generation (PDF, DOCX, Markdown)
- [x] AI-powered custom study material creation
- [x] Japanese font support in PDFs
- [x] Export conversation feature

### Planned Features
- [ ] Document preview before download
- [ ] Batch document generation
- [ ] Custom templates for study guides
- [ ] Advanced conversation practice mode
- [ ] Kanji stroke order learning
- [ ] Voice input/output integration
- [ ] Mobile app development
- [ ] Personalized learning paths
- [ ] Progress tracking and analytics
- [ ] Multi-language interface
- [ ] Integration with hand drawing for kanji practice
- [ ] Notebook system for saving important information
- [ ] Multiple model tier selection
- [ ] Development of further models from scratch using TensorFLow 
- [ ] Testing and evaluating further use of libraries for embeddings
- [ ] Notion Style Interface
- [ ] Cloud deployment for mobile support

---

Made with ❤️ for Japanese language learners worldwide 🇯🇵

**Version:** 3.1.0 - Document Generation Edition

For support or questions, please open an issue or contact the development team.
