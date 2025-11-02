const { getServices, areServicesInitialized } = require('../middlewear/initialise');

// Enhanced health check endpoint
async function enhancedHealthCheck(req, res) {
  try {
    // Check if services are initialized first
    if (!areServicesInitialized()) {
      return res.json({
        status: 'initializing',
        message: 'Services are currently initializing. Please wait...',
        timestamp: new Date().toISOString(),
        system_ready: false
      });
    }

    const { ollama, rag, internetService, orchestrator, historyRAG } = getServices();

    const ollamaStatus = await ollama.checkStatus();
    const ragStats = rag.getStats();
    const internetStatus = internetService.getStatus();
    const orchestratorStats = orchestrator.getStats();
    const historyStats = historyRAG.getStats();

    // ChromaDB status
    let chromaStatus = { available: false };
    try {
      if (rag.useChromaDB) {
        chromaStatus = await rag.getCollectionStats();
        chromaStatus.available = true;
      }
    } catch (error) {
      chromaStatus.error = error.message;
    }

    res.json({
      status: 'healthy',
      version: '3.0.0-chromadb',
      timestamp: new Date().toISOString(),
      ollama: ollamaStatus,
      rag: ragStats,
      chromadb: chromaStatus,
      internet_service: internetStatus,
      history_rag: historyStats,
      orchestrator: orchestratorStats,
      system_ready: ollamaStatus.status === 'healthy' && ragStats.initialized,
      enhanced_features: {
        chromadb_semantic_search: rag.useChromaDB,
        internet_augmentation: internetStatus.isConfigured,
        orchestration: true,
        multi_source_rag: true,
        history_based_personalization: historyStats.initialized,
        learning_analytics: historyStats.initialized,
        conversation_memory: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
}

// Test endpoint
function testEndpoint(req, res) {
  // Check if services are initialized
  if (!areServicesInitialized()) {
    return res.json({
      message: 'Japanese Tutor API v3.0 - ChromaDB Enhanced!',
      timestamp: new Date().toISOString(),
      version: '3.0.0-chromadb',
      status: 'initializing',
      system_ready: false,
      note: 'Services are currently initializing. Please wait and try again in a few seconds.'
    });
  }

  const { rag, ollama, internetService, history, historyRAG } = getServices();

  const features = {
    'ChromaDB Vector Search': rag.useChromaDB,
    'Enhanced RAG': true,
    'Internet Augmentation': internetService.isConfigured(),
    'Multi-source Orchestration': true,
    'History-based Personalization': historyRAG.isInitialized,
    'Learning Analytics': historyRAG.isInitialized,
    'Conversation Memory': true
  };

  res.json({
    message: 'Japanese Tutor API v3.0 - ChromaDB Enhanced!',
    timestamp: new Date().toISOString(),
    version: '3.0.0-chromadb',
    features: features,
    services: {
      ollama: ollama.model ? 'connected' : 'disconnected',
      rag: rag.isInitialized ? 'ready' : 'initializing',
      chromadb: rag.useChromaDB ? 'enabled' : 'disabled',
      internet: internetService.isConfigured() ? 'configured' : 'fallback',
      history: history.isInitialized ? 'ready' : 'initializing',
      historyRAG: historyRAG.isInitialized ? 'ready' : 'initializing'
    },
    endpoints: [
      '📝 POST /api/chat - Enhanced chat with semantic search',
      '❤️  GET /api/health - Complete system status',
      '🧪 GET /api/test - This endpoint',
      '',
      '🔍 ChromaDB Endpoints:',
      '  GET /api/chromadb/health - ChromaDB health check',
      '  POST /api/chromadb/semantic-search - Semantic vector search',
      '  GET /api/chromadb/chroma-stats - ChromaDB statistics',
      '  POST /api/chromadb/migrate - Migrate to ChromaDB',
      '',
      '📚 RAG Endpoints:',
      '  GET /api/rag/stats - RAG statistics',
      '  POST /api/rag/search - Search content',
      '  POST /api/rag/add - Add document',
      '',
      '🌐 Internet Endpoints:',
      '  GET /api/internet/status - Service status',
      '  POST /api/internet/search - Search internet',
      '',
      '🎯 Orchestrator Endpoints:',
      '  GET /api/orchestrator/stats - Statistics',
      '  POST /api/orchestrator/search - Multi-source search',
      '',
      '📖 History RAG Endpoints:',
      '  GET /api/history-rag/stats - Statistics',
      '  POST /api/history-rag/search - Search history',
      '  GET /api/user/profile - User profile',
      '  POST /api/history-rag/rebuild - Rebuild index',
      '',
      '💬 Conversation Endpoints:',
      '  GET /api/conversations - List all',
      '  GET /api/conversations/:id - Get specific',
      '  DELETE /api/conversations/:id - Delete',
      '',
      '📄 Document Generation Endpoints:',
      '  POST /api/documents/generate/pdf - Generate PDF',
      '  POST /api/documents/generate/docx - Generate DOCX',
      '  POST /api/documents/generate/markdown - Generate Markdown',
      '  GET /api/documents/list - List generated documents',
      '  GET /api/documents/stats - Service statistics',
      '  DELETE /api/documents/:filename - Delete document'
    ]
  });
}

module.exports = {
  enhancedHealthCheck,
  testEndpoint
};
