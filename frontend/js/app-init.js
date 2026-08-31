// App Initialization
// Event listeners and initialization logic

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing application...');

    // Initialize DOM references FIRST before any event listeners
    initializeDOMReferences();
    console.log('✅ DOM references initialized');

    // Now add event listeners (after DOM references are initialized)
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            autoResizeTextarea();

            if (messageInput.value.trim()) {
                suggestionsPopup.classList.remove('visible');
            } else if (document.activeElement === messageInput) {
                suggestionsPopup.classList.add('visible');
            }
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    return;
                } else {
                    e.preventDefault();
                    if (!isLoading) sendMessage();
                }
            }
        });

        messageInput.addEventListener('focus', () => {
            if (!messageInput.value.trim()) {
                suggestionsPopup.classList.add('visible');
            }
        });

        messageInput.addEventListener('blur', () => {
            setTimeout(() => suggestionsPopup.classList.remove('visible'), 200);
        });
    }

    // Initialize UI state
    initializeSidebarState();
    initializeTheme(); // Initialize theme before anything else
    toggleInternetSearch();
    toggleInternetSearch(); // Reset to default "on" state

    // Add theme toggle event listener
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Test server connection
    console.log('🔌 Testing server connection...');
    const serverOk = await testServerConnection();
    if (!serverOk) {
        console.error('⚠️ Server connection issues detected!');
        showNotification('Server connection issues. Please check if the server is running.', 'error');
    } else {
        console.log('✅ Server connection OK');
    }

    // Load conversation history (non-blocking - don't await)
    console.log('📚 Loading conversation history...');
    loadHistory().catch(err => {
        console.error('History loading failed, but app will continue:', err);
    });
    
    console.log('✅ Application initialized successfully!');
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    // Guard against being called before DOM is ready
    if (!sidebarOverlay) {
        return;
    }

    if (window.innerWidth > 768) {
        sidebarOverlay.classList.remove('visible');
    } else if (!isSidebarCollapsed) {
        sidebarOverlay.classList.add('visible');
    }
});
