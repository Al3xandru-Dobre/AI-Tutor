const { getServices } = require('../middlewear/initialise');

// List all conversations
async function listConversations(req, res) {
  try {
    const { history } = getServices();
    const conversations = await history.listConversations();
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

module.exports = {
  listConversations,
  getConversation,
  deleteConversation
};
