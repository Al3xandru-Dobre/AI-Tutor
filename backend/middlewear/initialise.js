// ========================================
// CENTRALIZED SERVICE INITIALIZATION
// ========================================
const OllamaService = require('../services/ollamaService');
const EnhancedRAGService = require('../services/enhancedRAGService');
const IntegratedRAGService = require('../services/IntegratedRAGService');
const InternetAugmentationService = require('../services/InternetAugumentationService');
const TutorOrchestratorService = require('../services/TutoreOrchestratorService');
const ConversationService = require('../services/conversationService');
const PrivacyHistoryRAGService = require('../services/Privacy-Aware HistoryRAGService');
const DocumentGenerationService = require('../services/DocumentGenerationService');
const ModelProviderService = require('../services/ModelProviderService');
const VocabularyService = require('../services/vocabService');
const NotebookService = require('../services/notebookService');

// Environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

// Service instances (singleton pattern)
let services = null;
let servicesInitialized = false;


/**
 * Initialize all services
 * @returns {Promise<Object>} Initialized services
 */
async function initializeAllServices() {
  if (services && servicesInitialized) {
    console.log('ℹ️  Services already initialized, returning cached instances...');
    return services;
  }

  console.log('🔧 Initializing services...\n');

  try {
    // ========================================
    // STEP 1: Instantiate all services
    // ========================================
    
    // Core services
    const ollama = new OllamaService();
    const internetService = new InternetAugmentationService(GOOGLE_API_KEY, SEARCH_ENGINE_ID);
    const history = new ConversationService();
    const historyRAG = new PrivacyHistoryRAGService(history);
    const modelProvider = new ModelProviderService();
    const vocabulary = new VocabularyService();
    const notebook = new NotebookService();

    // Enhanced RAG Service with ChromaDB (must be before orchestrator)
    const rag = new EnhancedRAGService({
      chromaPath: process.env.CHROMA_DB_URL || 'http://localhost:8000',
      collectionName: process.env.CHROMA_COLLECTION_NAME || 'japanese_tutor_knowledge',
      embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/multilingual-e5-base',
      useChromaDB: process.env.USE_CHROMADB !== 'false',
      maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE) || 800,
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 100
    });

    // Orchestrator and Document Service (depend on rag)
    const orchestrator = new TutorOrchestratorService(rag, internetService, ollama, historyRAG);
    orchestrator.setModelProvider(modelProvider);
    const documentService = new DocumentGenerationService(ollama, modelProvider);

    // Integrated RAG Service (Advanced features)
    const advancedRag = new IntegratedRAGService({
      chromaPath: process.env.CHROMA_DB_URL || 'http://localhost:8000',
      collectionName: 'japanese_tutor_advanced',
      
      // Feature flags
      useHybridSearch: true,
      useQueryExpansion: true,
      useCustomEmbeddings: false,
      
      // Configuration
      maxExpansions: 5,
      maxChunkSize: 800,
      chunkOverlap: 100,
      
      // Hybrid search weights
      semanticWeight: 0.7,
      keywordWeight: 0.3
    });

    // ========================================
    // STEP 2: Initialize services in sequence
    // ========================================
    console.log('📋 Starting service initialization sequence...\n');

    // Step 1: Initialize conversation history
    console.log('1️⃣  Initializing Conversation Service...');
    await history.initialize();
    console.log('   ✅ Conversation service ready!\n');

    // Step 2: Initialize Enhanced RAG with ChromaDB
    console.log('2️⃣  Initializing Enhanced RAG Service...');
    await rag.initialize();
    console.log(`   ✅ RAG service ready (Mode: ${rag.useChromaDB ? 'ChromaDB' : 'Legacy'})\n`);

    // Step 3: Initialize Advanced/Integrated RAG (non-critical - allow failure)
    console.log('3️⃣  Initializing Integrated RAG Service (Advanced Features)...');
    try {
      await advancedRag.initialize();
      if (advancedRag.isInitialized) {
        console.log('   ✅ Integrated RAG service ready (Hybrid Search + Query Expansion)\n');
      } else {
        console.log('   ⚠️  Integrated RAG service failed to initialize (ChromaDB may not be available)\n');
      }
    } catch (error) {
      console.warn('   ⚠️  Integrated RAG initialization failed:', error.message);
      console.log('   ℹ️  Continuing with basic RAG only...\n');
    }

    // Step 4: Initialize History RAG
    console.log('4️⃣  Initializing History RAG Service...');
    await historyRAG.initialize();
    console.log('   ✅ History RAG service ready!\n');

    // Step 5: Check Ollama Service (no initialization needed - relies on external service)
    console.log('5️⃣  Checking Ollama Service...');
    const ollamaStatus = await ollama.checkStatus();
    console.log(`   ${ollamaStatus.status === 'healthy' ? '✅' : '⚠️ '} Ollama: ${ollamaStatus.status === 'healthy' ? 'ready' : 'not available'} (${ollamaStatus.ollama_url})\n`);

    // Step 6: Check internet service
    console.log('6️⃣  Checking Internet Augmentation Service...');
    console.log(`   ${internetService.isConfigured() ? '✅' : '⚠️ '} Internet service: ${internetService.isConfigured() ? 'configured' : 'using fallback mode'}\n`);

    // Step 7: Initialize Model Provider Service
    console.log('7️⃣  Initializing Model Provider Service...');
    try {
      await modelProvider.initialize(ollama);
      console.log('   ✅ Model Provider service ready!\n');
    } catch (error) {
      console.error('   ❌ Model Provider initialization failed:', error.message);
      console.log('   ⚠️  Continuing without model provider...\n');
      // Don't throw - allow app to continue without model provider
    }

    // Step 8: Initialize Vocabulary Service
    console.log('8️⃣  Initializing Vocabulary Service...');
    await vocabulary.initialize();
    console.log('   ✅ Vocabulary service ready!\n');

    // Step 9: Initialize Notebook Service
    console.log('9️⃣  Initializing Notebook Service...');
    await notebook.initialize();
    console.log('   ✅ Notebook service ready!\n');

    console.log('🎉 All services initialized successfully!\n');

    // Cache service instances
    services = {
      ollama,
      rag,
      advancedRag,
      internetService,
      history,
      historyRAG,
      orchestrator,
      documentService,
      modelProvider,
      vocabulary,
      notebook
    };

    servicesInitialized = true;

    // Print summary
    printServiceSummary(services);

    return services;

  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    throw error;
  }
}

