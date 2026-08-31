const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/notebookController');

const { ensureServicesInitialized } = require('../middlewear/initialise');

// Health check (no middleware - should work even during initialization)
router.get('/health', healthCheck);

// Apply middleware to all routes except health
router.use(ensureServicesInitialized);

// ========================================
// VOCABULARY ROUTES
// ========================================

// Vocabulary CRUD
router.post('/vocabulary', addVocabulary);
router.get('/vocabulary', getAllVocabulary);
router.get('/vocabulary/:id', getVocabulary);
router.put('/vocabulary/:id', updateVocabulary);
router.delete('/vocabulary/:id', deleteVocabulary);

// Vocabulary specific actions
router.post('/vocabulary/:id/review', updateVocabularyMastery);
router.get('/vocabulary/review/due', getVocabularyForReview);
router.get('/vocabulary/leeches', getLeeches);
router.get('/vocabulary/source/:source', getVocabularyBySource);
router.get('/vocabulary/conversation/:conversationId', getVocabularyByConversation);

// ========================================
// NOTEBOOK ROUTES
// ========================================

// Notebook CRUD
router.post('/', createNotebookEntry);
router.get('/', getAllNotebookEntries);
router.get('/:id', getNotebookEntry);
router.put('/:id', updateNotebookEntry);
router.delete('/:id', deleteNotebookEntry);

// Notebook vocabulary linking
router.post('/:id/link-vocabulary', linkVocabularyToNotebook);
router.delete('/:id/link-vocabulary', unlinkVocabularyFromNotebook);
router.get('/:id/vocabulary', getNotebookVocabulary);

// Notebook practice
router.post('/:id/practice', updateNotebookPractice);

// ========================================
// EXERCISE & GUIDE ROUTES
// ========================================

// Exercise routes
router.post('/exercises', createExercise);
router.get('/exercises', getExercises);

// Guide routes
router.post('/guides', createGuide);
router.get('/guides', getGuides);

// ========================================
// ANALYTICS ROUTES
// ========================================

// Statistics
router.get('/stats/vocabulary', getVocabularyStats);
router.get('/stats/notebooks', getNotebookStats);
router.get('/stats/overview', getLearningOverview);

// ========================================
// IMPORT/EXPORT ROUTES
// ========================================

// Export routes
router.get('/export/vocabulary', exportVocabulary);
router.get('/export/notebooks', exportNotebooks);

module.exports = router;