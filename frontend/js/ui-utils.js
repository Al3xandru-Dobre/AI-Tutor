// UI Utilities
// Functions for UI interactions, sidebar, toggles, and visual elements

// Sidebar toggle functionality
function toggleSidebar() {
    // Guard against being called before DOM is ready
    if (!sidebar || !appLayout || !sidebarOverlay) {
        console.warn('toggleSidebar called before DOM is ready');
        return;
    }

    isSidebarCollapsed = !isSidebarCollapsed;
    sidebar.classList.toggle('collapsed', isSidebarCollapsed);
    appLayout.classList.toggle('sidebar-collapsed', isSidebarCollapsed);

    // Show/hide overlay on mobile
    if (window.innerWidth <= 768) {
        sidebarOverlay.classList.toggle('visible', !isSidebarCollapsed);
    }
}

function toggleTheme() {
    const body = document.body;
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    const toggleButton = document.getElementById('theme-toggle') || document.getElementById('themeToggle');

    const goingLight = body.classList.contains('dark-theme');

    body.classList.toggle('light-theme', goingLight);
    body.classList.toggle('dark-theme', !goingLight);
    localStorage.setItem('theme', goingLight ? 'light' : 'dark');

    // Sun shows in light mode (click to go dark); moon shows in dark mode
    if (sunIcon && moonIcon) {
        sunIcon.style.display = goingLight ? 'block' : 'none';
        moonIcon.style.display = goingLight ? 'none' : 'block';
    }
    if (toggleButton) {
        toggleButton.setAttribute('aria-pressed', String(goingLight));
    }
}

// Initialize theme on page load.
// Priority: saved preference > OS preference > dark.
function initializeTheme() {
    let theme = localStorage.getItem('theme');
    if (theme !== 'light' && theme !== 'dark') {
        const prefersLight = window.matchMedia
            && window.matchMedia('(prefers-color-scheme: light)').matches;
        theme = prefersLight ? 'light' : 'dark';
    }

    const body = document.body;
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');
    const toggleButton = document.getElementById('theme-toggle') || document.getElementById('themeToggle');

    body.classList.toggle('light-theme', theme === 'light');
    body.classList.toggle('dark-theme', theme === 'dark');

    if (sunIcon && moonIcon) {
        sunIcon.style.display = theme === 'light' ? 'block' : 'none';
        moonIcon.style.display = theme === 'light' ? 'none' : 'block';
    }
    if (toggleButton) {
        toggleButton.setAttribute('aria-pressed', String(theme === 'light'));
    }
}

// Initialize sidebar state (defaults to visible)
function initializeSidebarState() {
    // Sidebar starts visible by default
    isSidebarCollapsed = false;
}

// About section handlers
function showHelp() {
    alert(`Japanese AI Tutor Help

🎯 Features:
• Ask questions in natural language
• Get context-aware responses using RAG
• Toggle internet search for current information
• Conversation history automatically saved

💡 Tips:
• Specify your level (beginner, intermediate, advanced)
• Ask for examples with specific grammar points
• Request cultural context explanations
• Use the suggestion buttons for quick starts

⌨️ Shortcuts:
• Enter: Send message
• Shift+Enter: New line
• Click regenerate button to get alternative responses`);
}

function showFeedback() {
    const feedback = prompt(`We'd love your feedback!

Please share:
• What features you'd like to see
• Any bugs or issues
• General suggestions for improvement

Your feedback:`);

    if (feedback && feedback.trim()) {
        alert('Thank you for your feedback! We appreciate your input and will use it to improve the app.');
        console.log('User feedback:', feedback);
    }
}

// Navigation Functions
function goToNotebook() {
    window.location.href = 'notebook.html';
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Toggle internet search
function toggleInternetSearch() {
    isInternetSearchEnabled = !isInternetSearchEnabled;
    const toggleBtn = document.getElementById('internetToggle');
    const iconOn = document.getElementById('icon-globe');
    const iconOff = document.getElementById('icon-globe-off');

    toggleBtn.classList.toggle('active', isInternetSearchEnabled);
    toggleBtn.title = isInternetSearchEnabled ? 'Internet search enabled' : 'Internet search disabled';
    iconOn.style.display = isInternetSearchEnabled ? 'block' : 'none';
    iconOff.style.display = isInternetSearchEnabled ? 'none' : 'block';
}

// Toggle Advanced RAG — styling handled entirely by the .active class in CSS
function toggleAdvancedRAG() {
    isAdvancedRAGEnabled = !isAdvancedRAGEnabled;
    const toggleBtn = document.getElementById('advancedRagToggle');

    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isAdvancedRAGEnabled);
        toggleBtn.setAttribute('aria-pressed', String(isAdvancedRAGEnabled));
        toggleBtn.title = isAdvancedRAGEnabled
            ? 'Advanced RAG enabled - Hybrid search + query expansion active'
            : 'Advanced RAG disabled - Click to enable hybrid search + query expansion';
    }

    // Show notification
    const notification = document.createElement('div');
    notification.className = isAdvancedRAGEnabled ? 'notification notification-success' : 'notification notification-info';
    notification.textContent = isAdvancedRAGEnabled
        ? '🔬 Advanced RAG enabled: Hybrid search + query expansion'
        : '📚 Advanced RAG disabled: Using standard search';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Auto-resize textarea
function autoResizeTextarea() {
    if (!messageInput) {
        console.warn('autoResizeTextarea called before messageInput is initialized');
        return;
    }
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);

    // Remove on click
    notification.onclick = () => notification.remove();
}

// Loading state management
function setLoading(loading) {
    isLoading = loading;
    const sendBtn = document.getElementById('sendBtn');
    const chat = document.getElementById('chatContainer');

    // Guard against missing elements
    if (!sendBtn || !messageInput || !chat) {
        console.warn('setLoading called before DOM elements are initialized');
        return;
    }

    sendBtn.disabled = loading;
    messageInput.disabled = loading;

    if (loading) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        `;
        chat.appendChild(loadingDiv);
        chat.scrollTop = chat.scrollHeight;
    } else {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
}
