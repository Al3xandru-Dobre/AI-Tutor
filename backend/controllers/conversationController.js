const { getServices } = require('../middlewear/initialise');

// List all conversations with pagination support
async function listConversations(req, res) {
  try {
    const { history } = getServices();
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const conversations = await history.listConversations(limit, offset);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get specific conversation
async function getConversation(req, res) {
  try {
    const { history } = getServices();
    const conversation = await history.getConversation(req.params.id);
    if (conversation) {
      res.json(conversation);
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete conversation
async function deleteConversation(req, res) {
  try {
    const { history, historyRAG } = getServices();
    const success = await history.deleteConversation(req.params.id);
    if (success) {
      // Rebuild history index after deletion
      if (historyRAG.isInitialized) {
        await historyRAG.initialize();
      }
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete all conversations
async function deleteAllConversations(req, res) {
  try {
    const { history, historyRAG } = getServices();
    const result = await history.deleteAllConversations();

    if (result.success) {
      // Rebuild history index after deletion
      if (historyRAG && historyRAG.isInitialized) {
        await historyRAG.initialize();
      }

      res.json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      res.status(500).json({ error: 'Failed to delete conversations' });
    }
  } catch (error) {
    console.error('Error deleting all conversations:', error);
    res.status(500).json({ error: error.message });
  }
}

// Export conversation
async function exportConversation(req, res) {
  try {
    const { history } = getServices();
    const { id } = req.params;
    const { useForTraining } = req.body;

    const result = await history.exportConversation(id, useForTraining);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        filename: result.filename,
        data: result.data
      });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Sync all conversations to training data
async function syncTrainingData(req, res) {
  try {
    const { history } = getServices();
    const { enabled } = req.body;

    const result = await history.syncAllConversationsToTraining(enabled);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      res.status(500).json({ error: 'Failed to sync training data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get training data statistics
async function getTrainingStats(req, res) {
  try {
    const { history } = getServices();
    const result = await history.getTrainingDataStats();

    if (result.success) {
      res.json({
        success: true,
        count: result.count,
        files: result.files
      });
    } else {
      res.status(500).json({ error: 'Failed to get training stats' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Export all training data as single JSON file
async function exportAllTrainingData(req, res) {
  try {
    const { history } = getServices();
    const result = await history.exportAllTrainingData();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        filename: result.filename,
        data: result.data
      });
    } else {
      res.status(404).json({ error: result.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listConversations,
  getConversation,
  deleteConversation,
  deleteAllConversations,
  exportConversation,
  syncTrainingData,
  getTrainingStats,
  exportAllTrainingData
};
