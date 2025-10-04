// Messaging Module
// Functions for sending/receiving messages and AI responses

// Get AI response
async function getAIResponse(userMessage) {
    setLoading(true);

    try {
        console.log('📤 Sending request to server...', {
            message: userMessage,
            level: 'beginner',
            internetEnabled: isInternetSearchEnabled,
            advancedRAGEnabled: isAdvancedRAGEnabled,
            conversationId: currentConversationId
        });

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                level: 'beginner',
                use_internet: isInternetSearchEnabled,
                useOrchestrator: true,
                useAdvancedRAG: isAdvancedRAGEnabled,
                context: {},
                conversationId: currentConversationId
            })
        });

        console.log('📥 Response status:', response.status);

        const data = await response.json();
        console.log('📦 Response data:', data);

        if (response.ok) {
            // Update the current conversation ID if it's new
            if (!currentConversationId && data.conversationId) {
                currentConversationId = data.conversationId;
                console.log('✅ New conversation created:', currentConversationId);
                // Refresh history to show the new conversation
                await loadHistory();
            }

            // Log features used for debugging
            if (data.features_used) {
                console.log('🎯 Features used:', data.features_used);
            }

            if (data.metadata) {
                console.log('📊 Metadata:', data.metadata);
            }

            addMessage(data, 'assistant');
        } else {
            console.error('❌ Server error:', data);
            addMessage({ content: data.error || 'An error occurred' }, 'error');
        }
    } catch (error) {
        console.error('❌ Connection error:', error);
        addMessage({
            content: `Connection error: ${error.message}\n\nPlease check:\n• Is the server running?\n• Is ChromaDB running?\n• Check browser console for details`
        }, 'error');
    }

    setLoading(false);
}

// Send message
async function sendMessage() {
    if (!messageInput.value.trim() || isLoading) return;

    const userMessage = messageInput.value.trim();
    lastUserPrompt = userMessage;
    messageInput.value = '';
    suggestionsPopup.classList.remove('visible');

    addMessage({ content: userMessage }, 'user');
    await getAIResponse(userMessage);
}

// Quick send for suggestion buttons
function quickSend(message) {
    messageInput.value = message;
    sendMessage();
}

// Regenerate response
async function regenerateResponse() {
    if (isLoading || !lastUserPrompt) return;

    const chat = document.getElementById('chatContainer');
    const allMessages = Array.from(chat.children);

    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = allMessages.length - 1; i >= 0; i--) {
        if (allMessages[i].classList.contains('user')) {
            lastUserMessageIndex = i;
            break;
        }
    }

    // Remove all elements after the last user message
    if (lastUserMessageIndex !== -1) {
        for (let i = allMessages.length - 1; i > lastUserMessageIndex; i--) {
            allMessages[i].remove();
        }
    }

    // Get a new response for the same prompt
    await getAIResponse(lastUserPrompt);
}

// Add message to chat
function addMessage(data, type) {
    const chat = document.getElementById('chatContainer');
    const emptyState = chat.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const headers = { user: '💤 You', assistant: '🤖 Tutor', error: '⚠️ Error' };

    let metaHTML = '';
    if (type === 'assistant' || type === 'error') {
        let infoText = '';

        if (type === 'assistant') {
            // Build detailed info with features used
            const features = [];
            if (data.features_used) {
                // Check for ChromaDB semantic search
                if (data.features_used.chromadb_semantic_search) {
                    features.push('🔷 Semantic Search');
                } else if (data.features_used.local_rag) {
                    features.push('📚 Knowledge Base');
                }

                if (data.features_used.internet_search) features.push('🌐 Internet');
                if (data.features_used.history_context) features.push('🧠 History');
                if (data.features_used.personalized) features.push('✨ Personalized');
            }

            const featuresText = features.length > 0 ? ` • ${features.join(' • ')}` : '';

            // Get timing info - support both old and new format
            const timing = data.total_time || data.processing_time || data.metadata?.processing_time || '?';
            const model = data.model || 'AI Tutor';

            infoText = `<span>${model} • ${timing}ms${featuresText}</span>`;
        } else {
            infoText = `<span>An error occurred. Try again.</span>`;
        }

        const regenerateButton = `
            <button class="regenerate-btn" onclick="regenerateResponse()" title="Regenerate response">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.204 2.472l-.342.341a.75.75 0 01-1.06-1.06l1.09-1.09a.75.75 0 011.06 0l1.09 1.09a.75.75 0 01-1.06 1.06l-.341-.342a3.999 3.999 0 006.583-1.834.75.75 0 011.416.474zM4.688 8.576a5.5 5.5 0 019.204-2.472l.342-.341a.75.75 0 111.06 1.06l-1.09 1.09a.75.75 0 01-1.06 0L11.91 6.734a.75.75 0 111.06-1.06l.341.342a3.999 3.999 0 00-6.583 1.834.75.75 0 01-1.416-.474z" clip-rule="evenodd" />
                </svg>
            </button>`;
        metaHTML = `<div class="message-meta">${infoText}${regenerateButton}</div>`;
    }

    // Handle both 'response' and 'content' properties
    const messageContent = data.response || data.content || 'No response content';

    messageDiv.innerHTML = `
        <div class="message-header">${headers[type]}</div>
        <div class="message-content">${messageContent}</div>
        ${metaHTML}
    `;

    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

// Test server connection (for debugging)
async function testServerConnection() {
    try {
        console.log('🔍 Testing server connection...');

        // Test 1: Basic server health
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);

        // Test 2: ChromaDB health
        const chromaResponse = await fetch('/api/chromadb/health');
        const chromaData = await chromaResponse.json();
        console.log('✅ ChromaDB check:', chromaData);

        // Test 3: RAG stats
        const ragResponse = await fetch('/api/rag/stats');
        const ragData = await ragResponse.json();
        console.log('✅ RAG stats:', ragData);

        return true;
    } catch (error) {
        console.error('❌ Server connection test failed:', error);
        return false;
    }
}

// Debug chat function
window.debugChat = async function(message) {
    console.log('🐛 Debug mode: Sending test message...');
    console.log('Message:', message || 'Test message: How do I use particles?');

    const testMessage = message || 'Test message: How do I use particles?';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: testMessage,
                level: 'beginner',
                use_internet: isInternetSearchEnabled,
                useOrchestrator: true,
                context: {},
                conversationId: currentConversationId
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));

        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        return data;
    } catch (error) {
        console.error('Debug test failed:', error);
        return { error: error.message };
    }
};
