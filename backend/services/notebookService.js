const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { encryptNotebook, decryptNotebook } = require('../utils/encryption');

class NotebookService {
  constructor() {
    this.notebooks = new Map();
    this.notebooksPath = path.join(__dirname, '../data/notebooks');
    this.isInitialized = false;
  }

  /**
   * Get user-specific notebook file path
   * @param {string} userId - User ID
   * @returns {string} File path
   */
  getUserFilePath(userId) {
    return path.join(this.notebooksPath, `notebook-${userId}.json`);
  }

  async initialize() {
    try {
      await fs.mkdir(this.notebooksPath, { recursive: true });
      this.isInitialized = true;
      console.log('Notebook Service initialized with encryption support.');
    } catch (error) {
      console.error('Notebook Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load user's encrypted notebooks
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's notebooks
   */
  async loadUserNotebooks(userId) {
    try {
      const filePath = this.getUserFilePath(userId);
      const data = await fs.readFile(filePath, 'utf-8');
      const encryptedPackage = JSON.parse(data);

      // Decrypt notebooks
      const decryptedData = decryptNotebook(encryptedPackage, userId);

      return decryptedData || {};
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No notebook file found for user ${userId}. Starting fresh.`);
        return {};
      } else {
        console.error(`Error loading notebooks for user ${userId}:`, error);
        return {};
      }
    }
  }

  /**
   * Save user's encrypted notebooks
   * @param {string} userId - User ID
   * @param {Object} notebooks - Notebooks object
   * @returns {Promise<boolean>} Success status
   */
  async saveUserNotebooks(userId, notebooks) {
    try {
      const filePath = this.getUserFilePath(userId);

      // Encrypt notebooks
      const encryptedPackage = encryptNotebook(notebooks, userId);

      // Save to file
      const dataToSave = JSON.stringify(encryptedPackage, null, 2);
      await fs.writeFile(filePath, dataToSave, 'utf-8');

      return true;
    } catch (error) {
      console.error(`Error saving notebooks for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Create a new notebook for user
   * @param {string} userId - User ID
   * @param {Object} entryData - Notebook data
   * @returns {Promise<Object>} Created notebook
   */
  async createNotebook(userId, entryData) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Load user's existing notebooks
    const userNotebooks = await this.loadUserNotebooks(userId);

    const notebook = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId, // Add userId for ownership verification
      title: entryData.title || 'Untitled Entry',
      content: entryData.content || '',
      type: entryData.type || 'note',
      category: entryData.category || 'general',
      tags: entryData.tags || [],
      vocabularyIds: entryData.vocabularyIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      difficulty: entryData.difficulty || 'beginner',
      masteryLevel: 0,
      practiceCount: 0,
      lastPracticed: null,
      metadata: entryData.metadata || {}
    };

    userNotebooks[notebook.id] = notebook;

    // Save encrypted notebooks
    await this.saveUserNotebooks(userId, userNotebooks);

    return notebook;
  }

  /**
   * Get a specific notebook for user (with ownership check)
   * @param {string} userId - User ID
   * @param {string} id - Notebook ID
   * @returns {Promise<Object|null>} Notebook object or null
   */
  async getNotebook(userId, id) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !id) {
      throw new Error('User ID and Notebook ID are required');
    }

    const userNotebooks = await this.loadUserNotebooks(userId);
    const notebook = userNotebooks[id];

    // Ownership check
    if (!notebook || notebook.userId !== userId) {
      console.warn(`User ${userId} attempted to access notebook ${id} (owned by ${notebook?.userId})`);
      return null;
    }

    return notebook;
  }

  /**
   * Get all notebooks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of notebooks
   */
  async getAllNotebooks(userId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userNotebooks = await this.loadUserNotebooks(userId);

    // Convert to array and sort by updatedAt
    return Object.values(userNotebooks)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Update a notebook (with ownership check)
   * @param {string} userId - User ID
   * @param {string} id - Notebook ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated notebook
   */
  async updateNotebook(userId, id, updates) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !id) {
      throw new Error('User ID and Notebook ID are required');
    }

    const userNotebooks = await this.loadUserNotebooks(userId);
    const existing = userNotebooks[id];

    // Ownership check
    if (!existing || existing.userId !== userId) {
      throw new Error('Notebook not found or access denied');
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      userId: existing.userId, // Preserve userId
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    userNotebooks[id] = updated;

    // Save encrypted notebooks
    await this.saveUserNotebooks(userId, userNotebooks);

    return updated;
  }

  /**
   * Delete a notebook (with ownership check)
   * @param {string} userId - User ID
   * @param {string} id - Notebook ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotebook(userId, id) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !id) {
      throw new Error('User ID and Notebook ID are required');
    }

    const userNotebooks = await this.loadUserNotebooks(userId);
    const notebook = userNotebooks[id];

    // Ownership check
    if (!notebook || notebook.userId !== userId) {
      console.warn(`User ${userId} attempted to delete notebook ${id} (owned by ${notebook?.userId})`);
      return false;
    }

    delete userNotebooks[id];

    // Save encrypted notebooks
    await this.saveUserNotebooks(userId, userNotebooks);

    console.log(`✅ Notebook ${id} deleted for user ${userId}`);
    return true;
  }

  /**
   * Search notebooks for a user
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Filtered notebooks
   */
  async searchNotebooks(userId, query, filters = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userNotebooks = await this.getAllNotebooks(userId);

    const searchTerm = (query || '').toLowerCase();
    const { type, category, tags, difficulty } = filters;

    const results = userNotebooks.filter(notebook => {
      // Text search
      const matchesSearch = !searchTerm ||
        notebook.title.toLowerCase().includes(searchTerm) ||
        notebook.content.toLowerCase().includes(searchTerm) ||
        notebook.category.toLowerCase().includes(searchTerm) ||
        (notebook.tags && notebook.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

      // Type filter
      const matchesType = !type || type === 'all' || notebook.type === type;

      // Category filter
      const matchesCategory = !category || category === 'all' || notebook.category === category;

      // Difficulty filter
      const matchesDifficulty = !difficulty || difficulty === 'all' || notebook.difficulty === difficulty;

      // Tags filter
      const matchesTags = !tags || tags.length === 0 ||
        (notebook.tags && tags.some(tag => notebook.tags.includes(tag)));

      return matchesSearch && matchesType && matchesCategory && matchesDifficulty && matchesTags;
    });

    return results;
  }

  /**
   * Get notebooks by type for a user
   * @param {string} userId - User ID
   * @param {string} type - Notebook type
   * @returns {Promise<Array>} Filtered notebooks
   */
  async getNotebooksByType(userId, type) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userNotebooks = await this.getAllNotebooks(userId);
    return userNotebooks.filter(notebook => notebook.type === type);
  }

  /**
   * Get notebooks by category for a user
   * @param {string} userId - User ID
   * @param {string} category - Notebook category
   * @returns {Promise<Array>} Filtered notebooks
   */
  async getNotebooksByCategory(userId, category) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userNotebooks = await this.getAllNotebooks(userId);
    return userNotebooks.filter(notebook => notebook.category === category);
  }

