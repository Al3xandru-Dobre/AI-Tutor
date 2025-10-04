const { getServices } = require('../middlewear/initialise');

async function RAGStatistics(req, res) {
    try {
        const { rag } = getServices();
        const stats = rag.getStats();
        res.json(stats);
    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
}

async function searchRAG(req, res) {
    try {
        const { rag } = getServices();
        const { query, level = 'beginner', maxResults = 5 } = req.body;
        const results = await rag.searchRelevantContent(query, level, maxResults);
        res.json({
            results,
            query,
            level,
            mode: rag.useChromaDB ? 'semantic' : 'keyword'
        });
    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
}

async function addRag(req,res){
    try {
        const { rag } = getServices();
        const { title, content, metadata = {} } = req.body;
        const docId = await rag.addDocument(title, content, metadata);

        const chunks = rag.chunckDocument(content);
        
        res.json({
            docId,
            message: `Document added with ${chunks.length} chunks`,
            chunks_created: chunks.length,
            mode: rag.useChromaDB ? 'chromadb' : 'legacy'
        });
    } catch (error){
        res.status(500).json({
            error: error.message
        })
    }
}

async function advancedRAG_advancedRAGSearch(req, res){
    try{
        const { rag } = getServices();
        const {
            query,
            level = 'beginner',
            maxResults = 5,
            useHybrid = true,
            expandQuery = true,
            rerank = true
        } = req.body;

        const results = await rag.advancedSearch( query, level, {
            maxResults,
            useHybrid,
            expandQuery,
            rerank
        });

        res.json({
            success: true,
            query: query,
            results: results.results,
            metadata: results.metadata,
            timestamp: new Date().toISOString()
        });
    } catch(error){
        console.error('Advanced RAG search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}


async function advancedRAG_expandQuery(req, res){
    try{
        const { rag } = getServices();

        const {
            query,
            level = 'beginner'
        } = req.body

        const expansions = await rag.queryExpansion.expandQuery(query,level)
        
        res.json({
            original: query,
            expansions: {
                synonyms: expansions.synonyms,
                related: expansions.related,
                grammar: expansions.grammar,
                romaji: expansions.romaji,
                combined: expansions.combined
            },
            stats: rag.queryExpansion.getStats()
        });
    }catch (error){
        res.status(500).json({
            error: error.message
        })
    }
}

async function advancedRAG_hybridStats(req,res){
    try{
        const { rag } = getServices();
        const stats = rag.getStats();

        res.json({
            service_stats: stats.service,
            features: stats.features,
            hybrid_search: stats.subservices.hybrid_search,
            query_expansion: stats.subservices.query_expansion,
            embeddings: stats.subservices.embeddings
        });

    } catch(error) {
        res.status(500).json({
            error: error.message
        })
    }
}


async function advancedRAG_generateEmbedding(req, res){
    try{
        const { rag } = getServices();
        const { text } = req.body;

        if(!text || text.trim().length === 0) {
            return res.status(400).json({
                error: 'Text is required'
            });
        }

        const embedding = await rag.embeddingService.embed(text, {
            useCache: true,
            optimize: true
        });

        res.json({
            text: text.substring(0, 200) + '...',
            embedding_dimension: embedding.length,
            smaple_values: embedding.slice(0,10),
            stats: rag.embeddingService.getStats()
        });
    } catch(error) {
            res.status(500).json({ error: error.message });
        }
}

async function historyRAGstatistics(req, res) {
    try {
        const { historyRAG } = getServices();
        const stats = historyRAG.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get HistoryRAG statistics.',
            message: error.message
        });
    }
}

async function historyRAG_search(req, res) {
    try {
        const { historyRAG } = getServices();
        const { query, level = 'beginner', maxResults = 5 } = req.body;
        const results = await historyRAG.searchHistoryContext(query, level, maxResults);
        res.json({
            results,
            query,
            level,
            maxResults,
            source: 'conversation_history',
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to search HistoryRAG.',
            message: error.message
        });
    }
}

async function userProfile(req, res) {
    try {
        const { historyRAG } = getServices();
        const profile = historyRAG.getUserLearningProfile();
        res.json(profile);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get user profile.',
            message: error.message
        });
    }
}

async function historyRAG_reBuild(req, res) {
    try {
        const { historyRAG } = getServices();
        await historyRAG.initialize();
        res.json({
            message: 'HistoryRAG re-initialization started.',
            stats: historyRAG.getStats()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to re-initialize HistoryRAG.',
            message: error.message
        });
    }
}

async function historyRAG_toggle(req, res) {
    try {
        const { historyRAG } = getServices();
        const { enable } = req.body;
        if (typeof enable !== 'boolean') {
            return res.status(400).json({ error: 'Enable must be a boolean.',
                            error: 'Invalid request'
             });
        }
        const status = await historyRAG.setEnabled(enable);
        res.json({
            success: true,
            message: `HistoryRAG is now ${status ? 'enabled' : 'disabled'}.`,
            enabled: status
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to toggle HistoryRAG.',
            message: error.message
        });
    }
}

async function historyRAG_settings(req, res) {
  try {
    const { historyRAG } = getServices();
    const settings = {
      enabled: historyRAG.isEnabled,
      encryption_enabled: historyRAG.enableEncryption,
      initialized: historyRAG.isInitialized
    };
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



module.exports = {
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
};