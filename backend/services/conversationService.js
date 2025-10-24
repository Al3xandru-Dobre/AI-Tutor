const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.historyPath = path.join(__dirname, '../data/history');
    this.historyFilePath = path.join(this.historyPath, 'conversations.json');
    this.settingsPath = path.join(__dirname, '../data/privacy/user-settings.json');
    this.isInitialized = false;
    this.settings = {
      includeConversationHistory: true,  // Privacy setting: include full conversation history in model context
      maxHistoryTokens: 8000,            // Max tokens for conversation history
      historyRAGEnabled: true,
      encryptionEnabled: true
    };
  }

  async initialize() {
    try {
      await fs.mkdir(this.historyPath, { recursive: true });
      await fs.mkdir(path.join(__dirname, '../data/privacy'), { recursive: true });
      await this.loadConversations();
      await this.loadSettings();
      this.isInitialized = true;
      console.log('Conversation Service initialized.');
      console.log(`  Privacy setting - Include conversation history: ${this.settings.includeConversationHistory}`);
    } catch (error) {
      console.error('Conversation Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const savedSettings = JSON.parse(data);
      this.settings = {
        ...this.settings,
        ...savedSettings
      };
      console.log('Privacy settings loaded.');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No settings file found. Using defaults.');
        await this.saveSettings();
      } else {
        console.error('Error loading settings:', error);
      }
    }
  }

  async saveSettings() {
    try {
      const dataToSave = JSON.stringify(this.settings, null, 2);
      await fs.writeFile(this.settingsPath, dataToSave, 'utf-8');
    } catch (error) {
      console.error('Error saving settings:', error);
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

  /**
   * Get conversation messages formatted for model context
   * @param {string} conversationId - The conversation ID
   * @param {object} options - Options for message retrieval
   * @returns {Array} Array of messages in {role, content} format
   */
  async getConversationMessages(conversationId, options = {}) {
    // PRIVACY: Check if conversation history inclusion is enabled
    if (!this.settings.includeConversationHistory) {
      console.log('⚠️  Conversation history inclusion is disabled (privacy setting)');
      return [];
    }

    const {
      maxMessages = null,        // Maximum number of messages to return (null = all)
      maxTokens = null,          // Approximate token limit (null = no limit)
      includeSystemPrompt = false, // Whether to include a system prompt
      systemPrompt = null,       // Custom system prompt
      preserveRecent = true      // If truncating, keep most recent messages
    } = options;

    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

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
   * Returns a condensed version of the conversation
   */
  async getConversationSummary(conversationId, maxMessages = 5) {
    const messages = this.getConversationMessages(conversationId, {
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
   * Update privacy settings
   * @param {object} newSettings - Settings to update
   */
  async updatePrivacySettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings,
      lastUpdated: new Date().toISOString()
    };
    await this.saveSettings();
    console.log('Privacy settings updated:', newSettings);
    return this.settings;
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings() {
    return {
      ...this.settings,
      includeConversationHistory: this.settings.includeConversationHistory,
      maxHistoryTokens: this.settings.maxHistoryTokens,
      historyRAGEnabled: this.settings.historyRAGEnabled,
      encryptionEnabled: this.settings.encryptionEnabled
    };
  }

  async listConversations(limit = null, offset = 0) {
    // Return a summary of conversations, not the full message history
    const allConversations = Array.from(this.conversations.values())
      .map(({ id, title, createdAt }) => ({ id, title, createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination if limit is specified
    if (limit !== null) {
      return allConversations.slice(offset, offset + limit);
    }
    
    return allConversations;
  }

  async deleteConversation(conversationId) {
    const deleted = this.conversations.delete(conversationId);
    if (deleted) {
      await this.saveConversations();
    }
    return deleted;
  }

  async deleteAllConversations() {
    if (!this.isInitialized) await this.initialize();

    const count = this.conversations.size;
    this.conversations.clear();
    await this.saveConversations();

    console.log(`🗑️ Deleted all ${count} conversations`);
    return {
      success: true,
      message: `Successfully deleted ${count} conversation(s)`,
      count
    };
  }

  async exportConversation(conversationId, useForTraining = false) {
    if (!this.isInitialized) await this.initialize();

    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return { success: false };
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

  async syncAllConversationsToTraining(enableTraining) {
    if (!this.isInitialized) await this.initialize();

    const trainingPath = path.join(__dirname, '../data/training');

    if (enableTraining) {
      // Copy all conversations to training folder
      await fs.mkdir(trainingPath, { recursive: true });

      let copiedCount = 0;
      for (const [conversationId, conversation] of this.conversations.entries()) {
        const filename = `conversation_${conversationId}.json`;
        const trainingFilePath = path.join(trainingPath, filename);
        await fs.writeFile(trainingFilePath, JSON.stringify(conversation, null, 2), 'utf-8');
        copiedCount++;
      }

      console.log(`✅ Copied ${copiedCount} conversations to training folder`);
      return {
        success: true,
        message: `${copiedCount} conversations copied to training data`,
        count: copiedCount
      };
    } else {
      // Delete all conversations from training folder
      try {
        const files = await fs.readdir(trainingPath);
        let deletedCount = 0;

        for (const file of files) {
          if (file.startsWith('conversation_') && file.endsWith('.json')) {
            await fs.unlink(path.join(trainingPath, file));
            deletedCount++;
          }
        }

        console.log(`🗑️ Deleted ${deletedCount} conversations from training folder`);
        return {
          success: true,
          message: `${deletedCount} conversations removed from training data`,
          count: deletedCount
        };
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Training folder doesn't exist, nothing to delete
          return {
            success: true,
            message: 'No training data to remove',
            count: 0
          };
        }
        throw error;
      }
    }
  }

  async getTrainingDataStats() {
    const trainingPath = path.join(__dirname, '../data/training');

    try {
      const files = await fs.readdir(trainingPath);
      const conversationFiles = files.filter(file =>
        file.startsWith('conversation_') && file.endsWith('.json')
      );

      return {
        success: true,
        count: conversationFiles.length,
        files: conversationFiles
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: true,
          count: 0,
          files: []
        };
      }
      throw error;
    }
  }

  async exportAllTrainingData() {
    const trainingPath = path.join(__dirname, '../data/training');

    try {
      const files = await fs.readdir(trainingPath);
      const conversationFiles = files.filter(file =>
        file.startsWith('conversation_') && file.endsWith('.json')
      );

      if (conversationFiles.length === 0) {
        return {
          success: false,
          message: 'No training data available to export'
        };
      }

      // Read all training data files
      const allTrainingData = [];
      for (const file of conversationFiles) {
        const filePath = path.join(trainingPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const conversation = JSON.parse(fileContent);
        allTrainingData.push(conversation);
      }

      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
      const filename = `training_data_export_${timestamp}.json`;

      return {
        success: true,
        message: `Successfully exported ${conversationFiles.length} conversations`,
        filename,
        data: {
          exportDate: new Date().toISOString(),
          totalConversations: conversationFiles.length,
          conversations: allTrainingData
        }
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          message: 'Training data folder not found'
        };
      }
      throw error;
    }
  }
}

module.exports = ConversationService;