const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const {
    orchestratorStatus,
    orchestrateSearch
} = require('../controllers/orchestrationController');


router.use(ensureServicesInitialized);

// Orchestration routes
router.get('/stats', orchestratorStatus);
router.post('/search', orchestrateSearch);

module.exports = router;