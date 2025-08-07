# 🇯🇵 Japanese AI Tutor

An intelligent Japanese language learning assistant powered by AI, featuring advanced RAG (Retrieval-Augmented Generation) capabilities with both local grammar resources and real-time internet search integration.

![Japanese AI Tutor](https://img.shields.io/badge/Language-Japanese-red)
![AI Powered](https://img.shields.io/badge/AI-Ollama-blue)
![RAG Enhanced](https://img.shields.io/badge/RAG-Enhanced-green)
![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

### 🧠 AI-Powered Learning
- **Multi-level Support**: Beginner (N5) to Advanced (N1-N2) JLPT levels
- **Contextual Responses**: Adaptive explanations based on user proficiency
- **Cultural Context**: Includes cultural insights alongside language learning
- **Proper Japanese Text**: Full Unicode support for hiragana, katakana, and kanji

### 📚 Advanced RAG System
- **Local Knowledge Base**: Curated Japanese grammar books and resources
- **Internet Integration**: Real-time search from trusted Japanese learning websites
- **Multi-Source Intelligence**: Combines local and online resources for comprehensive answers
- **Smart Orchestration**: Intelligent source prioritization and relevance scoring

### 🌐 Internet Augmentation
- **Google Custom Search**: Integration with Japanese learning websites
- **Trusted Sources**: Jisho.org, Tae Kim's Guide, IMABI, Tofugu, and more
- **Fallback Support**: Works offline with local resources when internet is unavailable
- **Smart Filtering**: JLPT-aware content filtering and relevance boosting

### 🚀 Modern Architecture
- **Docker Deployment**: Complete containerized setup
- **RESTful API**: Clean, documented API endpoints
- **Real-time Processing**: Fast response times with Ollama integration
- **Health Monitoring**: Comprehensive service status tracking

## 🏗️ Architecture

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
                    └───────────────────────┘
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
cd japanese_ai_tutor

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
OLLAMA_MODEL=llama3:8b

# Google Custom Search API (Optional)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

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

### Service Management
- `GET /api/health` - Complete system status
- `GET /api/test` - API functionality test

### RAG Operations
- `GET /api/rag/stats` - Local RAG statistics
- `POST /api/rag/search` - Search local content
- `POST /api/rag/add` - Add documents to local RAG

### Internet Search
- `GET /api/internet/status` - Internet service status
- `POST /api/internet/search` - Direct internet search

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

## 🛠️ Development

### Project Structure
```
japanese_ai_tutor/
├── backend/
│   ├── server.js                 # Main Express server
│   ├── services/
│   │   ├── ollamaService.js      # Ollama LLM integration
│   │   ├── ragService.js         # Local RAG system
│   │   ├── InternetAugumentationService.js  # Google Search
│   │   └── TutoreOrchestratorService.js     # Multi-source orchestration
│   └── data/
│       └── grammar/              # Local Japanese grammar resources
├── frontend/
│   └── index.html               # Web interface
├── fine-tuning/
│   └── local_trainer.py         # Model fine-tuning scripts
├── docker-compose.yml           # Docker deployment
├── Dockerfile                   # Container definition
└── deploy.sh                   # Automated deployment
```

### Adding New Resources

To add new Japanese learning materials:

```bash
# Add PDF or text files to the grammar directory
cp your-grammar-book.pdf backend/data/grammar/

# The RAG service will automatically index new files on restart
npm restart
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

### Performance Optimization

- **Memory**: Allocate at least 8GB RAM for Ollama
- **GPU**: Use NVIDIA GPU for faster inference
- **Storage**: SSD recommended for model loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama Team** - For the excellent local LLM platform
- **Tae Kim** - For the comprehensive Japanese grammar guide
- **Japanese Learning Community** - For the amazing online resources
- **Docker & Node.js Communities** - For the robust development tools

## 📈 Roadmap

- [ ] Advanced conversation practice mode
- [ ] Kanji stroke order learning
- [ ] Voice input/output integration
- [ ] Mobile app development
- [ ] Personalized learning paths
- [ ] Progress tracking and analytics
- [ ] Multi-language interface
- [ ] Advanced fine-tuning capabilities

---

Made with ❤️ for Japanese language learners worldwide 🇯🇵

For support or questions, please open an issue or contact the development team.