/**
 * Print service status summary
 */
function printServiceSummary(services) {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       SERVICE STATUS SUMMARY             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  Ollama LLM:              ${services.ollama.model ? '✅ Configured' : '❌ Not Configured'} (External Service - requires Ollama running)`);
  console.log(`  RAG Service:             ${services.rag.isInitialized ? '✅ Ready' : '❌ Not Ready'}`);
  console.log(`  ChromaDB Mode:           ${services.rag.useChromaDB ? '✅ Enabled' : '⚠️  Disabled'}`);
  console.log(`  Integrated RAG:          ${services.advancedRag.isInitialized ? '✅ Ready (Hybrid+Expansion)' : '⚠️  Not Ready'}`);
  console.log(`  Internet Search:         ${services.internetService.isConfigured() ? '✅ Configured' : '⚠️  Fallback'}`);
  console.log(`  History RAG:             ${services.historyRAG.isInitialized ? '✅ Ready' : '⚠️  Disabled'}`);
  console.log(`  Conversation History:    ${services.history.isInitialized ? '✅ Ready' : '❌ Not Ready'}`);
  console.log(`  Vocabulary Service:      ${services.vocabulary.isInitialized ? '✅ Ready' : '❌ Not Ready'}`);
  console.log(`  Notebook Service:        ${services.notebook.isInitialized ? '✅ Ready' : '❌ Not Ready'}`);
  console.log('');
  console.log('');
}

/**
 * Get initialized services (throws if not initialized)
 */
function getServices() {
  if (!services || !servicesInitialized) {
    throw new Error('Services not initialized. Call initializeAllServices() first.');
  }
  return services;
}

/**
 * Check if services are initialized
 */
function areServicesInitialized() {
  return servicesInitialized;
}

/**
 * Express middleware to ensure services are initialized
 */
function ensureServicesInitialized(req, res, next) {
  if (!servicesInitialized) {
    return res.status(503).json({
      error: 'Services are still initializing. Please try again in a few seconds.',
      retry_after: 3
    });
  }
  next();
}

module.exports = {
  initializeAllServices,
  getServices,
  areServicesInitialized,
  ensureServicesInitialized,
  printServiceSummary
};