  /**
   * Link vocabulary to notebook (with ownership check)
   * @param {string} userId - User ID
   * @param {string} notebookId - Notebook ID
   * @param {string|Array} vocabIds - Vocabulary IDs to link
   * @returns {Promise<Object>} Updated notebook
   */
  async linkVocabulary(userId, notebookId, vocabIds) {
    if (!userId || !notebookId) {
      throw new Error('User ID and Notebook ID are required');
    }

    const existing = await this.getNotebook(userId, notebookId);
    if (!existing) {
      throw new Error('Notebook not found or access denied');
    }

    // Merge new vocabulary IDs with existing ones, avoiding duplicates
    const existingVocabIds = existing.vocabularyIds || [];
    const newVocabIds = Array.isArray(vocabIds) ? vocabIds : [vocabIds];
    const mergedVocabIds = [...new Set([...existingVocabIds, ...newVocabIds])];

    return await this.updateNotebook(userId, notebookId, {
      vocabularyIds: mergedVocabIds
    });
  }

  /**
   * Unlink vocabulary from notebook (with ownership check)
   * @param {string} userId - User ID
   * @param {string} notebookId - Notebook ID
   * @param {string|Array} vocabIds - Vocabulary IDs to unlink
   * @returns {Promise<Object>} Updated notebook
   */
  async unlinkVocabulary(userId, notebookId, vocabIds) {
    if (!userId || !notebookId) {
      throw new Error('User ID and Notebook ID are required');
    }

    const existing = await this.getNotebook(userId, notebookId);
    if (!existing) {
      throw new Error('Notebook not found or access denied');
    }

    const existingVocabIds = existing.vocabularyIds || [];
    const idsToRemove = Array.isArray(vocabIds) ? vocabIds : [vocabIds];
    const filteredVocabIds = existingVocabIds.filter(id => !idsToRemove.includes(id));

    return await this.updateNotebook(userId, notebookId, {
      vocabularyIds: filteredVocabIds
    });
  }

