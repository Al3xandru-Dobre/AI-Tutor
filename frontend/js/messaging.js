// Messaging Module
// Functions for sending/receiving messages and AI responses

// Simple Markdown Parser
function parseMarkdown(text) {
    if (!text) return '';

    // Trim excessive whitespace and normalize line endings
    text = text.trim().replace(/\r\n/g, '\n');

    // Remove excessive blank lines (more than 2 consecutive newlines)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Escape HTML first to prevent XSS
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (must come before headers and other processing)
    html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
        return '<pre><code>' + code.trim() + '</code></pre>';
    });

    // Tables (process before other replacements)
    const tableRegex = /(\|[^\n]+\|[\r\n]+)(\|[-:| ]+\|[\r\n]+)((?:\|[^\n]+\|[\r\n]*)+)/g;
    html = html.replace(tableRegex, function(match, header, separator, rows) {
        let tableHTML = '<table>\n<thead>\n<tr>\n';

        // Parse header
        const headers = header.split('|').filter(cell => cell.trim());
        headers.forEach(cell => {
            tableHTML += `<th>${cell.trim()}</th>\n`;
        });
        tableHTML += '</tr>\n</thead>\n<tbody>\n';

        // Parse rows
        const rowLines = rows.trim().split('\n');
        rowLines.forEach(row => {
            if (row.trim()) {
                tableHTML += '<tr>\n';
                const cells = row.split('|').filter(cell => cell.trim());
                cells.forEach(cell => {
                    tableHTML += `<td>${cell.trim()}</td>\n`;
                });
                tableHTML += '</tr>\n';
            }
        });

        tableHTML += '</tbody>\n</table>';
        return tableHTML;
    });

    // Headers (must be at start of line)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/^\*\*\*$/gim, '<hr>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gim, '<blockquote>$1</blockquote>');

    // Lists (unordered) - improved to handle multiple lines
    html = html.replace(/^\* (.+)$/gim, '::UL_ITEM::$1');
    html = html.replace(/^- (.+)$/gim, '::UL_ITEM::$1');

    // Lists (ordered)
    html = html.replace(/^\d+\. (.+)$/gim, '::OL_ITEM::$1');

    // Wrap list items - improved to prevent empty list items
    html = html.replace(/(::UL_ITEM::.+?)(?=\n(?!::UL_ITEM::)|$)/gs, function(match) {
        const items = match.split('\n')
            .filter(line => line.trim())
            .map(line => {
                return line.replace(/^::UL_ITEM::/, '<li>') + '</li>';
            }).join('\n');
        return '<ul>\n' + items + '\n</ul>';
    });

    html = html.replace(/(::OL_ITEM::.+?)(?=\n(?!::OL_ITEM::)|$)/gs, function(match) {
        const items = match.split('\n')
            .filter(line => line.trim())
            .map(line => {
                return line.replace(/^::OL_ITEM::/, '<li>') + '</li>';
            }).join('\n');
        return '<ol>\n' + items + '\n</ol>';
    });

    // Bold and Italic (after lists to avoid conflicts)
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Split into paragraphs based on double newlines
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(para => {
        para = para.trim();
        if (!para) return ''; // Skip empty paragraphs

        // Don't wrap if already a block element
        if (para.match(/^<(h[1-6]|table|ul|ol|pre|blockquote|hr|div)/i)) {
            return para;
        }

        // Replace single newlines with <br> within paragraphs
        para = para.replace(/\n/g, '<br>');

        return '<p>' + para + '</p>';
    }).filter(p => p).join('\n'); // Remove empty strings

    return html;
}

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

        // Get current model selection if available
        const modelSelection = typeof getCurrentModelSelection === 'function'
            ? getCurrentModelSelection()
            : { provider: null, model: null };

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
                conversationId: currentConversationId,
                provider: modelSelection.provider,
                model: modelSelection.model
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
            const provider = data.provider ? ` (${data.provider})` : '';

            infoText = `<span>${model}${provider} • ${timing}ms${featuresText}</span>`;
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
    const rawContent = data.response || data.content || 'No response content';

    // Parse markdown for assistant messages, keep raw for user messages
    const messageContent = type === 'assistant' ? parseMarkdown(rawContent) : rawContent;

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
    const maxRetries = 30; // Max 30 seconds
    const retryDelay = 1000; // 1 second between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔍 Testing server connection (attempt ${attempt}/${maxRetries})...`);

            // Test 1: Basic server health
            const healthResponse = await fetch('/api/health');
            const healthData = await healthResponse.json();
            console.log('✅ Health check:', healthData);

            // If still initializing, wait and retry
            if (healthData.status === 'initializing' || healthData.system_ready === false) {
                console.log('⏳ Services still initializing, waiting...');
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                return false;
            }

            // Test 2: ChromaDB health (only if services are ready)
            const chromaResponse = await fetch('/api/chromadb/health');
            const chromaData = await chromaResponse.json();
            console.log('✅ ChromaDB check:', chromaData);

            // Test 3: RAG stats
            const ragResponse = await fetch('/api/rag/stats');
            const ragData = await ragResponse.json();
            console.log('✅ RAG stats:', ragData);

            console.log('🎉 All services ready!');
            return true;
        } catch (error) {
            console.error(`❌ Server connection test failed (attempt ${attempt}/${maxRetries}):`, error);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    console.error('❌ Server failed to initialize after maximum retries');
    return false;
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
