const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const { authenticate, optionalAuth } = require('../middlewear/auth');
const {
  listConversations,
  getConversation,
  deleteConversation,
  deleteAllConversations,
  exportConversation,
  syncTrainingData,
  getTrainingStats,
  exportAllTrainingData
} = require('../controllers/conversationController');

// Apply middleware to all routes
router.use(ensureServicesInitialized);

// Conversation routes (require authentication)
router.get('/', authenticate, listConversations);
router.delete('/', authenticate, deleteAllConversations);
router.get('/:id', authenticate, getConversation);
router.delete('/:id', authenticate, deleteConversation);
router.post('/:id/export', authenticate, exportConversation);

// Training data routes (require authentication)
router.post('/training/sync', authenticate, syncTrainingData);
router.get('/training/stats', authenticate, getTrainingStats);
router.get('/training/export', authenticate, exportAllTrainingData);

module.exports = router;
