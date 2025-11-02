const { getServices } = require('../middlewear/initialise');

// ========================================
// HEALTH CHECK
// ========================================

/**
 * GET /api/notebooks/health
 * Health check for notebook services
 */
async function healthCheck(req, res) {
    try {
        // Check if services are initialized without throwing error
        const { areServicesInitialized, getServices } = require('../middlewear/initialise');
        
        if (!areServicesInitialized()) {
            return res.status(503).json({
                error: 'Services not fully initialized',
                message: 'Please try again in a moment',
                details: 'Notebook services are still starting up'
            });
        }

        const services = getServices();
        
        if (!services.vocabulary || !services.notebook) {
            return res.status(503).json({
                error: 'Services not fully initialized',
                message: 'Please try again in a moment',
                details: 'Notebook services are still starting up'
            });
        }

        res.json({
            status: 'healthy',
            services: {
                vocabulary: 'ready',
                notebook: 'ready'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            error: 'Services not fully initialized',
            message: 'Please try again in a moment',
            details: error.message
        });
    }
}

// ========================================
// VOCABULARY CONTROLLERS
// ========================================

/**
 * POST /api/notebooks/vocabulary
 * Add new vocabulary entry
 */
async function addVocabulary(req, res) {
    try {
        const { vocabulary } = getServices();
        const vocabData = req.body;

        // Validate required fields
        if (!vocabData.japanese || !vocabData.english) {
            return res.status(400).json({ error: 'Japanese word and English meaning are required' });
        }

        const newVocab = await vocabulary.addVocabulary(vocabData);
        res.status(201).json({
            success: true,
            message: 'Vocabulary added successfully',
            vocabulary: newVocab
        });
    } catch (error) {
        console.error('Error adding vocabulary:', error);
        res.status(500).json({ error: error.message || 'Failed to add vocabulary' });
    }
}

/**
 * GET /api/notebooks/vocabulary
 * Get all vocabulary entries with optional filtering
 */
async function getAllVocabulary(req, res) {
    try {
        const { vocabulary } = getServices();
        const { level, type, search, tags } = req.query;

        let results;
        if (search || level || type || tags) {
            const filters = { level, type };
            if (tags) {
                filters.tags = tags.split(',').map(tag => tag.trim());
            }
            results = await vocabulary.searchVocabulary(search, filters);
        } else {
            results = await vocabulary.getAllVocabulary();
        }

        res.json({
            success: true,
            count: results.length,
            vocabulary: results
        });
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        res.status(500).json({ error: error.message || 'Failed to get vocabulary' });
    }
}

/**
 * GET /api/notebooks/vocabulary/:id
 * Get specific vocabulary entry
 */
async function getVocabulary(req, res) {
    try {
        const { vocabulary } = getServices();
        const { id } = req.params;

        const vocab = await vocabulary.getVocabulary(id);
        if (!vocab) {
            return res.status(404).json({ error: 'Vocabulary entry not found' });
        }

        res.json({
            success: true,
            vocabulary: vocab
        });
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        res.status(500).json({ error: error.message || 'Failed to get vocabulary' });
    }
}

/**
 * PUT /api/notebooks/vocabulary/:id
 * Update vocabulary entry
 */
async function updateVocabulary(req, res) {
    try {
        const { vocabulary } = getServices();
        const { id } = req.params;
        const updates = req.body;

        const updated = await vocabulary.updateVocabulary(id, updates);
        res.json({
            success: true,
            message: 'Vocabulary updated successfully',
            vocabulary: updated
        });
    } catch (error) {
        console.error('Error updating vocabulary:', error);
        if (error.message === 'Vocabulary entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to update vocabulary' });
    }
}

/**
 * DELETE /api/notebooks/vocabulary/:id
 * Delete vocabulary entry
 */
async function deleteVocabulary(req, res) {
    try {
        const { vocabulary } = getServices();
        const { id } = req.params;

        const deleted = await vocabulary.deleteVocabulary(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Vocabulary entry not found' });
        }

        res.json({
            success: true,
            message: 'Vocabulary deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vocabulary:', error);
        res.status(500).json({ error: error.message || 'Failed to delete vocabulary' });
    }
}

/**
 * POST /api/notebooks/vocabulary/:id/review
 * Update vocabulary mastery after review
 */
async function updateVocabularyMastery(req, res) {
    try {
        const { vocabulary } = getServices();
        const { id } = req.params;
        const { score } = req.body;

        if (typeof score !== 'number' || score < 1 || score > 5) {
            return res.status(400).json({ error: 'Score must be a number between 1 and 5' });
        }

        const updated = await vocabulary.updateMastery(id, score);
        res.json({
            success: true,
            message: 'Mastery updated successfully',
            vocabulary: updated
        });
    } catch (error) {
        console.error('Error updating mastery:', error);
        if (error.message === 'Vocabulary entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to update mastery' });
    }
}