  /**
   * Get linked vocabulary from notebook (with ownership check)
   * @param {string} userId - User ID
   * @param {string} notebookId - Notebook ID
   * @returns {Promise<Array>} Vocabulary IDs
   */
  async getLinkedVocabulary(userId, notebookId) {
    if (!userId || !notebookId) {
      throw new Error('User ID and Notebook ID are required');
    }

    const notebook = await this.getNotebook(userId, notebookId);
    if (!notebook) {
      throw new Error('Notebook not found or access denied');
    }

    return notebook.vocabularyIds || [];
  }

  /**
   * Update practice score (with ownership check)
   * @param {string} userId - User ID
   * @param {string} notebookId - Notebook ID
   * @param {number} score - Practice score (1-5)
   * @returns {Promise<Object>} Updated notebook
   */
  async updatePractice(userId, notebookId, score) {
    if (!userId || !notebookId) {
      throw new Error('User ID and Notebook ID are required');
    }

    const existing = await this.getNotebook(userId, notebookId);
    if (!existing) {
      throw new Error('Notebook not found or access denied');
    }

    // Update mastery based on practice score (1-5)
    let newMasteryLevel = existing.masteryLevel;
    const newPracticeCount = existing.practiceCount + 1;

    if (score >= 3) {
      newMasteryLevel = Math.min(5, newMasteryLevel + 1);
    } else {
      newMasteryLevel = Math.max(0, newMasteryLevel - 1);
    }

    return await this.updateNotebook(userId, notebookId, {
      masteryLevel: newMasteryLevel,
      practiceCount: newPracticeCount,
      lastPracticed: new Date().toISOString()
    });
  }

  /**
   * Get notebook statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notebook statistics
   */
  async getNotebookStats(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const all = await this.getAllNotebooks(userId);
    const stats = {
      total: all.length,
      byType: {},
      byCategory: {},
      byDifficulty: {},
      masteryDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      averageMastery: 0,
      totalPractices: 0,
      recentlyActive: 0
    };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    all.forEach(notebook => {
      stats.byType[notebook.type] = (stats.byType[notebook.type] || 0) + 1;
      stats.byCategory[notebook.category] = (stats.byCategory[notebook.category] || 0) + 1;
      stats.byDifficulty[notebook.difficulty] = (stats.byDifficulty[notebook.difficulty] || 0) + 1;
      stats.masteryDistribution[notebook.masteryLevel] = (stats.masteryDistribution[notebook.masteryLevel] || 0) + 1;
      stats.averageMastery += notebook.masteryLevel;
      stats.totalPractices += notebook.practiceCount;

      const updatedDate = new Date(notebook.updatedAt);
      if (updatedDate > oneWeekAgo) {
        stats.recentlyActive++;
      }
    });

    stats.averageMastery = all.length > 0 ? Math.round(stats.averageMastery / all.length) : 0;

    return stats;
  }

  /**
   * Get recent notebooks for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Recent notebooks
   */
  async getRecentNotebooks(userId, days = 7) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const all = await this.getAllNotebooks(userId);

