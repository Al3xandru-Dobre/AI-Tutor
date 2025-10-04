const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const {
  enhancedHealthCheck,
  testEndpoint
} = require('../controllers/healthController');

// Health and test routes (no middleware needed for health checks)
router.get('/health', ensureServicesInitialized, enhancedHealthCheck);
router.get('/test', testEndpoint);

module.exports = router;