/**
 * GET /api/notebooks/vocabulary/review/due
 * Get vocabulary due for review
 */
async function getVocabularyForReview(req, res) {
    try {
        const { vocabulary } = getServices();
        const dueForReview = await vocabulary.getDueForReview();

        res.json({
            success: true,
            count: dueForReview.length,
            vocabulary: dueForReview
        });
    } catch (error) {
        console.error('Error getting vocabulary for review:', error);
        res.status(500).json({ error: error.message || 'Failed to get vocabulary for review' });
    }
}

// ========================================
// NOTEBOOK CONTROLLERS
// ========================================

/**
 * POST /api/notebooks
 * Create new notebook entry
 */
async function createNotebookEntry(req, res) {
    try {
        const { notebook } = getServices();
        const entryData = req.body;

        // Validate required fields
        if (!entryData.title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const newEntry = await notebook.createNotebook(entryData);
        res.status(201).json({
            success: true,
            message: 'Notebook entry created successfully',
            notebook: newEntry
        });
    } catch (error) {
        console.error('Error creating notebook entry:', error);
        res.status(500).json({ error: error.message || 'Failed to create notebook entry' });
    }
}

/**
 * GET /api/notebooks
 * Get all notebook entries with optional filtering
 */
async function getAllNotebookEntries(req, res) {
    try {
        const { notebook } = getServices();
        const { type, category, difficulty, search, tags } = req.query;

        let results;
        if (search || type || category || difficulty || tags) {
            const filters = { type, category, difficulty };
            if (tags) {
                filters.tags = tags.split(',').map(tag => tag.trim());
            }
            results = await notebook.searchNotebooks(search, filters);
        } else {
            results = await notebook.getAllNotebooks();
        }

        res.json({
            success: true,
            count: results.length,
            notebooks: results
        });
    } catch (error) {
        console.error('Error getting notebook entries:', error);
        res.status(500).json({ error: error.message || 'Failed to get notebook entries' });
    }
}

/**
 * GET /api/notebooks/:id
 * Get specific notebook entry
 */
async function getNotebookEntry(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;

        const entry = await notebook.getNotebook(id);
        if (!entry) {
            return res.status(404).json({ error: 'Notebook entry not found' });
        }

        res.json({
            success: true,
            notebook: entry
        });
    } catch (error) {
        console.error('Error getting notebook entry:', error);
        res.status(500).json({ error: error.message || 'Failed to get notebook entry' });
    }
}

/**
 * PUT /api/notebooks/:id
 * Update notebook entry
 */
async function updateNotebookEntry(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;
        const updates = req.body;

        const updated = await notebook.updateNotebook(id, updates);
        res.json({
            success: true,
            message: 'Notebook entry updated successfully',
            notebook: updated
        });
    } catch (error) {
        console.error('Error updating notebook entry:', error);
        if (error.message === 'Notebook entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to update notebook entry' });
    }
}

/**
 * DELETE /api/notebooks/:id
 * Delete notebook entry
 */
async function deleteNotebookEntry(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;

        const deleted = await notebook.deleteNotebook(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Notebook entry not found' });
        }

        res.json({
            success: true,
            message: 'Notebook entry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notebook entry:', error);
        res.status(500).json({ error: error.message || 'Failed to delete notebook entry' });
    }
}

/**
 * POST /api/notebooks/:id/link-vocabulary
 * Link vocabulary to notebook entry
 */
async function linkVocabularyToNotebook(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;
        const { vocabularyIds } = req.body;

        if (!Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
            return res.status(400).json({ error: 'vocabularyIds must be a non-empty array' });
        }

        const updated = await notebook.linkVocabulary(id, vocabularyIds);
        res.json({
            success: true,
            message: 'Vocabulary linked successfully',
            notebook: updated
        });
    } catch (error) {
        console.error('Error linking vocabulary:', error);
        if (error.message === 'Notebook entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to link vocabulary' });
    }
}

/**
 * DELETE /api/notebooks/:id/link-vocabulary
 * Unlink vocabulary from notebook entry
 */
async function unlinkVocabularyFromNotebook(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;
        const { vocabularyIds } = req.body;

        if (!Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
            return res.status(400).json({ error: 'vocabularyIds must be a non-empty array' });
        }

        const updated = await notebook.unlinkVocabulary(id, vocabularyIds);
        res.json({
            success: true,
            message: 'Vocabulary unlinked successfully',
            notebook: updated
        });
    } catch (error) {
        console.error('Error unlinking vocabulary:', error);
        if (error.message === 'Notebook entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to unlink vocabulary' });
    }
}

