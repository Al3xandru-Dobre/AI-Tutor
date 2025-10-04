const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const {
  listConversations,
  getConversation,
  deleteConversation
} = require('../controllers/conversationController');

// Apply middleware to all routes
router.use(ensureServicesInitialized);

// Conversation routes
router.get('/', listConversations);
router.get('/:id', getConversation);
router.delete('/:id', deleteConversation);

module.exports = router;
