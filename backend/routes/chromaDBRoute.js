const express = require('express');
const router = express.Router();
const {
    healthCheck,
    semanticSearch,
    getCollectionStats,
    reMigration
} = require ('../controllers/chromaDBController');

const { ensureServicesInitialized } = require('../middlewear/initialise');

// Health check doesn't need the middleware - should work even during initialization
router.get("/health", healthCheck);

// Other routes require services to be initialized
router.use(ensureServicesInitialized);
router.post("/semantic-search", semanticSearch);
router.post("/migrate", reMigration);
router.get("/chroma-stats", getCollectionStats);

module.exports = router;