/**
 * GET /api/notebooks/:id/vocabulary
 * Get vocabulary linked to notebook entry
 */
async function getNotebookVocabulary(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;

        const vocabularyIds = await notebook.getLinkedVocabulary(id);
        res.json({
            success: true,
            vocabularyIds
        });
    } catch (error) {
        console.error('Error getting notebook vocabulary:', error);
        if (error.message === 'Notebook entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to get notebook vocabulary' });
    }
}

/**
 * POST /api/notebooks/:id/practice
 * Update notebook entry after practice
 */
async function updateNotebookPractice(req, res) {
    try {
        const { notebook } = getServices();
        const { id } = req.params;
        const { score } = req.body;

        if (typeof score !== 'number' || score < 1 || score > 5) {
            return res.status(400).json({ error: 'Score must be a number between 1 and 5' });
        }

        const updated = await notebook.updatePractice(id, score);
        res.json({
            success: true,
            message: 'Practice updated successfully',
            notebook: updated
        });
    } catch (error) {
        console.error('Error updating practice:', error);
        if (error.message === 'Notebook entry not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Failed to update practice' });
    }
}

// ========================================
// EXERCISE & GUIDE HELPERS
// ========================================

/**
 * POST /api/notebooks/exercises
 * Create exercise entry
 */
async function createExercise(req, res) {
    try {
        const { notebook } = getServices();
        const exerciseData = req.body;

        const newExercise = await notebook.createExercise(exerciseData);
        res.status(201).json({
            success: true,
            message: 'Exercise created successfully',
            notebook: newExercise
        });
    } catch (error) {
        console.error('Error creating exercise:', error);
        res.status(500).json({ error: error.message || 'Failed to create exercise' });
    }
}

/**
 * POST /api/notebooks/guides
 * Create guide entry
 */
async function createGuide(req, res) {
    try {
        const { notebook } = getServices();
        const guideData = req.body;

        const newGuide = await notebook.createGuide(guideData);
        res.status(201).json({
            success: true,
            message: 'Guide created successfully',
            notebook: newGuide
        });
    } catch (error) {
        console.error('Error creating guide:', error);
        res.status(500).json({ error: error.message || 'Failed to create guide' });
    }
}

/**
 * GET /api/notebooks/exercises
 * Get all exercise entries
 */
async function getExercises(req, res) {
    try {
        const { notebook } = getServices();
        const exercises = await notebook.getExercises();

        res.json({
            success: true,
            count: exercises.length,
            exercises
        });
    } catch (error) {
        console.error('Error getting exercises:', error);
        res.status(500).json({ error: error.message || 'Failed to get exercises' });
    }
}

/**
 * GET /api/notebooks/guides
 * Get all guide entries
 */
async function getGuides(req, res) {
    try {
        const { notebook } = getServices();
        const guides = await notebook.getGuides();

        res.json({
            success: true,
            count: guides.length,
            guides
        });
    } catch (error) {
        console.error('Error getting guides:', error);
        res.status(500).json({ error: error.message || 'Failed to get guides' });
    }
}

// ========================================
// ANALYTICS & STATS CONTROLLERS
// ========================================

/**
 * GET /api/notebooks/stats/vocabulary
 * Get vocabulary statistics
 */
async function getVocabularyStats(req, res) {
    try {
        const { vocabulary } = getServices();
        const stats = await vocabulary.getVocabularyStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting vocabulary stats:', error);
        res.status(500).json({ error: error.message || 'Failed to get vocabulary stats' });
    }
}

/**
 * GET /api/notebooks/stats/notebooks
 * Get notebook statistics
 */
async function getNotebookStats(req, res) {
    try {
        const { notebook } = getServices();
        const stats = await notebook.getNotebookStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting notebook stats:', error);
        res.status(500).json({ error: error.message || 'Failed to get notebook stats' });
    }
}

/**
 * GET /api/notebooks/stats/overview
 * Get combined learning statistics
 */
async function getLearningOverview(req, res) {
    try {
        const { vocabulary, notebook } = getServices();
        
        const [vocabStats, notebookStats] = await Promise.all([
            vocabulary.getVocabularyStats(),
            notebook.getNotebookStats()
        ]);

        const overview = {
            vocabulary: vocabStats,
            notebooks: notebookStats,
            combined: {
                totalItems: vocabStats.total + notebookStats.total,
                averageMastery: Math.round((vocabStats.averageMastery + notebookStats.averageMastery) / 2),
                totalActivities: vocabStats.dueForReview + notebookStats.recentlyActive
            }
        };

        res.json({
            success: true,
            overview
        });
    } catch (error) {
        console.error('Error getting learning overview:', error);
        res.status(500).json({ error: error.message || 'Failed to get learning overview' });
    }
}

