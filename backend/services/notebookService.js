const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class NotebookService {
  constructor() {
    this.notebooks = new Map();
    this.notebooksPath = path.join(__dirname, '../data/notebooks');
    this.notebooksFilePath = path.join(this.notebooksPath, 'notebooks.json');
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(this.notebooksPath, { recursive: true });
      await this.loadNotebooks();
      this.isInitialized = true;
      console.log('Notebook Service initialized.');
      console.log(`  Loaded ${this.notebooks.size} notebook entries.`);
    } catch (error) {
      console.error('Notebook Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  async loadNotebooks() {
    try {
      const data = await fs.readFile(this.notebooksFilePath, 'utf-8');
      const parsedData = JSON.parse(data);
      this.notebooks = new Map(Object.entries(parsedData));
      console.log(`Loaded ${this.notebooks.size} notebook entries.`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No notebooks file found. Starting fresh.');
        this.notebooks = new Map();
        await this.saveNotebooks();
      } else {
        console.error('Error loading notebooks:', error);
      }
    }
  }

  async saveNotebooks() {
    try {
      const dataToSave = JSON.stringify(Object.fromEntries(this.notebooks), null, 2);
      await fs.writeFile(this.notebooksFilePath, dataToSave, 'utf-8');
    } catch (error) {
      console.error('Error saving notebooks:', error);
    }
  }

  async createNotebook(entryData) {
    if (!this.isInitialized) await this.initialize();

    const notebook = {
      id: crypto.randomBytes(8).toString('hex'),
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

    this.notebooks.set(notebook.id, notebook);
    await this.saveNotebooks();
    return notebook;
  }

  async getNotebook(id) {
    if (!this.isInitialized) await this.initialize();
    return this.notebooks.get(id);
  }

  async getAllNotebooks() {
    if (!this.isInitialized) await this.initialize();
    return Array.from(this.notebooks.values());
  }

  async updateNotebook(id, updates) {
    if (!this.isInitialized) await this.initialize();

    const existing = this.notebooks.get(id);
    if (!existing) {
      throw new Error('Notebook entry not found');
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    this.notebooks.set(id, updated);
    await this.saveNotebooks();
    return updated;
  }

  async deleteNotebook(id) {
    if (!this.isInitialized) await this.initialize();

    const deleted = this.notebooks.delete(id);
    if (deleted) {
      await this.saveNotebooks();
    }
    return deleted;
  }

  async searchNotebooks(query, filters = {}) {
    if (!this.isInitialized) await this.initialize();

    const searchTerm = (query || '').toLowerCase();
    const { type, category, tags, difficulty } = filters;

    const results = Array.from(this.notebooks.values()).filter(notebook => {
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

  async getNotebooksByType(type) {
    if (!this.isInitialized) await this.initialize();
    return Array.from(this.notebooks.values()).filter(notebook => notebook.type === type);
  }

  async getNotebooksByCategory(category) {
    if (!this.isInitialized) await this.initialize();
    return Array.from(this.notebooks.values()).filter(notebook => notebook.category === category);
  }

  async linkVocabulary(notebookId, vocabIds) {
    if (!this.isInitialized) await this.initialize();

    const existing = this.notebooks.get(notebookId);
    if (!existing) {
      throw new Error('Notebook entry not found');
    }

    // Merge new vocabulary IDs with existing ones, avoiding duplicates
    const existingVocabIds = existing.vocabularyIds || [];
    const newVocabIds = Array.isArray(vocabIds) ? vocabIds : [vocabIds];
    const mergedVocabIds = [...new Set([...existingVocabIds, ...newVocabIds])];

    const updated = {
      ...existing,
      vocabularyIds: mergedVocabIds,
      updatedAt: new Date().toISOString()
    };

    this.notebooks.set(notebookId, updated);
    await this.saveNotebooks();
    return updated;
  }

  async unlinkVocabulary(notebookId, vocabIds) {
    if (!this.isInitialized) await this.initialize();

    const existing = this.notebooks.get(notebookId);
    if (!existing) {
      throw new Error('Notebook entry not found');
    }

    const existingVocabIds = existing.vocabularyIds || [];
    const idsToRemove = Array.isArray(vocabIds) ? vocabIds : [vocabIds];
    const filteredVocabIds = existingVocabIds.filter(id => !idsToRemove.includes(id));

    const updated = {
      ...existing,
      vocabularyIds: filteredVocabIds,
      updatedAt: new Date().toISOString()
    };

    this.notebooks.set(notebookId, updated);
    await this.saveNotebooks();
    return updated;
  }

  async getLinkedVocabulary(notebookId) {
    if (!this.isInitialized) await this.initialize();

    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error('Notebook entry not found');
    }

    return notebook.vocabularyIds || [];
  }

  async updatePractice(notebookId, score) {
    if (!this.isInitialized) await this.initialize();

    const existing = this.notebooks.get(notebookId);
    if (!existing) {
      throw new Error('Notebook entry not found');
    }

    // Update mastery based on practice score (1-5)
    let newMasteryLevel = existing.masteryLevel;
    const newPracticeCount = existing.practiceCount + 1;

    if (score >= 3) { // Good practice
      newMasteryLevel = Math.min(5, newMasteryLevel + 1);
    } else { // Poor practice
      newMasteryLevel = Math.max(0, newMasteryLevel - 1);
    }

    const updated = {
      ...existing,
      masteryLevel: newMasteryLevel,
      practiceCount: newPracticeCount,
      lastPracticed: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notebooks.set(notebookId, updated);
    await this.saveNotebooks();
    return updated;
  }

  async getNotebookStats() {
    if (!this.isInitialized) await this.initialize();

    const all = Array.from(this.notebooks.values());
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
      // By type
      stats.byType[notebook.type] = (stats.byType[notebook.type] || 0) + 1;
      
      // By category
      stats.byCategory[notebook.category] = (stats.byCategory[notebook.category] || 0) + 1;
      
      // By difficulty
      stats.byDifficulty[notebook.difficulty] = (stats.byDifficulty[notebook.difficulty] || 0) + 1;
      
      // Mastery distribution
      stats.masteryDistribution[notebook.masteryLevel] = (stats.masteryDistribution[notebook.masteryLevel] || 0) + 1;
      
      // Average mastery
      stats.averageMastery += notebook.masteryLevel;
      
      // Total practices
      stats.totalPractices += notebook.practiceCount;
      
      // Recently active (updated in last week)
      const updatedDate = new Date(notebook.updatedAt);
      if (updatedDate > oneWeekAgo) {
        stats.recentlyActive++;
      }
    });

    // Finalize average mastery
    stats.averageMastery = all.length > 0 ? Math.round(stats.averageMastery / all.length) : 0;

    return stats;
  }

  async getRecentNotebooks(days = 7) {
    if (!this.isInitialized) await this.initialize();

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.notebooks.values())
      .filter(notebook => new Date(notebook.updatedAt) > cutoffDate)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async exportNotebooks(format = 'json') {
    if (!this.isInitialized) await this.initialize();

    const all = Array.from(this.notebooks.values());
    
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

  async importNotebooks(data, format = 'json') {
    if (!this.isInitialized) await this.initialize();

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

    let addedCount = 0;
    let skippedCount = 0;

    for (const notebookData of notebooksToAdd) {
      try {
        // Check if notebook already exists (by title + type)
        const existing = Array.from(this.notebooks.values()).find(
          n => n.title === notebookData.title && n.type === notebookData.type
        );

        if (existing) {
          skippedCount++;
          continue;
        }

        // Add new notebook with generated ID
        const notebook = {
          id: crypto.randomBytes(8).toString('hex'),
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

        this.notebooks.set(notebook.id, notebook);
        addedCount++;
      } catch (error) {
        console.error('Error importing notebook entry:', error);
        skippedCount++;
      }
    }

    await this.saveNotebooks();
    
    return {
      added: addedCount,
      skipped: skippedCount,
      total: notebooksToAdd.length
    };
  }

  async createExercise(exerciseData) {
    // Helper method to create exercise-type notebook entries
    return this.createNotebook({
      ...exerciseData,
      type: 'exercise',
      category: exerciseData.category || 'practice'
    });
  }

  async createGuide(guideData) {
    // Helper method to create guide-type notebook entries
    return this.createNotebook({
      ...guideData,
      type: 'guide',
      category: guideData.category || 'study'
    });
  }

  async getExercises() {
    return this.getNotebooksByType('exercise');
  }

  async getGuides() {
    return this.getNotebooksByType('guide');
  }
}

module.exports = NotebookService;