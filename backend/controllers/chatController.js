const { getServices } = require('../middlewear/initialise');

/**
 * POST /api/chat
 * Main chat endpoint with orchestration and advanced RAG support
 */
async function handleChat(req, res) {
    try {
        // Get initialized services (middleware ensures they're ready)
        const { ollama, orchestrator, history, historyRAG, advancedRag } = getServices();

        let { message, level = 'beginner', context = {}, useOrchestrator = true, conversationId = null, useAdvancedRAG = false } = req.body;
        if(!message || message.trim().length === 0) {
            return res.status(400).json({error: 'Message is required'});
        }  
        if(!conversationId){
            const newConversation = await history.createConversation(`Chat about "${message.substring(0,20)}..."`);
            conversationId = newConversation.id;
        }
        await history.addMessage(conversationId, {role: 'user', content:message});
        const startTime = Date.now();
        let response, sources = {}, ollamaMetadata = {};
        
        if(useOrchestrator) {

            let ragResults = [];
            if (useAdvancedRAG && advancedRag.isInitialized) {
                try{
                    const advancedResults = await advancedRag.advancedSearch(message, level, {
                        maxResults: 5,
                        useHybrid: true,
                        expandQuery: true,
                        rerank: true
                    });
                    
                    ragResults = advancedResults.results.map(r => ({
                        content: r.content,
                        source: 'Advanced RAG(Hybrid Search)',
                        title: r.metadata?.title || 'Japanese Learning Material',
                        level: r.metadata?.level || level,
                        score: r.finalScore || r.score,
                        source_type: 'advanced_rag'
                    }));
                } catch(error){
                    console.error('Advanced RAG failed, falling back to basic RAG', error.message);
                    ragResults = [];
                }
            }

            const orchestratorResult = await orchestrator.getAugmentedAnswer(
                message,
                level,
                {
                    ...context,
                    preloadedRAGResults: ragResults.length > 0 ? ragResults : undefined,
                    useAdvancedRAG: useAdvancedRAG
                }
            );

             // Handle response format (might be string or object with metadata)
      if (typeof orchestratorResult.response === 'object' && orchestratorResult.response.response) {
        response = orchestratorResult.response.response;
        ollamaMetadata = orchestratorResult.response.metadata || {};
      } else {
        response = orchestratorResult.response;
      }

      sources = orchestratorResult.sources;

    } else {
            const ollamaResult = await ollama.tutorChat(message, {level});
        
            if (typeof ollamaResult === 'object' && ollamaResult.response) {
                response = ollamaResult.response;
                ollamaMetadata = ollamaResult.metadata || {};
            } else {
                response = ollamaResult;
            }

            sources = {
                local_sources: 0,
                internet_sources: 0,
                history_context: 0,
                summary: 'Direct response without augmentation'
            };
        }

        const totalTime = Date.now() - startTime;

        await history.addMessage(conversationId, {role: 'assistant', content: response})

        if(historyRAG.isEnabled){
            await orchestrator.onNewConversation(conversationId)
        }

         res.json({
            response,
            conversationId,
            timestamp: new Date().toISOString(),
            model: ollama.model,
            sources,
            processing_time: totalTime,
            features: {
                orchestrator_used: useOrchestrator,
                advanced_rag_used: useAdvancedRAG && advancedRag.isInitialized,
                history_rag_enabled: historyRAG.isEnabled
            },
            ollama_metadata: ollamaMetadata // Include dynamic context info
            });
    } catch(error){
        console.error('Chat error: ',error);
        res.status(500).json({error: error.message || 'Internal server error'});
    }
}

// ========================================
// CONVERSATION HANDLING FUNCTIONS
// ========================================

/**
 * GET /api/conversations
 * List all conversations
 */
async function startConversation(req, res) {
    try {
        const { history } = getServices();
        const conversations = await history.listConversations();
        res.json(conversations);
    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ error: 'Failed to start conversation' });
    }
}

/**
 * GET /api/conversations/:id
 * Get a specific conversation by ID
 */
async function getConversation(req, res) {
    try {
        const { history } = getServices();
        const conversationId = req.params.id;
        
        if (!conversationId) {
            return res.status(400).json({ error: 'conversationId is required' });
        }
        
        const conversation = await history.getConversation(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        res.json(conversation);
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ error: 'Failed to get conversation' });
    }
}

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and rebuild history index
 */
async function deleteConversation(req, res) {
    try {
        const { history, historyRAG } = getServices();
        const conversationId = req.params.id;
        
        if (!conversationId) {
            return res.status(400).json({ error: 'conversationId is required' });
        }
        
        const success = await history.deleteConversation(conversationId);
        
        if (success) {
            // Rebuild history index after deletion
            if (historyRAG.isInitialized) {
                await historyRAG.initialize();
            }
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Conversation not found' });
        }
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
}

module.exports = {
    handleChat,
    startConversation,
    getConversation,
    deleteConversation
};
    

