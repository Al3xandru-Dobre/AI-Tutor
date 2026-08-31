// App State Management
// Central state for the application

let isLoading = false;
let isInternetSearchEnabled = true;
let isAdvancedRAGEnabled = false;  // Advanced RAG with hybrid search + query expansion
let lastUserPrompt = '';
let currentConversationId = null;
let conversationHistory = [];
let isSidebarCollapsed = false;

// DOM element references (initialize as null, will be set when DOM is ready)
let messageInput = null;
let suggestionsPopup = null;
let historyList = null;
let sidebar = null;
let sidebarOverlay = null;
let appLayout = null;

// Initialize DOM references when DOM is ready
function initializeDOMReferences() {
    messageInput = document.getElementById('messageInput');
    suggestionsPopup = document.getElementById('suggestionsPopup');
    historyList = document.getElementById('historyList');
    sidebar = document.getElementById('sidebar');
    sidebarOverlay = document.getElementById('sidebarOverlay');
    appLayout = document.getElementById('appLayout');
}
