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
      tags: vocabData.tags || []
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

    // SM-2 Spaced Repetition Algorithm (simplified)
    let newMasteryLevel = existing.masteryLevel;
    let newReviewCount = existing.reviewCount + 1;

    if (score >= 3) { // Good response
      if (newReviewCount === 1) {
        newMasteryLevel = 1;
      } else if (newReviewCount === 2) {
        newMasteryLevel = 6;
      } else {
        newMasteryLevel = Math.round(newMasteryLevel * score);
      }
    } else { // Poor response
      newMasteryLevel = 0;
    }

    const updated = {
      ...existing,
      masteryLevel: newMasteryLevel,
      reviewCount: newReviewCount,
      lastReviewed: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.vocabulary.set(id, updated);
    await this.saveVocabulary();
    return updated;
  }

  async getDueForReview() {
    if (!this.isInitialized) await this.initialize();

    const now = new Date();
    return Array.from(this.vocabulary.values()).filter(word => {
      if (!word.lastReviewed) return true; // Never reviewed
      
      const lastReviewed = new Date(word.lastReviewed);
      const daysSinceReview = Math.floor((now - lastReviewed) / (1000 * 60 * 60 * 24));
      
      // Review interval based on mastery level
      const reviewInterval = Math.max(1, word.masteryLevel);
      
      return daysSinceReview >= reviewInterval;
    });
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
      averageMastery: 0
    };

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
    });

    // Calculate due for review
    const dueForReview = await this.getDueForReview();
    stats.dueForReview = dueForReview.length;

    // Finalize average mastery
    stats.averageMastery = all.length > 0 ? Math.round(stats.averageMastery / all.length) : 0;

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
          tags: vocabData.tags || []
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
}

module.exports = VocabularyService;