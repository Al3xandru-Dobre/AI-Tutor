// App Initialization
// Event listeners and initialization logic

// Event listeners
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

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    initializeSidebarState();
    toggleInternetSearch();
    toggleInternetSearch(); // Reset to default "on" state

    // Test server connection
    const serverOk = await testServerConnection();
    if (!serverOk) {
        console.error('⚠️ Server connection issues detected!');
        showNotification('Server connection issues. Please check if the server is running.', 'error');
    }

    await loadHistory();
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebarOverlay.classList.remove('visible');
    } else if (!isSidebarCollapsed) {
        sidebarOverlay.classList.add('visible');
    }
});
