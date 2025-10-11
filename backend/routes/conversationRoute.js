const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const {
  listConversations,
  getConversation,
  deleteConversation,
  exportConversation,
  syncTrainingData,
  getTrainingStats,
  exportAllTrainingData
} = require('../controllers/conversationController');

// Apply middleware to all routes
router.use(ensureServicesInitialized);

// Conversation routes
router.get('/', listConversations);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);
router.post('/:id/export', exportConversation);

// Training data routes
router.post('/training/sync', syncTrainingData);
router.get('/training/stats', getTrainingStats);
router.get('/training/export', exportAllTrainingData);

module.exports = router;
