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
    const themeToggleButton = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');

    // Guard against missing elements
    if (!sunIcon || !moonIcon) {
        console.warn('Theme icons not found in DOM');
        return;
    }

    if (body.classList.contains('dark-theme')) {
        // Switch to light theme
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');

        // Show sun icon (we're in light mode, click to go dark)
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        // Switch to dark theme
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');

        // Show moon icon (we're in dark mode, click to go light)
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const body = document.body;
    const sunIcon = document.querySelector('.theme-icon-sun');
    const moonIcon = document.querySelector('.theme-icon-moon');

    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
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

    toggleBtn.style.transform = 'scale(0.95)';
    setTimeout(() => toggleBtn.style.transform = 'scale(1)', 150);
}

// Toggle Advanced RAG
function toggleAdvancedRAG() {
    isAdvancedRAGEnabled = !isAdvancedRAGEnabled;
    const toggleBtn = document.getElementById('advancedRagToggle');

    toggleBtn.classList.toggle('active', isAdvancedRAGEnabled);

    if (isAdvancedRAGEnabled) {
        toggleBtn.title = 'Advanced RAG enabled - Hybrid search + query expansion active';
        toggleBtn.style.opacity = '1';
        toggleBtn.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
        toggleBtn.style.border = '2px solid #4CAF50';
    } else {
        toggleBtn.title = 'Advanced RAG disabled - Click to enable hybrid search + query expansion';
        toggleBtn.style.opacity = '0.6';
        toggleBtn.style.backgroundColor = 'transparent';
        toggleBtn.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    }

    toggleBtn.style.transform = 'scale(0.95)';
    setTimeout(() => toggleBtn.style.transform = 'scale(1)', 150);

    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isAdvancedRAGEnabled ? '#4CAF50' : '#757575'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
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
