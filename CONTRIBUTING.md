# Contributing to Japanese AI Tutor

Thank you for your interest in contributing to the Japanese AI Tutor project! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** - your question might already be answered
3. **Test with the latest version** to ensure the issue still exists

When creating an issue, please include:

- **Clear description** of the problem or feature request
- **Steps to reproduce** (for bugs)
- **Expected vs actual behavior**
- **Environment information** (OS, Node.js version, Docker version)
- **Relevant logs or error messages**

### Submitting Changes

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the coding standards
3. **Test thoroughly** - ensure all functionality works
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/japanese_ai_tutor.git
cd japanese_ai_tutor

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

## 📋 Development Guidelines

### Code Style

- **JavaScript**: Use ES6+ features, consistent indentation (2 spaces)
- **Comments**: Clear, concise comments for complex logic
- **Naming**: Descriptive variable and function names
- **Error Handling**: Comprehensive error handling with meaningful messages

### Project Structure

```
japanese_ai_tutor/
├── backend/
│   ├── server.js                 # Main server file
│   ├── services/                 # Business logic services
│   │   ├── ollamaService.js      # LLM integration
│   │   ├── ragService.js         # Local knowledge base
│   │   ├── InternetAugumentationService.js  # Internet search
│   │   └── TutoreOrchestratorService.js     # Multi-source coordination
│   └── data/                     # Local resources
├── frontend/                     # Web interface
├── fine-tuning/                  # Model training scripts
└── docs/                         # Documentation
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add voice input support for Japanese practice
fix: resolve Ollama connection timeout issues
docs: update API documentation with new endpoints
refactor: improve RAG service performance
test: add unit tests for orchestrator service
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code improvements

## 🧪 Testing

### Manual Testing

```bash
# Test all endpoints
curl http://localhost:3000/api/test

# Test chat functionality
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "level": "beginner"}'

# Test health status
curl http://localhost:3000/api/health
```

### Docker Testing

```bash
# Test Docker deployment
docker-compose up -d
docker-compose logs -f

# Test with different configurations
docker-compose -f docker-compose.cpu.yml up -d
```

## 📚 Areas for Contribution

### High Priority

1. **Performance Optimization**
   - Improve response times
   - Optimize memory usage
   - Enhance caching mechanisms

2. **Error Handling**
   - Better error messages
   - Graceful failure recovery
   - Improved logging

3. **Documentation**
   - API documentation improvements
   - Tutorial creation
   - Code comments

### Medium Priority

1. **New Features**
   - Voice input/output
   - Mobile responsiveness
   - Progress tracking
   - User authentication

2. **Testing**
   - Unit test coverage
   - Integration tests
   - Performance benchmarks

3. **Deployment**
   - Kubernetes support
   - CI/CD pipelines
   - Cloud deployment guides

### Japanese Language Expertise

We especially welcome contributions from:

- **Japanese language teachers** - curriculum and pedagogy improvements
- **Native Japanese speakers** - content accuracy and cultural context
- **JLPT experts** - level-appropriate content curation
- **Linguistics experts** - grammar explanation improvements

## 🌟 Feature Requests

When suggesting new features, please consider:

1. **Educational Value** - How does it help Japanese learners?
2. **Technical Feasibility** - Is it implementable with current architecture?
3. **User Experience** - Does it improve the learning experience?
4. **Maintenance** - Can it be maintained long-term?

### Popular Feature Ideas

- **Conversation Practice** - Interactive dialogue scenarios
- **Kanji Learning** - Stroke order and radical recognition
- **Grammar Drills** - Interactive grammar exercises
- **Pronunciation Guide** - Audio examples and practice
- **Cultural Context** - Real-world usage examples
- **Progress Analytics** - Learning progress visualization

## 🛠️ Technical Contributions

### Service Improvements

1. **RAG Service Enhancements**
   - Better document parsing
   - Improved relevance scoring
   - Semantic search capabilities

2. **Internet Service Optimization**
   - Additional trusted sources
   - Better query optimization
   - Caching mechanisms

3. **Orchestrator Intelligence**
   - Machine learning for source selection
   - Personalized recommendations
   - Learning path optimization

### Infrastructure

1. **Monitoring & Observability**
   - Application metrics
   - Performance monitoring
   - Usage analytics

2. **Security**
   - Input validation
   - Rate limiting
   - Authentication systems

3. **Scalability**
   - Load balancing
   - Database optimization
   - Microservices architecture

## 📞 Getting Help

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For questions and community discussion
- **Documentation** - Check README.md and DOCKER_DEPLOYMENT.md

## 📄 License

By contributing to Japanese AI Tutor, you agree that your contributions will be licensed under the ISC License.

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** - Contributors section
- **CHANGELOG.md** - Feature attribution
- **Release notes** - Major contribution highlights

---

Thank you for helping make Japanese language learning more accessible and effective! 🇯🇵✨
