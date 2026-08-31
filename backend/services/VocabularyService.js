const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { encryptVocabulary, decryptVocabulary } = require('../utils/encryption');

class VocabularyService {
  constructor() {
    this.isInitialized = false;
    this.vocabularyPath = path.join(__dirname, '../data/vocabulary');
  }

  /**
   * Get user-specific vocabulary file path
   * @param {string} userId - User ID
   * @returns {string} File path
   */
  getUserFilePath(userId) {
    return path.join(this.vocabularyPath, `vocabulary-${userId}.json`);
  }

  /**
   * Initialize vocabulary service
   */
  async initialize() {
    try {
      await fs.mkdir(this.vocabularyPath, { recursive: true });
      this.isInitialized = true;
      console.log('Vocabulary Service initialized with encryption support.');
    } catch (error) {
      console.error('Vocabulary Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load user's encrypted vocabulary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's vocabulary
   */
  async loadUserVocabulary(userId) {
    try {
      const filePath = this.getUserFilePath(userId);
      const data = await fs.readFile(filePath, 'utf-8');
      const encryptedPackage = JSON.parse(data);
      
      // Decrypt vocabulary
      const decryptedData = decryptVocabulary(encryptedPackage, userId);
      
      return decryptedData || {};
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No vocabulary file found for user ${userId}. Starting fresh.`);
        return {};
      } else {
        console.error(`Error loading vocabulary for user ${userId}:`, error);
        return {};
      }
    }
  }

  /**
   * Save user's encrypted vocabulary
   * @param {string} userId - User ID
   * @param {Object} vocabulary - Vocabulary object
   * @returns {Promise<boolean>} Success status
   */
  async saveUserVocabulary(userId, vocabulary) {
    try {
      const filePath = this.getUserFilePath(userId);
      
      // Encrypt vocabulary
      const encryptedPackage = encryptVocabulary(vocabulary, userId);
      
      // Save to file
      const dataToSave = JSON.stringify(encryptedPackage, null, 2);
      await fs.writeFile(filePath, dataToSave, 'utf-8');
      
      return true;
    } catch (error) {
      console.error(`Error saving vocabulary for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Add a vocabulary entry for user
   * @param {string} userId - User ID
   * @param {Object} vocabData - Vocabulary data
   * @returns {Promise<Object>} Created vocabulary entry
   */
  async addVocabulary(userId, vocabData) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Load user's existing vocabulary
    const userVocabulary = await this.loadUserVocabulary(userId);

    // Create new vocabulary entry
    const vocabId = crypto.randomBytes(8).toString('hex');
    const vocabulary = {
      id: vocabId,
      userId: userId, // Add userId for ownership verification
      japanese: vocabData.japanese || '',
      romaji: vocabData.romaji || '',
      english: vocabData.english || '',
      level: vocabData.level || 'N5',
      type: vocabData.type || 'noun',
      example: vocabData.example || '',
      notes: vocabData.notes || '',
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      masteryLevel: 0,
      lastReviewed: null,
      tags: vocabData.tags || [],
      // SM-2 Algorithm fields
      easeFactor: vocabData.easeFactor || 2.5,
      interval: vocabData.interval || 0,
      nextReviewDate: vocabData.nextReviewDate || null,
      lapses: vocabData.lapses || 0,
      // AI integration fields
      conversationId: vocabData.conversationId || null,
      extractedBy: vocabData.extractedBy || 'manual',
      confidence: vocabData.confidence || 1.0
    };

    userVocabulary[vocabId] = vocabulary;

    // Save encrypted vocabulary
    await this.saveUserVocabulary(userId, userVocabulary);

    return vocabulary;
  }

  /**
   * Get a specific vocabulary entry for a user (with ownership check)
   * @param {string} userId - User ID
   * @param {string} vocabId - Vocabulary ID
   * @returns {Promise<Object|null>} Vocabulary object or null
   */
  async getVocabulary(userId, vocabId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !vocabId) {
      throw new Error('User ID and Vocabulary ID are required');
    }

    const userVocabulary = await this.loadUserVocabulary(userId);
    const vocabulary = userVocabulary[vocabId];

    // Ownership check
    if (!vocabulary || vocabulary.userId !== userId) {
      console.warn(`User ${userId} attempted to access vocabulary ${vocabId} (owned by ${vocabulary?.userId})`);
      return null;
    }

    return vocabulary;
  }

  /**
   * Get all vocabulary for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of vocabulary
   */
  async getUserVocabulary(userId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userVocabulary = await this.loadUserVocabulary(userId);
    
    // Convert to array and sort by addedDate
    return Object.values(userVocabulary)
      .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
  }

  /**
   * Update a vocabulary entry (with ownership check)
   * @param {string} userId - User ID
   * @param {string} vocabId - Vocabulary ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated vocabulary
   */
  async updateVocabulary(userId, vocabId, updates) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !vocabId) {
      throw new Error('User ID and Vocabulary ID are required');
    }

    const userVocabulary = await this.loadUserVocabulary(userId);
    const vocabulary = userVocabulary[vocabId];

    // Ownership check
    if (!vocabulary || vocabulary.userId !== userId) {
      throw new Error('Vocabulary not found or access denied');
    }

    // Update allowed fields
    const updated = {
      ...vocabulary,
      ...updates,
      id: vocabId, // Preserve ID
      userId: vocabulary.userId, // Preserve userId
      addedDate: vocabulary.addedDate // Preserve creation date
    };

    userVocabulary[vocabId] = updated;

    // Save encrypted vocabulary
    await this.saveUserVocabulary(userId, userVocabulary);

    return updated;
  }

  /**
   * Update mastery level (SM-2 algorithm)
   * @param {string} userId - User ID
   * @param {string} vocabId - Vocabulary ID
   * @param {number} score - Practice score (1-5)
   * @returns {Promise<Object>} Updated vocabulary
   */
  async updateMastery(userId, vocabId, score) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !vocabId) {
      throw new Error('User ID and Vocabulary ID are required');
    }

