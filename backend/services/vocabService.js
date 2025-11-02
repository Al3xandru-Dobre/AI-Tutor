const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VocabularyService {
  constructor() {
    this.vocabulary = new Map();
    this.vocabularyPath = path.join(__dirname, '../data/vocabulary');
    this.vocabularyFilePath = path.join(this.vocabularyPath, 'vocabulary.json');
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(this.vocabularyPath, { recursive: true });
      await this.loadVocabulary();
      this.isInitialized = true;
      console.log('Vocabulary Service initialized.');
      console.log(`  Loaded ${this.vocabulary.size} vocabulary entries.`);
    } catch (error) {
      console.error('Vocabulary Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  async loadVocabulary() {
    try {
      const data = await fs.readFile(this.vocabularyFilePath, 'utf-8');
      const parsedData = JSON.parse(data);
      this.vocabulary = new Map(Object.entries(parsedData));
      console.log(`Loaded ${this.vocabulary.size} vocabulary entries.`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No vocabulary file found. Starting fresh.');
        this.vocabulary = new Map();
        await this.saveVocabulary();
      } else {
        console.error('Error loading vocabulary:', error);
      }
    }
  }

  async saveVocabulary() {
    try {
      const dataToSave = JSON.stringify(Object.fromEntries(this.vocabulary), null, 2);
      await fs.writeFile(this.vocabularyFilePath, dataToSave, 'utf-8');
    } catch (error) {
      console.error('Error saving vocabulary:', error);
    }
  }

  async addVocabulary(vocabData) {
    if (!this.isInitialized) await this.initialize();

    const vocabulary = {
      id: crypto.randomBytes(8).toString('hex'),
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
      easeFactor: vocabData.easeFactor || 2.5,  // SM-2 default (range 1.3-2.5)
      interval: vocabData.interval || 0,         // Days until next review
      nextReviewDate: vocabData.nextReviewDate || null,  // Exact next review date
      lapses: vocabData.lapses || 0,             // Failed review count
      // AI integration fields
      conversationId: vocabData.conversationId || null,  // Source conversation
      extractedBy: vocabData.extractedBy || 'manual',    // 'manual' | 'ai' | 'hybrid'
      confidence: vocabData.confidence || 1.0    // AI extraction confidence (0-1)
    };

    this.vocabulary.set(vocabulary.id, vocabulary);
    await this.saveVocabulary();
    return vocabulary;
  }

  async getVocabulary(id) {
    if (!this.isInitialized) await this.initialize();
    return this.vocabulary.get(id);
  }

  async getAllVocabulary() {
    if (!this.isInitialized) await this.initialize();
    return Array.from(this.vocabulary.values());
  }

  async updateVocabulary(id, updates) {
    if (!this.isInitialized) await this.initialize();

    const existing = this.vocabulary.get(id);
    if (!existing) {
      throw new Error('Vocabulary entry not found');
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      addedDate: existing.addedDate, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    this.vocabulary.set(id, updated);
    await this.saveVocabulary();
    return updated;
  }

  async deleteVocabulary(id) {
    if (!this.isInitialized) await this.initialize();

    const deleted = this.vocabulary.delete(id);
    if (deleted) {
      await this.saveVocabulary();
    }
    return deleted;
  }

  async searchVocabulary(query, filters = {}) {
    if (!this.isInitialized) await this.initialize();

    const searchTerm = (query || '').toLowerCase();
    const { level, type, tags } = filters;

    const results = Array.from(this.vocabulary.values()).filter(word => {
      // Text search
      const matchesSearch = !searchTerm || 
        word.japanese.includes(searchTerm) ||
        word.romaji.toLowerCase().includes(searchTerm) ||
        word.english.toLowerCase().includes(searchTerm) ||
        word.notes.toLowerCase().includes(searchTerm);

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

  async getVocabularyByLevel(level) {
    if (!this.isInitialized) await this.initialize();
    return Array.from(this.vocabulary.values()).filter(word => word.level === level);
  }

  async getVocabularyByType(type) {
    if (!this.isInitialized) await this.initialize();
    return Array.from(this.vocabulary.values()).filter(word => word.type === type);
  }

  async updateMastery(id, score) {
    if (!this.isInitialized) await this.initialize();

    const existing = this.vocabulary.get(id);
    if (!existing) {
      throw new Error('Vocabulary entry not found');
    }

    // SM-2 Spaced Repetition Algorithm (full implementation)
    // Score: 0-5 (0=blackout, 1-2=incorrect, 3=difficult, 4=hesitation, 5=perfect)

    let newReviewCount = existing.reviewCount + 1;
    let newEaseFactor = existing.easeFactor || 2.5;
    let newInterval = existing.interval || 0;
    let newLapses = existing.lapses || 0;
    let newMasteryLevel = existing.masteryLevel || 0;

    if (score >= 3) {
      // Successful recall
      if (newReviewCount === 1) {
        newInterval = 1;  // First review: 1 day
        newMasteryLevel = 1;
      } else if (newReviewCount === 2) {
        newInterval = 6;  // Second review: 6 days
        newMasteryLevel = 6;
      } else {
        // Subsequent reviews: multiply by ease factor
        newInterval = Math.round(newInterval * newEaseFactor);
        newMasteryLevel = newInterval;
      }

      // Adjust ease factor based on performance
      // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      newEaseFactor = newEaseFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));

      // Ensure ease factor stays within bounds (minimum 1.3)
      if (newEaseFactor < 1.3) {
        newEaseFactor = 1.3;
      }
    } else {
      // Failed recall (score < 3)
      newInterval = 1;  // Reset to 1 day
      newLapses++;      // Increment lapse count
      newMasteryLevel = 0;  // Reset mastery
      // Note: ease factor is NOT changed on failure (per SM-2)
    }

    // Calculate next review date
    const now = new Date();
    const nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    const updated = {
      ...existing,
      reviewCount: newReviewCount,
      easeFactor: newEaseFactor,
      interval: newInterval,
      nextReviewDate: nextReviewDate.toISOString(),
      lapses: newLapses,
      masteryLevel: newMasteryLevel,
      lastReviewed: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.vocabulary.set(id, updated);
    await this.saveVocabulary();
    return updated;
  }

  async getDueForReview(options = {}) {
    if (!this.isInitialized) await this.initialize();

    const {
      maxNewCards = 20,      // Daily limit for new cards
      maxReviews = 100,      // Daily limit for reviews
      includeLeeches = true  // Include cards with lapses >= 8
    } = options;

    const now = new Date();

    // Filter cards due for review
    const dueCards = Array.from(this.vocabulary.values()).filter(word => {
      // Never reviewed - new card
      if (!word.nextReviewDate) return true;

      // Check if review date has passed
      const nextReview = new Date(word.nextReviewDate);
      const isDue = now >= nextReview;

      // Filter out leeches if requested (lapses >= 8)
      if (!includeLeeches && (word.lapses || 0) >= 8) {
        return false;
      }

      return isDue;
    });

    // Separate new cards from reviews
    const newCards = dueCards.filter(word => !word.lastReviewed);
    const reviewCards = dueCards.filter(word => word.lastReviewed);

    // Apply limits
    const limitedNewCards = newCards.slice(0, maxNewCards);
    const limitedReviewCards = reviewCards.slice(0, maxReviews);

    return [...limitedReviewCards, ...limitedNewCards];
  }

  async getVocabularyStats() {
    if (!this.isInitialized) await this.initialize();

    const all = Array.from(this.vocabulary.values());
    const stats = {
      total: all.length,
      byLevel: {},
      byType: {},
      masteryDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      dueForReview: 0,
      averageMastery: 0,
      // SM-2 specific stats
      averageEaseFactor: 0,
      averageInterval: 0,
      totalLapses: 0,
      leechCount: 0,
      // AI extraction stats
      bySource: {
        manual: 0,
        ai: 0,
        hybrid: 0
      },
      averageConfidence: 0,
      // Review stats
      newCards: 0,
      learning: 0,
      mature: 0  // Cards with interval >= 21 days
    };

    let totalEaseFactor = 0;
    let totalInterval = 0;
    let totalConfidence = 0;
    let cardsWithReviews = 0;

    all.forEach(word => {
      // By level
      stats.byLevel[word.level] = (stats.byLevel[word.level] || 0) + 1;

      // By type
      stats.byType[word.type] = (stats.byType[word.type] || 0) + 1;

      // Mastery distribution
      const mastery = Math.min(5, Math.floor(word.masteryLevel / 2));
      stats.masteryDistribution[mastery] = (stats.masteryDistribution[mastery] || 0) + 1;

      // Average mastery
      stats.averageMastery += word.masteryLevel;

      // SM-2 stats
      totalEaseFactor += word.easeFactor || 2.5;
      totalInterval += word.interval || 0;
      stats.totalLapses += word.lapses || 0;

      // Leech detection (lapses >= 8)
      if ((word.lapses || 0) >= 8) {
        stats.leechCount++;
      }

      // AI extraction source
      const source = word.extractedBy || 'manual';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      totalConfidence += word.confidence || 1.0;

      // Card maturity
      if (!word.lastReviewed) {
        stats.newCards++;
      } else if ((word.interval || 0) < 21) {
        stats.learning++;
        cardsWithReviews++;
      } else {
        stats.mature++;
        cardsWithReviews++;
      }
    });

    // Calculate due for review
    const dueForReview = await this.getDueForReview();
    stats.dueForReview = dueForReview.length;

    // Calculate averages
    stats.averageMastery = all.length > 0 ? Math.round(stats.averageMastery / all.length) : 0;
    stats.averageEaseFactor = all.length > 0 ? (totalEaseFactor / all.length).toFixed(2) : 2.5;
    stats.averageInterval = all.length > 0 ? Math.round(totalInterval / all.length) : 0;
    stats.averageConfidence = all.length > 0 ? (totalConfidence / all.length).toFixed(2) : 1.0;

    // Retention rate (% of cards not leeches among reviewed cards)
    stats.retentionRate = cardsWithReviews > 0
      ? (((cardsWithReviews - stats.leechCount) / cardsWithReviews) * 100).toFixed(1) + '%'
      : 'N/A';

    return stats;
  }

  async exportVocabulary(format = 'json') {
    if (!this.isInitialized) await this.initialize();

    const all = Array.from(this.vocabulary.values());
    
    if (format === 'json') {
      return {
        exportDate: new Date().toISOString(),
        totalEntries: all.length,
        vocabulary: all
      };
    } else if (format === 'csv') {
      const headers = ['id', 'japanese', 'romaji', 'english', 'level', 'type', 'example', 'notes', 'addedDate', 'reviewCount', 'masteryLevel'];
      const csvRows = [headers.join(',')];
      
      all.forEach(word => {
        const row = headers.map(header => {
          const value = word[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  async importVocabulary(data, format = 'json') {
    if (!this.isInitialized) await this.initialize();

    let vocabularyToAdd = [];
    
    if (format === 'json') {
      if (Array.isArray(data)) {
        vocabularyToAdd = data;
      } else if (data.vocabulary && Array.isArray(data.vocabulary)) {
        vocabularyToAdd = data.vocabulary;
      } else {
        throw new Error('Invalid JSON format for vocabulary import');
      }
    } else {
      throw new Error(`Unsupported import format: ${format}`);
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const vocabData of vocabularyToAdd) {
      try {
        // Check if vocabulary already exists (by japanese + english)
        const existing = Array.from(this.vocabulary.values()).find(
          v => v.japanese === vocabData.japanese && v.english === vocabData.english
        );

        if (existing) {
          skippedCount++;
          continue;
        }

        // Add new vocabulary with generated ID
        const vocabulary = {
          id: crypto.randomBytes(8).toString('hex'),
          japanese: vocabData.japanese || '',
          romaji: vocabData.romaji || '',
          english: vocabData.english || '',
          level: vocabData.level || 'N5',
          type: vocabData.type || 'noun',
          example: vocabData.example || '',
          notes: vocabData.notes || '',
          addedDate: new Date().toISOString(),
          reviewCount: vocabData.reviewCount || 0,
          masteryLevel: vocabData.masteryLevel || 0,
          lastReviewed: vocabData.lastReviewed || null,
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

        this.vocabulary.set(vocabulary.id, vocabulary);
        addedCount++;
      } catch (error) {
        console.error('Error importing vocabulary entry:', error);
        skippedCount++;
      }
    }

    await this.saveVocabulary();
    
    return {
      added: addedCount,
      skipped: skippedCount,
      total: vocabularyToAdd.length
    };
  }

  /**
   * Get leech cards (cards with lapses >= threshold)
   * Leeches are cards that have been failed many times and may need special attention
   */
  async getLeeches(threshold = 8) {
    if (!this.isInitialized) await this.initialize();

    return Array.from(this.vocabulary.values()).filter(word => {
      return (word.lapses || 0) >= threshold;
    }).sort((a, b) => (b.lapses || 0) - (a.lapses || 0)); // Sort by lapses descending
  }

  /**
   * Get cards by extraction source
   */
  async getVocabularyBySource(extractedBy) {
    if (!this.isInitialized) await this.initialize();

    return Array.from(this.vocabulary.values()).filter(word =>
      word.extractedBy === extractedBy
    );
  }

  /**
   * Get cards from a specific conversation
   */
  async getVocabularyByConversation(conversationId) {
    if (!this.isInitialized) await this.initialize();

    return Array.from(this.vocabulary.values()).filter(word =>
      word.conversationId === conversationId
    );
  }
}

module.exports = VocabularyService;