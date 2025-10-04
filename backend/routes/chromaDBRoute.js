const express = require('express');
const router = express.Router();
const {
    healthCheck,
    semanticSearch,
    getCollectionStats,
    reMigration
} = require ('../controllers/chromaDBController');

const { ensureServicesInitialized } = require('../middlewear/initialise');

router.use(ensureServicesInitialized);

router.get("/health", healthCheck);
router.post("/semantic-search", semanticSearch);
router.post("/migrate", reMigration);
router.get("/chroma-stats", getCollectionStats);

module.exports = router;