    return all
      .filter(notebook => new Date(notebook.updatedAt) > cutoffDate)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Export user's notebooks
   * @param {string} userId - User ID
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<Object>} Export result
   */
  async exportNotebooks(userId, format = 'json') {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const all = await this.getAllNotebooks(userId);

    if (format === 'json') {
      return {
        exportDate: new Date().toISOString(),
        totalEntries: all.length,
        notebooks: all
      };
    } else if (format === 'csv') {
      const headers = ['id', 'title', 'type', 'category', 'difficulty', 'createdAt', 'updatedAt', 'masteryLevel', 'practiceCount'];
      const csvRows = [headers.join(',')];

      all.forEach(notebook => {
        const row = headers.map(header => {
          const value = notebook[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(row.join(','));
      });

      return csvRows.join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Import notebooks for a user
   * @param {string} userId - User ID
   * @param {Object|Array} data - Data to import
   * @param {string} format - Import format (json)
   * @returns {Promise<Object>} Import result
   */
  async importNotebooks(userId, data, format = 'json') {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let notebooksToAdd = [];

    if (format === 'json') {
      if (Array.isArray(data)) {
        notebooksToAdd = data;
      } else if (data.notebooks && Array.isArray(data.notebooks)) {
        notebooksToAdd = data.notebooks;
      } else {
        throw new Error('Invalid JSON format for notebooks import');
      }
    } else {
      throw new Error(`Unsupported import format: ${format}`);
    }

    // Load user's existing notebooks
    const userNotebooks = await this.loadUserNotebooks(userId);

    let addedCount = 0;
    let skippedCount = 0;

    for (const notebookData of notebooksToAdd) {
      try {
        const existing = Object.values(userNotebooks).find(
          n => n.title === notebookData.title && n.type === notebookData.type
        );

        if (existing) {
          skippedCount++;
          continue;
        }

        const notebook = {
          id: crypto.randomBytes(8).toString('hex'),
          userId: userId,
          title: notebookData.title || 'Untitled Entry',
          content: notebookData.content || '',
          type: notebookData.type || 'note',
          category: notebookData.category || 'general',
          tags: notebookData.tags || [],
          vocabularyIds: notebookData.vocabularyIds || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          difficulty: notebookData.difficulty || 'beginner',
          masteryLevel: notebookData.masteryLevel || 0,
          practiceCount: notebookData.practiceCount || 0,
          lastPracticed: notebookData.lastPracticed || null,
          metadata: notebookData.metadata || {}
        };

        userNotebooks[notebook.id] = notebook;
        addedCount++;
      } catch (error) {
        console.error('Error importing notebook entry:', error);
        skippedCount++;
      }
    }

    await this.saveUserNotebooks(userId, userNotebooks);

    return {
      added: addedCount,
      skipped: skippedCount,
      total: notebooksToAdd.length
    };
  }

  /**
   * Create exercise-type notebook entry
   * @param {string} userId - User ID
   * @param {Object} exerciseData - Exercise data
   * @returns {Promise<Object>} Created notebook
   */
  async createExercise(userId, exerciseData) {
    return this.createNotebook(userId, {
      ...exerciseData,
      type: 'exercise',
      category: exerciseData.category || 'practice'
    });
  }

  /**
   * Create guide-type notebook entry
   * @param {string} userId - User ID
   * @param {Object} guideData - Guide data
   * @returns {Promise<Object>} Created notebook
   */
  async createGuide(userId, guideData) {
    return this.createNotebook(userId, {
      ...guideData,
      type: 'guide',
      category: guideData.category || 'study'
    });
  }

  /**
   * Get exercises for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Exercise notebooks
   */
  async getExercises(userId) {
    return this.getNotebooksByType(userId, 'exercise');
  }

  /**
   * Get guides for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Guide notebooks
   */
  async getGuides(userId) {
    return this.getNotebooksByType(userId, 'guide');
  }

  /**
   * Delete all notebooks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAllUserNotebooks(userId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userNotebooks = await this.getAllNotebooks(userId);
    const count = userNotebooks.length;

    const filePath = this.getUserFilePath(userId);
    try {
      await fs.unlink(filePath);
      console.log(`✅ Deleted all ${count} notebooks for user ${userId}`);

      return {
        success: true,
        message: `Successfully deleted ${count} notebook(s)`,
        count
      };
    } catch (error) {
      console.error('Error deleting user notebooks:', error);
      return {
        success: false,
        message: 'Failed to delete notebooks'
      };
    }
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

    const notebooks = await this.getAllNotebooks(userId);

    return {
      userId,
      notebookCount: notebooks.length,
      total: notebooks.length
    };
  }
}

// Singleton instance
module.exports = NotebookService;