// App State Management
// Central state for the application

let isLoading = false;
let isInternetSearchEnabled = true;
let isAdvancedRAGEnabled = false;  // Advanced RAG with hybrid search + query expansion
let lastUserPrompt = '';
let currentConversationId = null;
let conversationHistory = [];
let isSidebarCollapsed = false;

// DOM element references
const messageInput = document.getElementById('messageInput');
const suggestionsPopup = document.getElementById('suggestionsPopup');
const historyList = document.getElementById('historyList');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const appLayout = document.getElementById('appLayout');
