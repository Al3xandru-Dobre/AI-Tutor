const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const OllamaService = require('./services/ollamaService');
const RAGService = require('./services/ragService');
const InternetAugmentationService = require('./services/InternetAugumentationService');
const TutorOrchestratorService = require('./services/TutoreOrchestratorService');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize services
const ollama = new OllamaService();
const rag = new RAGService();
const internetService = new InternetAugmentationService(GOOGLE_API_KEY, SEARCH_ENGINE_ID);
const orchestrator = new TutorOrchestratorService(rag, internetService, ollama);

// Initialize RAG on startup
rag.initialize().then(() => {
  console.log('✅ RAG service ready!');
}).catch(err => {
  console.error('❌ RAG initialization failed:', err);
});

console.log('🔧 Internet augmentation service:', internetService.isConfigured() ? 'configured' : 'using fallback mode');

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, level = 'beginner', context = {}, useOrchestrator = true } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`[${new Date().toISOString()}] User (${level}): ${message}`);
    
    const startTime = Date.now();
    let response, sources = {};

    if (useOrchestrator) {
      // Use the enhanced orchestrator for both local and internet RAG
      console.log('🎯 Using TutorOrchestrator for enhanced response...');
      
      const orchestratorResult = await orchestrator.getAugmentedAnswer(message, level, context);
      response = orchestratorResult.response;
      sources = orchestratorResult.sources;
      
      console.log(`[${new Date().toISOString()}] Orchestrator response time: ${orchestratorResult.processing_time}ms`);
      
    } else {
      // Fallback to basic RAG-only approach
      console.log('📚 Using basic RAG-only approach...');
      
      const relevantContent = await rag.searchRelevantContent(message, level, 3);
      console.log(`Found ${relevantContent.length} relevant documents`);
      
      const enhancedContext = {
        ...context,
        level,
        rag_context: relevantContent
      };
      
      response = await ollama.tutorChat(message, enhancedContext);
      sources = {
        local: relevantContent,
        internet: [],
        summary: `Found ${relevantContent.length} local resources`
      };
    }
    
    const totalTime = Date.now() - startTime;
    
    res.json({
      response,
      timestamp: new Date().toISOString(),
      model: ollama.model,
      processing_time: ollama.lastResponseTime,
      total_time: totalTime,
      level: level,
      sources: sources,
      orchestrator_used: useOrchestrator
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const ollamaStatus = await ollama.checkStatus();
    const ragStats = rag.getStats();
    const internetStatus = internetService.getStatus();
    const orchestratorStats = orchestrator.getStats();
    
    res.json({
      ...ollamaStatus,
      rag: ragStats,
      internet_service: internetStatus,
      orchestrator: orchestratorStats,
      system_ready: ollamaStatus.status === 'healthy' && ragStats.initialized,
      enhanced_features: {
        internet_augmentation: internetStatus.configured || internetStatus.fallback_enabled,
        orchestration: true,
        multi_source_rag: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// RAG management endpoints
app.get('/api/rag/stats', (req, res) => {
  res.json(rag.getStats());
});

app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, level = 'beginner', maxResults = 5 } = req.body;
    const results = await rag.searchRelevantContent(query, level, maxResults);
    res.json({ results, query, level });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/add', async (req, res) => {
  try {
    const { title, content, metadata = {} } = req.body;
    const docId = await rag.addDocument(title, content, metadata);
    res.json({ docId, message: 'Document added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Internet augmentation endpoints
app.get('/api/internet/status', (req, res) => {
  res.json(internetService.getStatus());
});

app.post('/api/internet/search', async (req, res) => {
  try {
    const { query, maxResults = 3 } = req.body;
    const results = await internetService.search(query, maxResults);
    res.json({ 
      results, 
      query, 
      source: 'internet',
      configured: internetService.isConfigured()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orchestrator endpoints
app.get('/api/orchestrator/stats', (req, res) => {
  res.json(orchestrator.getStats());
});

app.post('/api/orchestrator/search', async (req, res) => {
  try {
    const { query, level = 'beginner', context = {} } = req.body;
    const result = await orchestrator.getAugmentedAnswer(query, level, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Japanese Tutor Demo API is running!',
    timestamp: new Date().toISOString(),
    features: {
      'Enhanced RAG': true,
      'Internet Augmentation': internetService.isConfigured() || internetService.fallbackEnabled,
      'Orchestration': true,
      'Multi-source Search': true
    },
    endpoints: [
      'POST /api/chat - Enhanced chat with orchestrator',
      'GET /api/health - Complete system status',
      'GET /api/test - This endpoint',
      // RAG endpoints
      'GET /api/rag/stats - RAG statistics',
      'POST /api/rag/search - Search local content',
      'POST /api/rag/add - Add document to RAG',
      // Internet endpoints
      'GET /api/internet/status - Internet service status',
      'POST /api/internet/search - Search internet content',
      // Orchestrator endpoints
      'GET /api/orchestrator/stats - Orchestrator statistics',
      'POST /api/orchestrator/search - Multi-source enhanced search'
    ]
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Japanese Tutor Demo running on http://localhost:${PORT}`);
  console.log(`📖 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API Test: http://localhost:${PORT}/api/test`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});