    const vocabulary = await this.getVocabulary(userId, vocabId);
    if (!vocabulary) {
      throw new Error('Vocabulary not found or access denied');
    }

    // SM-2 Spaced Repetition Algorithm (simplified)
    let newReviewCount = vocabulary.reviewCount + 1;
    let newEaseFactor = vocabulary.easeFactor || 2.5;
    let newInterval = vocabulary.interval || 0;
    let newLapses = vocabulary.lapses || 0;
    let newMasteryLevel = vocabulary.masteryLevel || 0;

    if (score >= 3) {
      // Successful recall
      if (newReviewCount === 1) {
        newInterval = 1;
        newMasteryLevel = 1;
      } else if (newReviewCount === 2) {
        newInterval = 6;
        newMasteryLevel = 6;
      } else {
        // Subsequent reviews: multiply by ease factor
        newInterval = Math.round(newInterval * newEaseFactor);
        newMasteryLevel = newInterval;
      }
    } else {
      // Failed recall (score < 3)
      newInterval = 1;
      newLapses++;
      newMasteryLevel = 0;
    }

    // Adjust ease factor based on performance
    newEaseFactor = newEaseFactor + (0.1 - (5 - score) * 0.08);
    newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum 1.3

    // Calculate next review date
    const now = new Date();
    const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    return await this.updateVocabulary(userId, vocabId, {
      reviewCount: newReviewCount,
      easeFactor: newEaseFactor,
      interval: newInterval,
      nextReviewDate: nextReviewDate.toISOString(),
      lapses: newLapses,
      masteryLevel: newMasteryLevel,
      lastReviewed: now.toISOString()
    });
  }

  /**
   * Delete a vocabulary entry (with ownership check)
   * @param {string} userId - User ID
   * @param {string} vocabId - Vocabulary ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteVocabulary(userId, vocabId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId || !vocabId) {
      throw new Error('User ID and Vocabulary ID are required');
    }

    const userVocabulary = await this.loadUserVocabulary(userId);
    const vocabulary = userVocabulary[vocabId];

    // Ownership check
    if (!vocabulary || vocabulary.userId !== userId) {
      console.warn(`User ${userId} attempted to delete vocabulary ${vocabId} (owned by ${vocabulary?.userId})`);
      return false;
    }

    delete userVocabulary[vocabId];

    // Save encrypted vocabulary
    await this.saveUserVocabulary(userId, userVocabulary);

    console.log(`✅ Vocabulary ${vocabId} deleted for user ${userId}`);
    return true;
  }

  /**
   * Delete all vocabulary for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUserVocabulary(userId) {
    if (!this.isInitialized) await this.initialize();
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Delete user's vocabulary file
    const filePath = this.getUserFilePath(userId);
    try {
      await fs.unlink(filePath);
      console.log(`✅ Deleted all vocabulary for user ${userId}`);
      
      return {
        success: true,
        message: 'All vocabulary deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user vocabulary:', error);
      return {
        success: false,
        message: 'Failed to delete vocabulary'
      };
    }
  }

  /**
   * Search vocabulary for a user
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Filtered vocabulary
   */
  async searchUserVocabulary(userId, query, filters = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userVocabulary = await this.getUserVocabulary(userId);

    const searchTerm = (query || '').toLowerCase();
    const { level, type, tags } = filters;

    const results = userVocabulary.filter(word => {
      // Text search
      const matchesSearch = !searchTerm || 
        word.japanese.includes(searchTerm) ||
        word.romaji.toLowerCase().includes(searchTerm) ||
        word.english.toLowerCase().includes(searchTerm) ||
        word.notes.toLowerCase().includes(searchTerm) ||
        (word.tags && word.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

      // Level filter
      const matchesLevel = !level || level === 'all' || word.level === level;

      // Type filter
      const matchesType = !type || type === 'all' || word.type === type;

      // Tags filter
      const matchesTags = !tags || tags.length === 0 || 
        (word.tags && tags.some(tag => word.tags.includes(tag)));

      return matchesSearch && matchesLevel && matchesType && matchesTags;
    });

    return results;
  }

  /**
   * Get vocabulary by level for a user
   * @param {string} userId - User ID
   * @param {string} level - Vocabulary level
   * @returns {Promise<Array>} Filtered vocabulary
   */
  async getUserVocabularyByLevel(userId, level) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userVocabulary = await this.getUserVocabulary(userId);
    return userVocabulary.filter(word => word.level === level);
  }

  /**
   * Get vocabulary by type for a user
   * @param {string} userId - User ID
   * @param {string} type - Vocabulary type
   * @returns {Promise<Array>} Filtered vocabulary
   */
  async getUserVocabularyByType(userId, type) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userVocabulary = await this.getUserVocabulary(userId);
    return userVocabulary.filter(word => word.type === type);
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

    const vocabulary = await this.getUserVocabulary(userId);

    const stats = {
      userId,
      total: vocabulary.length,
      byLevel: {},
      byType: {},
      byMastery: {},
      averageMastery: 0,
      dueForReview: 0,
      leeches: 0
    };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    vocabulary.forEach(word => {
      // By level
      stats.byLevel[word.level] = (stats.byLevel[word.level] || 0) + 1;

      // By type
      stats.byType[word.type] = (stats.byType[word.type] || 0) + 1;

      // By mastery (grouped: 0, 1, 2, 3, 4, 5)
      const mastery = Math.min(5, Math.floor(word.masteryLevel / 2));
      stats.byMastery[mastery] = (stats.byMastery[mastery] || 0) + 1;

      // Average mastery
      stats.averageMastery += word.masteryLevel;

      // Due for review
      if (word.nextReviewDate && new Date(word.nextReviewDate) <= oneWeekAgo) {
        stats.dueForReview++;
      }

      // Leech detection (lapses >= 8)
      if (word.lapses >= 8) {
        stats.leeches++;
      }
    });

    stats.averageMastery = vocabulary.length > 0 ? Math.round(stats.averageMastery / vocabulary.length) : 0;

    return stats;
  }

  /**
   * Get vocabulary due for review for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Vocabulary due for review
   */
  async getUserVocabularyDueForReview(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const vocabulary = await this.getUserVocabulary(userId);
    const now = new Date();

    return vocabulary.filter(word => {
      if (!word.nextReviewDate) return false;
      return new Date(word.nextReviewDate) <= now;
    }).sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
  }

  /**
   * Export user's vocabulary
   * @param {string} userId - User ID
   * @param {string} format - Export format (json)
   * @returns {Promise<Object>} Export result
   */
  async exportUserVocabulary(userId, format = 'json') {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const vocabulary = await this.getUserVocabulary(userId);

    if (vocabulary.length === 0) {
      return {
        success: false,
        message: 'No vocabulary to export'
      };
    }

    if (format === 'json') {
      return {
        success: true,
        exportDate: new Date().toISOString(),
        totalEntries: vocabulary.length,
        vocabulary: vocabulary
      };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

// Singleton instance
const vocabularyService = new VocabularyService();

module.exports = vocabularyService;


const vocabularyService = new VocabularyService();

module.exports = vocabularyService;
