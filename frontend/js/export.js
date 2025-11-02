// Export Conversation Module
// Functions for exporting conversations with training data option

let exportConversationId = null;

// Toggle export dropdown menu
function toggleExportMenu() {
    const dropdown = document.getElementById('exportDropdown');
    dropdown.classList.toggle('show');
}

// Close export dropdown menu
function closeExportMenu() {
    const dropdown = document.getElementById('exportDropdown');
    dropdown.classList.remove('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.getElementById('headerExportContainer');
    const dropdown = document.getElementById('exportDropdown');
    if (container && dropdown && !container.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Show export modal for a conversation
function showExportModal(conversationId) {
    exportConversationId = conversationId;
    const modal = document.getElementById('exportModal');
    
    // Get the global training preference
    const trainingEnabled = getTrainingDataPreference();
    const trainingStatus = document.getElementById('trainingStatus');
    
    if (trainingEnabled) {
        trainingStatus.innerHTML = `
            <div class="training-enabled-notice">
                <span class="status-icon">✅</span>
                <div>
                    <strong>Training Data: Enabled</strong>
                    <p>This conversation will be saved for training improvements.</p>
                    <a href="#" onclick="event.preventDefault(); showSettings();" class="settings-link">Change in Settings</a>
                </div>
            </div>
        `;
    } else {
        trainingStatus.innerHTML = `
            <div class="training-disabled-notice">
                <span class="status-icon">ℹ️</span>
                <div>
                    <strong>Training Data: Disabled</strong>
                    <p>This conversation will not be used for training.</p>
                    <a href="#" onclick="event.preventDefault(); showSettings();" class="settings-link">Enable in Settings</a>
                </div>
            </div>
        `;
    }
    
    // Show modal
    modal.style.display = 'flex';
}

// Close export modal
function closeExportModal(event) {
    if (event && event.target.id !== 'exportModal') return;
    
    const modal = document.getElementById('exportModal');
    modal.style.display = 'none';
    exportConversationId = null;
}

// Confirm and perform export
async function confirmExport() {
    if (!exportConversationId) return;
    
    // Use the global training preference
    const useForTraining = getTrainingDataPreference();
    
    try {
        const response = await fetch(`/api/conversations/${exportConversationId}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ useForTraining })
        });
        
        if (!response.ok) {
            throw new Error('Failed to export conversation');
        }
        
        const result = await response.json();
        
        // Download the JSON file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Show success message
        showNotification(result.message, 'success');
        
        // Close modal
        closeExportModal();
        
    } catch (error) {
        console.error('Error exporting conversation:', error);
        showNotification('Failed to export conversation. Please try again.', 'error');
    }
}

// Export current conversation as JSON (called from header button or menu)
function exportCurrentConversationJSON() {
    if (!currentConversationId) {
        showNotification('No active conversation to export', 'warning');
        return;
    }
    showExportModal(currentConversationId);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
