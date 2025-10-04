const express = require('express');
const router = express.Router();
const { ensureServicesInitialized } = require('../middlewear/initialise');
const { handleChat } = require('../controllers/chatController');

// Chat route with middleware
router.post('/chat', ensureServicesInitialized, handleChat);

module.exports = router;