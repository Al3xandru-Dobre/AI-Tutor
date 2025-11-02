const { getServices, areServicesInitialized } = require('../middlewear/initialise');

async function healthCheck(req, res) {
    try {
    // Check if services are initialized first
    if (!areServicesInitialized()) {
      return res.json({
        status: 'initializing',
        message: 'Services are currently initializing. Please wait...',
        timestamp: new Date().toISOString()
      });
    }

    const { rag } = getServices();
    if (!rag.useChromaDB) {
      return res.json({
        status: 'disabled',
        message: 'ChromaDB integration is disabled',
        mode: 'legacy',
        help: 'Set USE_CHROMADB=true in .env to enable'
      });
    }

    const collectionStats = await rag.getCollectionStats();
    
    res.json({
      status: 'healthy',
      chromadb_url: rag.chromaUrl,
      collection: collectionStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'ChromaDB connection failed'
    });
  }
}


async function semanticSearch(req, res) {
    try{
        const { rag } = getServices();
        const {query, level = 'beginner' , options = {}} = req.body;


        if (!query || query.trim().length === 0) {
            return res.status(400).json({error: 'Query is required'});
        }

        const results = await rag.semanticSearch(query, level, {
            maxResults: options.maxResults || 5,
            categories: options.categories,
            minScord: options.minScore || 0.3,
            includeMetadata: true
        });

        res.json({
            results,
            query,
            level,
            search_type: rag.useChromaDB ? 'semantic_vector' : 'keyword',
            total_found: reults.length,
            chromadb_enabled: rag.useChromaDB,
            timestamp: new Date().toString()
        });

        } catch (error) {
            res.status(500).json({
                error: 'Search failed',
                details: error.message
            });
        }
}

async function getCollectionStats(req, res) {
    try {
        const { rag } = getServices();
        const stats = await rag.getCollectionStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get statistics.',
            message: error.message
        });
    }
}

async function reMigration(req, res) {
    try{
        const { rag } = getServices();
        if(!rag.useChromaDB) {
           return res.status(400).json({
            error: 'ChromaDB is not enabled.',
            message: 'Set USE_CHROMADB=true in .env to enable ChromaDB'
          });
        }

        await rag.migrateToChromaDB();
        const stats = await rag.getCollectionStats();

        res.json({
          success: true,
          message: 'Migration completed successfully',
          stats,
          timestamp: new Date().toISOString()
        });
      } catch(error){

        res.status(500).json({
          error: 'Migration failed',
          details: error.message
        })
      }
}

module.exports = {
  healthCheck,
  semanticSearch,
  getCollectionStats,
  reMigration
}