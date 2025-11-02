// Conversation History Management
// Functions for loading, rendering, and managing conversation history
let historyChunkSize = 20; // Number of conversations to load at a time
let currentHistoryOffset = 0; // Current offset for pagination
let hasMoreHistory = true; // Flag to track if more history is available
let isLoadingHistory = false; // Prevent multiple simultaneous loads

// Lazy loading implementation for conversation history
async function loadHistoryChunk() {
    if (isLoadingHistory || !hasMoreHistory) return;
    
    isLoadingHistory = true;
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-more-history';
    loadingDiv.innerHTML = '<p style="text-align: center; padding: 10px; font-size: 12px; opacity: 0.7;">Loading more...</p>';
    historyList.appendChild(loadingDiv);
    
    try {
        const response = await fetch(`/api/conversations?limit=${historyChunkSize}&offset=${currentHistoryOffset}`);
        const conversations = await response.json();

        if (conversations.length > 0) {
            renderHistoryChunk(conversations);
            currentHistoryOffset += conversations.length;
            hasMoreHistory = conversations.length === historyChunkSize;
        } else {
            hasMoreHistory = false;
            // Remove loading indicator
            loadingDiv.remove();
        }
    } catch (error) {
        console.error('Error loading history chunk:', error);
        // Remove loading indicator on error
        loadingDiv.remove();
    } finally {
        isLoadingHistory = false;
    }
}

function handleHistoryScroll() {
    if (historyList.scrollTop + historyList.clientHeight >= historyList.scrollHeight * 0.8) {
        loadHistoryChunk();
    }
}

function renderHistoryChunk(conversations) {
    // Remove loading indicator if it exists
    const loadingIndicator = historyList.querySelector('.loading-more-history');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
    
    conversations.forEach(conversation => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.classList.toggle('active', conversation.id === currentConversationId);
        historyItem.setAttribute('data-id', conversation.id);
        
        historyItem.innerHTML = `
            <div class="history-item-content">
                <div class="history-item-title">${conversation.title || 'Untitled Conversation'}</div>
                <div class="history-item-date">${formatDate(conversation.createdAt)}</div>
            </div>
            <div class="history-item-actions">
                <button class="export-btn" onclick="event.stopPropagation(); showDocumentGenerationModal('${conversation.id}')" title="Export as document">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                        <path d="M8.5 1.75a.75.75 0 0 0-1.5 0v6.5H4.56l3.22 3.22a.75.75 0 0 0 1.06 0l3.22-3.22H9.5v-6.5Zm-4 11a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Z"/>
                    </svg>
                </button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteConversation('${conversation.id}')" title="Delete conversation">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                        <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        historyItem.onclick = () => loadConversation(conversation.id);
        historyList.appendChild(historyItem);
    });
}

// Load conversation history from the server with lazy loading
async function loadHistory() {
    console.log('📥 Loading conversation history with lazy loading...');
    
    // Check if historyList element exists
    if (!historyList) {
        console.error('❌ historyList element not found!');
        return;
    }
    
    // Reset lazy loading state
    currentHistoryOffset = 0;
    hasMoreHistory = true;
    isLoadingHistory = false;
    
    // Remove old scroll listener to prevent duplicates
    historyList.removeEventListener('scroll', handleHistoryScroll);
    
    // Show loading state
    historyList.innerHTML = '<div class="loading-history">Loading conversations...</div>';
    
    try {
        const response = await fetch(`/api/conversations?limit=${historyChunkSize}&offset=${currentHistoryOffset}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('📡 History API response status:', response.status);
        
        if (response.ok) {
            const conversations = await response.json();
            console.log('✅ Loaded', conversations.length, 'conversations');
            
            // Clear loading state
            historyList.innerHTML = '';
            
            if (conversations.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-history">
                        <p>No conversations yet</p>
                        <p style="font-size: 11px; opacity: 0.7;">Start a new chat to begin your Japanese learning journey!</p>
                    </div>
                `;
            } else {
                renderHistoryChunk(conversations);
                currentHistoryOffset = conversations.length;
                hasMoreHistory = conversations.length === historyChunkSize;
                
                // Add scroll listener for lazy loading (only once)
                if (hasMoreHistory) {
                    historyList.addEventListener('scroll', handleHistoryScroll);
                }
            }
        } else if (response.status === 503) {
            // Services still initializing
            console.warn('⚠️ Services still initializing, will retry...');
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>Loading services...</p>
                    <p style="font-size: 11px; opacity: 0.7;">Please wait a moment</p>
                </div>
            `;
            // Retry after 2 seconds
            setTimeout(() => loadHistory(), 2000);
        } else {
            throw new Error(`Failed to load conversations: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error loading conversation history:', error);
        historyList.innerHTML = `
            <div class="empty-history">
                <p>Unable to load conversation history</p>
                <p style="font-size: 11px; opacity: 0.7;">Server may be starting up. Click to retry.</p>
            </div>
        `;
        // Add click to retry
        historyList.querySelector('.empty-history').style.cursor = 'pointer';
        historyList.querySelector('.empty-history').onclick = () => loadHistory();
    }
}

// Render the conversation history in the sidebar (legacy function - use lazy loading instead)
function renderHistory() {
    console.log('�️  Legacy renderHistory called - using lazy loading instead');
    // This function is now deprecated in favor of lazy loading
    loadHistory();
}

// Delete a conversation
async function deleteConversation(conversationId) {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Remove from local array
            conversationHistory = conversationHistory.filter(conv => conv.id !== conversationId);

            // If this was the current conversation, start a new chat
            if (currentConversationId === conversationId) {
                startNewChat();
            }

            // Re-render history
            renderHistory();
        } else {
            throw new Error('Failed to delete conversation');
        }
    } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Failed to delete conversation. Please try again.');
    }
}

// Load a specific conversation
async function loadConversation(id) {
    try {
        const response = await fetch(`/api/conversations/${id}`);
        if (!response.ok) {
            throw new Error('Failed to load conversation');
        }

        const conversation = await response.json();

        currentConversationId = id;
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = '';

        // Load all messages from the conversation
        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                addMessage({ content: msg.content }, msg.role);
            });
        } else {
            chatContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Continue your conversation</h3>
                    <p>This conversation is ready for more messages!</p>
                </div>
            `;
        }

        // Update active state in sidebar
        renderHistory();

        // Update header export button visibility
        if (typeof updateHeaderExportButton === 'function') {
            updateHeaderExportButton();
        }

    } catch (error) {
        console.error('Failed to load conversation:', error);
        addMessage({ content: 'Could not load this conversation.' }, 'error');
    }
}

// Start a new chat
function startNewChat() {
    currentConversationId = null;
    lastUserPrompt = '';
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = `
        <div class="empty-state">
            <h3>Welcome to your Japanese learning journey!</h3>
            <p>Start exploring the beautiful world of Japanese language and culture. Ask me anything or choose a suggestion below.</p>
        </div>`;

    // Update active state in sidebar
    renderHistory();

    // Update header export button visibility
    if (typeof updateHeaderExportButton === 'function') {
        updateHeaderExportButton();
    }
}
