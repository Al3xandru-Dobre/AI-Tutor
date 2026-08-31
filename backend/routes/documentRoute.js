const express = require('express');
const router = express.Router();
const {
    generatePDF,
    generateDOCX,
    generateMarkdown,
    listDocuments,
    deleteDocument,
    getDocumentStats,
    generateWithLLM
} = require('../controllers/documentGenerationCotnroller');
const { ensureServicesInitialized } = require('../middlewear/initialise');

// Apply middleware to all routes
router.use(ensureServicesInitialized);

// Document generation routes
router.post('/generate/pdf', generatePDF);
router.post('/generate/docx', generateDOCX);
router.post('/generate/markdown', generateMarkdown);
router.post('/generate-with-llm', generateWithLLM);

// Document management routes
router.get('/list', listDocuments);
router.get('/stats', getDocumentStats);
router.delete('/:filename', deleteDocument);

module.exports = router;
