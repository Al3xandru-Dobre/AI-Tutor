const express = require('express');
const router = express.Router();
const chatRoutes = require('./chatRoute');
const conversationRoutes = require('./conversationRoute');
const documentRoutes = require('./documentRoute');
const chromaDBRoutes = require('./chromaDBRoute');
const healthRoutes = require('./healthRoute');
const internetAugmentationRoutes = require('./internetAugumentationRoute');
const orchestrationRoutes = require('./orchestrationRoute');
const ragRoutes = require('./ragRoute');

// Mount individual route modules (no /api prefix - already added in server.js)
router.use('/', healthRoutes);
router.use('/', chatRoutes);
router.use('/conversations', conversationRoutes);
router.use('/documents', documentRoutes);
router.use('/chromadb', chromaDBRoutes);
router.use('/', internetAugmentationRoutes);
router.use('/', orchestrationRoutes);
router.use('/rag', ragRoutes);

module.exports = router;