const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { encryptConversations, decryptConversations } = require('../utils/encryption');

class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.historyPath = path.join(__dirname, '../data/history');
    this.isInitialized = false;
  }

  /**
   * Get user-specific conversation file path
   * @param {string} userId - User ID
   * @returns {string} File path
   */
  getUserFilePath(userId) {
    return path.join(this.historyPath, `conversations-${userId}.json`);
  }

  /**
   * Initialize conversation service
   */
  async initialize() {
    try {
      await fs.mkdir(this.historyPath, { recursive: true });
      this.isInitialized = true;
      console.log('Conversation Service initialized with encryption support.');
    } catch (error) {
      console.error('Conversation Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load user's encrypted conversations
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's conversations
   */
  async loadUserConversations(userId) {
    try {
      const filePath = this.getUserFilePath(userId);
      const data = await fs.readFile(filePath, 'utf-8');
      const encryptedPackage = JSON.parse(data);
      
      // Decrypt conversations
      const decryptedData = decryptConversations(encryptedPackage, userId);
      
      return decryptedData || {};
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No conversation file found for user ${userId}. Starting fresh.`);
        return {};
      } else {
        console.error(`Error loading conversations for user ${userId}:`, error);
        return {};
      }
    }
  }

  /**
   * Save user's encrypted conversations
   * @param {string} userId - User ID
   * @param {Object} conversations - Conversations object
   * @returns {Promise<boolean>} Success status
   */
  async saveUserConversations(userId, conversations) {
    try {
      const filePath = this.getUserFilePath(userId);
      
      // Encrypt conversations
      const encryptedPackage = encryptConversations(conversations, userId);
      
      // Save to file
      const dataToSave = JSON.stringify(encryptedPackage, null, 2);
      await fs.writeFile(filePath, dataToSave, 'utf-8');
      
      return true;
    } catch (error) {
      console.error(`Error saving conversations for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Create a new conversation for user
   * @param {string} userId - User ID
   * @param {string} title - Conversation title
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(userId, title) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Load user's existing conversations
    const userConversations = await this.loadUserConversations(userId);

    // Create new conversation
    const conversationId = crypto.randomBytes(8).toString('hex');
    const conversation = {
      id: conversationId,
      userId: userId, // Add userId for ownership verification
      title: title || `Conversation on ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date().toISOString(),
    };

    userConversations[conversationId] = conversation;

    // Save encrypted conversations
    await this.saveUserConversations(userId, userConversations);

    return conversation;
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of conversations
   */
  async getUserConversations(userId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userConversations = await this.loadUserConversations(userId);
    
    // Convert to array and sort by createdAt
    return Object.values(userConversations)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get a specific conversation for a user (with ownership check)
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object|null>} Conversation object or null
   */
  async getConversation(userId, conversationId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !conversationId) {
      throw new Error('User ID and Conversation ID are required');
    }

    const userConversations = await this.loadUserConversations(userId);
    const conversation = userConversations[conversationId];

    // Ownership check
    if (!conversation || conversation.userId !== userId) {
      console.warn(`User ${userId} attempted to access conversation ${conversationId} (owned by ${conversation?.userId})`);
      return null;
    }

    return conversation;
  }

  /**
   * Add a message to a conversation
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message object { role, content }
   * @returns {Promise<Object>} Updated conversation
   */
  async addMessage(userId, conversationId, { role, content }) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !conversationId) {
      throw new Error('User ID and Conversation ID are required');
    }

    const userConversations = await this.loadUserConversations(userId);
    const conversation = userConversations[conversationId];

    // Ownership check
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    // Add message
    conversation.messages.push({
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date().toISOString(),
    });

    // Save encrypted conversations
    await this.saveUserConversations(userId, userConversations);

    return conversation;
  }

  /**
   * Delete a conversation (with ownership check)
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteConversation(userId, conversationId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !conversationId) {
      throw new Error('User ID and Conversation ID are required');
    }

    const userConversations = await this.loadUserConversations(userId);
    const conversation = userConversations[conversationId];

    // Ownership check
    if (!conversation || conversation.userId !== userId) {
      console.warn(`User ${userId} attempted to delete conversation ${conversationId} (owned by ${conversation?.userId})`);
      return false;
    }

    delete userConversations[conversationId];

    // Save encrypted conversations
    await this.saveUserConversations(userId, userConversations);

    console.log(`Conversation ${conversationId} deleted for user ${userId}`);
    return true;
  }

  /**
   * Delete all conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAllUserConversations(userId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Load user's conversations
    const userConversations = await this.loadUserConversations(userId);
    const count = Object.keys(userConversations).length;

    // Delete file
    const filePath = this.getUserFilePath(userId);
    try {
      await fs.unlink(filePath);
      console.log(`✅ Deleted all ${count} conversations for user ${userId}`);
      
      return {
        success: true,
        message: `Successfully deleted ${count} conversation(s)`,
        count
      };
    } catch (error) {
      console.error('Error deleting user conversations:', error);
      return {
        success: false,
        message: 'Failed to delete conversations'
      };
    }
  }

  /**
   * Get conversation messages formatted for model context
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {object} options - Options for message retrieval
   * @returns {Promise<Array>} Array of messages in {role, content} format
   */
  async getConversationMessages(userId, conversationId, options = {}) {
    if (!userId || !conversationId) {
      throw new Error('User ID and Conversation ID are required');
    }

    const conversation = await this.getConversation(userId, conversationId);
    if (!conversation) {
      return [];
    }

    const {
      maxMessages = null,        // Maximum number of messages to return (null = all)
      maxTokens = null,          // Approximate token limit (null = no limit)
      includeSystemPrompt = false, // Whether to include a system prompt
      systemPrompt = null,       // Custom system prompt
      preserveRecent = true      // If truncating, keep most recent messages
    } = options;

    let messages = [...conversation.messages]; // Create a copy

    // Apply message count limit if specified
    if (maxMessages && messages.length > maxMessages) {
      if (preserveRecent) {
        // Keep most recent messages
        messages = messages.slice(-maxMessages);
      } else {
        // Keep oldest messages
        messages = messages.slice(0, maxMessages);
      }
    }

    // Apply approximate token limit if specified
    if (maxTokens) {
      messages = this._truncateByTokens(messages, maxTokens, preserveRecent);
    }

    // Format messages for model context
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system prompt if requested
    if (includeSystemPrompt && systemPrompt) {
      formattedMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    return formattedMessages;
  }

  /**
   * Truncate messages based on approximate token count
   * Uses rough estimate: 1 token ≈ 4 characters
   * @private
   */
  _truncateByTokens(messages, maxTokens, preserveRecent = true) {
    const estimateTokens = (text) => Math.ceil(text.length / 4);

    let totalTokens = 0;
    const result = [];

    // Process messages in appropriate order
    const orderedMessages = preserveRecent ? [...messages].reverse() : messages;

    for (const msg of orderedMessages) {
      const msgTokens = estimateTokens(msg.content);

      if (totalTokens + msgTokens <= maxTokens) {
        result.push(msg);
        totalTokens += msgTokens;
      } else {
        // Check if we can fit a truncated version of this message
        const remainingTokens = maxTokens - totalTokens;
        if (remainingTokens > 50) { // Only if we have meaningful space left
          const truncatedContent = msg.content.substring(0, remainingTokens * 4) + '...';
          result.push({
            ...msg,
            content: truncatedContent
          });
        }
        break;
      }
    }

    // Restore original order if we processed in reverse
    return preserveRecent ? result.reverse() : result;
  }

  /**
   * Get conversation summary for context
   * Returns a condensed version of conversation
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {number} maxMessages - Maximum number of messages to include
   * @returns {Promise<string>} Conversation summary
   */
  async getConversationSummary(userId, conversationId, maxMessages = 5) {
    const messages = await this.getConversationMessages(userId, conversationId, {
      maxMessages,
      preserveRecent: true
    });

    if (messages.length === 0) {
      return 'No previous conversation.';
    }

    const summary = messages.map((msg, idx) =>
      `${idx + 1}. ${msg.role === 'user' ? 'User' : 'Assistant'}: ${
        msg.content.length > 100
          ? msg.content.substring(0, 100) + '...'
          : msg.content
      }`
    ).join('\n');

    return `Previous conversation (last ${messages.length} messages):\n${summary}`;
  }

  /**
   * Get conversation list for a user
   * @param {string} userId - User ID
   * @param {number} limit - Limit number of results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of conversations with metadata
   */
  async listUserConversations(userId, limit = null, offset = 0) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userConversations = await this.loadUserConversations(userId);

    // Return summary of conversations, not full message history
    const allConversations = Object.values(userConversations)
      .map(({ id, title, createdAt }) => ({ id, title, createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination if limit is specified
    if (limit !== null) {
      return allConversations.slice(offset, offset + limit);
    }

    return allConversations;
  }

  /**
   * Export a conversation for a user (with ownership check)
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {boolean} useForTraining - Whether to export for training
   * @returns {Promise<Object>} Export result
   */
  async exportUserConversation(userId, conversationId, useForTraining = false) {
    if (!userId || !conversationId) {
      throw new Error('User ID and Conversation ID are required');
    }

    const conversation = await this.getConversation(userId, conversationId);
    if (!conversation) {
      return { success: false, message: 'Conversation not found or access denied' };
    }

    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `conversation_${conversationId}_${timestamp}.json`;

    // If user wants to use for training, save a copy to training folder
    if (useForTraining) {
      const trainingPath = path.join(__dirname, '../data/training');
      await fs.mkdir(trainingPath, { recursive: true });

      const trainingFilePath = path.join(trainingPath, filename);
      await fs.writeFile(trainingFilePath, JSON.stringify(conversation, null, 2), 'utf-8');
      console.log(`✅ Conversation exported for training: ${trainingFilePath}`);
    }

    return {
      success: true,
      message: useForTraining
        ? 'Conversation exported successfully and saved for training'
        : 'Conversation exported successfully',
      filename,
      data: conversation
    };
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const conversations = await this.getUserConversations(userId);
    let totalMessages = 0;
    let userMessages = 0;
    let assistantMessages = 0;
    const lastActivity = conversations.length > 0 
      ? Math.max(...conversations.map(c => new Date(c.createdAt)))
      : null;

    conversations.forEach(conv => {
      totalMessages += conv.messages.length;
      userMessages += conv.messages.filter(m => m.role === 'user').length;
      assistantMessages += conv.messages.filter(m => m.role === 'assistant').length;
    });

    return {
      userId,
      conversationCount: conversations.length,
      totalMessages,
      userMessages,
      assistantMessages,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
      averageMessagesPerConversation: conversations.length > 0 
        ? (totalMessages / conversations.length).toFixed(2)
        : 0
    };
  }
}


module.exports = ConversationService;