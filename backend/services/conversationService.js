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