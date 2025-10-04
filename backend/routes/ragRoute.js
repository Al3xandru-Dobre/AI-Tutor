const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const {
    RAGStatistics,
    searchRAG,
    addRag,
    advancedRAG_advancedRAGSearch,
    advancedRAG_expandQuery,
    advancedRAG_hybridStats,
    advancedRAG_generateEmbedding,
    historyRAGstatistics,
    historyRAG_search,
    userProfile,
    historyRAG_reBuild,
    historyRAG_toggle,
    historyRAG_settings
} = require('../controllers/ragController');

router.use(ensureServicesInitialized);

// Basic RAG routes
router.get('/stats', RAGStatistics);
router.post('/search', searchRAG);
router.post('/add', addRag);

// Advanced RAG routes
router.post('/advanced-search', advancedRAG_advancedRAGSearch);
router.post('/expand-query', advancedRAG_expandQuery);
router.get('/hybrid-stats', advancedRAG_hybridStats);
router.post('/generate-embedding', advancedRAG_generateEmbedding);

// Legacy advancedRAG routes (for backward compatibility)
router.post('/advancedRAG/advanced-search', advancedRAG_advancedRAGSearch);
router.post('/advancedRAG/expand-query', advancedRAG_expandQuery);
router.get('/advancedRAG/hybrid-stats', advancedRAG_hybridStats);
router.post('/advancedRAG/generate-embedding', advancedRAG_generateEmbedding);

// History RAG routes
router.get('/history-rag/stats', historyRAGstatistics);
router.post('/history-rag/search', historyRAG_search);
router.get('/user/profile', userProfile);
router.post('/history-rag/rebuild', historyRAG_reBuild);
router.post('/history-rag/toggle', historyRAG_toggle);
router.get('/history-rag/settings', historyRAG_settings);

module.exports = router;