// ========================================
// IMPORT/EXPORT CONTROLLERS
// ========================================

/**
 * GET /api/notebooks/export/vocabulary
 * Export vocabulary data
 */
async function exportVocabulary(req, res) {
    try {
        const { vocabulary } = getServices();
        const { format = 'json' } = req.query;

        const exportData = await vocabulary.exportVocabulary(format);

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="vocabulary_export_${new Date().toISOString().split('T')[0]}.json"`);
        } else if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="vocabulary_export_${new Date().toISOString().split('T')[0]}.csv"`);
        }

        res.send(exportData);
    } catch (error) {
        console.error('Error exporting vocabulary:', error);
        res.status(500).json({ error: error.message || 'Failed to export vocabulary' });
    }
}

/**
 * GET /api/notebooks/export/notebooks
 * Export notebook data
 */
async function exportNotebooks(req, res) {
    try {
        const { notebook } = getServices();
        const { format = 'json' } = req.query;

        const exportData = await notebook.exportNotebooks(format);

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="notebooks_export_${new Date().toISOString().split('T')[0]}.json"`);
        } else if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="notebooks_export_${new Date().toISOString().split('T')[0]}.csv"`);
        }

        res.send(exportData);
    } catch (error) {
        console.error('Error exporting notebooks:', error);
        res.status(500).json({ error: error.message || 'Failed to export notebooks' });
    }
}

/**
 * GET /api/notebooks/vocabulary/leeches
 * Get leech cards (cards with lapses >= threshold)
 */
async function getLeeches(req, res) {
    try {
        const { vocabulary } = getServices();
        const threshold = parseInt(req.query.threshold) || 8;

        const leeches = await vocabulary.getLeeches(threshold);
        res.json({
            success: true,
            count: leeches.length,
            threshold,
            leeches
        });
    } catch (error) {
        console.error('Error getting leeches:', error);
        res.status(500).json({ error: error.message || 'Failed to get leeches' });
    }
}

/**
 * GET /api/notebooks/vocabulary/source/:source
 * Get vocabulary by extraction source (manual/ai/hybrid)
 */
async function getVocabularyBySource(req, res) {
    try {
        const { vocabulary } = getServices();
        const { source } = req.params;

        if (!['manual', 'ai', 'hybrid'].includes(source)) {
            return res.status(400).json({
                error: 'Invalid source. Must be: manual, ai, or hybrid'
            });
        }

        const vocabList = await vocabulary.getVocabularyBySource(source);
        res.json({
            success: true,
            source,
            count: vocabList.length,
            vocabulary: vocabList
        });
    } catch (error) {
        console.error('Error getting vocabulary by source:', error);
        res.status(500).json({ error: error.message || 'Failed to get vocabulary by source' });
    }
}

/**
 * GET /api/notebooks/vocabulary/conversation/:conversationId
 * Get vocabulary from a specific conversation
 */
async function getVocabularyByConversation(req, res) {
    try {
        const { vocabulary } = getServices();
        const { conversationId } = req.params;

        const vocabList = await vocabulary.getVocabularyByConversation(conversationId);
        res.json({
            success: true,
            conversationId,
            count: vocabList.length,
            vocabulary: vocabList
        });
    } catch (error) {
        console.error('Error getting vocabulary by conversation:', error);
        res.status(500).json({ error: error.message || 'Failed to get vocabulary by conversation' });
    }
}

module.exports = {
    // Health check
    healthCheck,

    // Vocabulary controllers
    addVocabulary,
    getAllVocabulary,
    getVocabulary,
    updateVocabulary,
    deleteVocabulary,
    updateVocabularyMastery,
    getVocabularyForReview,
    getLeeches,
    getVocabularyBySource,
    getVocabularyByConversation,

    // Notebook controllers
    createNotebookEntry,
    getAllNotebookEntries,
    getNotebookEntry,
    updateNotebookEntry,
    deleteNotebookEntry,
    linkVocabularyToNotebook,
    unlinkVocabularyFromNotebook,
    getNotebookVocabulary,
    updateNotebookPractice,

    // Exercise & Guide helpers
    createExercise,
    createGuide,
    getExercises,
    getGuides,

    // Analytics controllers
    getVocabularyStats,
    getNotebookStats,
    getLearningOverview,

    // Import/Export controllers
    exportVocabulary,
    exportNotebooks
};