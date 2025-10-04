const { getServices } = require('../middlewear/initialise');
const path = require('path');

/**
 * POST /api/documents/generate/pdf
 * Generate PDF from conversation or study guide
 */
async function generatePDF(req, res) {
    try {
        const { documentService, history } = getServices();
        const { conversationId, type = 'conversation', data } = req.body;

        if (!conversationId && !data) {
            return res.status(400).json({ error: 'Either conversationId or data is required' });
        }

        let filepath;

        if (type === 'conversation' && conversationId) {
            const conversation = await history.getConversation(conversationId);
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }
            filepath = await documentService.generateConversationPDF(conversation);
        } else if (type === 'study-guide' && data) {
            filepath = await documentService.generateStudyGuidePDF(data);
        } else {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        res.download(filepath, path.basename(filepath), (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/documents/generate/docx
 * Generate DOCX from conversation
 */
async function generateDOCX(req, res) {
    try {
        const { documentService, history } = getServices();
        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({ error: 'conversationId is required' });
        }

        const conversation = await history.getConversation(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const filepath = await documentService.generateConversationDOCX(conversation);

        res.download(filepath, path.basename(filepath), (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('DOCX generation error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/documents/generate/markdown
 * Generate Markdown from conversation
 */
async function generateMarkdown(req, res) {
    try {
        const { documentService, history } = getServices();
        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({ error: 'conversationId is required' });
        }

        const conversation = await history.getConversation(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const filepath = await documentService.generateConversationMarkdown(conversation);

        res.download(filepath, path.basename(filepath), (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download file' });
            }
        });

    } catch (error) {
        console.error('Markdown generation error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/documents/list
 * List all generated documents
 */
async function listDocuments(req, res) {
    try {
        const { documentService } = getServices();
        const documents = await documentService.getGeneratedDocuments();
        res.json({
            documents,
            total: documents.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * DELETE /api/documents/:filename
 * Delete a generated document
 */
async function deleteDocument(req, res) {
    try {
        const { documentService } = getServices();
        const { filename } = req.params;
        const success = await documentService.deleteDocument(filename);

        if (success) {
            res.json({ message: 'Document deleted successfully' });
        } else {
            res.status(404).json({ error: 'Document not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/documents/stats
 * Get document generation statistics
 */
async function getDocumentStats(req, res) {
    try {
        const { documentService } = getServices();
        const stats = await documentService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * POST /api/documents/generate-with-llm
 * Generate document using LLM
 */
async function generateWithLLM(req, res) {
    try {
        const { documentService } = getServices();
        const { prompt, level = 'beginner', format = 'pdf' } = req.body;

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`🤖 LLM Document Generation Request: "${prompt}" (${format})`);

        const result = await documentService.generateDocumentWithLLM(prompt, level, format);

        // Send the file for download
        res.download(result.filepath, result.filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download generated document' });
            }
        });

    } catch (error) {
        console.error('LLM document generation error:', error);
        res.status(500).json({
            error: 'Failed to generate document',
            details: error.message
        });
    }
}

module.exports = {
    generatePDF,
    generateDOCX,
    generateMarkdown,
    listDocuments,
    deleteDocument,
    getDocumentStats,
    generateWithLLM
};