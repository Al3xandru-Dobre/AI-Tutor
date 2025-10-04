const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.historyPath = path.join(__dirname, '../data/history');
    this.historyFilePath = path.join(this.historyPath, 'conversations.json');
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(this.historyPath, { recursive: true });
      await this.loadConversations();
      this.isInitialized = true;
      console.log('Conversation Service initialized.');
    } catch (error) {
      console.error('Conversation Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  async loadConversations() {
    try {
      const data = await fs.readFile(this.historyFilePath, 'utf-8');
      const parsedData = JSON.parse(data);
      this.conversations = new Map(Object.entries(parsedData));
      console.log(`Loaded ${this.conversations.size} conversations from history.`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No conversation history file found. Starting fresh.');
        this.conversations = new Map();
      } else {
        console.error('Error loading conversation history:', error);
      }
    }
  }

  async saveConversations() {
    try {
      const dataToSave = JSON.stringify(Object.fromEntries(this.conversations), null, 2);
      await fs.writeFile(this.historyFilePath, dataToSave, 'utf-8');
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  async createConversation(title) {
    if (!this.isInitialized) await this.initialize();
    
    const conversationId = crypto.randomBytes(8).toString('hex');
    const conversation = {
      id: conversationId,
      title: title || `Conversation on ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    this.conversations.set(conversationId, conversation);
    await this.saveConversations();
    return conversation;
  }

  async addMessage(conversationId, { role, content }) {
    if (!this.conversations.has(conversationId)) {
      throw new Error('Conversation not found');
    }
    const conversation = this.conversations.get(conversationId);
    conversation.messages.push({
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date().toISOString(),
    });
    await this.saveConversations();
    return conversation;
  }

  async getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  async listConversations() {
    // Return a summary of conversations, not the full message history
    return Array.from(this.conversations.values())
      .map(({ id, title, createdAt }) => ({ id, title, createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async deleteConversation(conversationId) {
    const deleted = this.conversations.delete(conversationId);
    if (deleted) {
      await this.saveConversations();
    }
    return deleted;
  }
}

module.exports = ConversationService;