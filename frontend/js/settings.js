// Settings Module
// Functions for managing settings, privacy, and system configuration

async function showSettings() {
    window.location.href = 'settings.html';
}

async function showSettingsModal() {
    const settingsModal = document.createElement('div');
    settingsModal.className = 'settings-modal-overlay';
    settingsModal.innerHTML = `
        <div class="settings-modal">
            <div class="settings-header">
                <h3>⚙️ Settings</h3>
                <button class="close-btn" onclick="closeSettings()">&times;</button>
            </div>
            <div class="settings-content">
                <div class="setting-group">
                    <h4>🔍 Knowledge Base (Enhanced RAG)</h4>
                    <div class="setting-item">
                        <p class="setting-description" style="margin: 0;">
                            <strong>📚 ChromaDB Vector Search:</strong> <span id="chromadbStatus" style="color: #4CAF50; font-weight: bold;">Always Active</span><br>
                            Advanced AI-powered semantic search through your local Japanese learning materials (grammar books, PDFs).
                            This feature is always enabled and provides the core knowledge base functionality.
                        </p>
                    </div>
                </div>

                <div class="setting-group">
                    <h4>🌐 Optional Features</h4>
                    <div class="setting-item">
                        <label class="toggle-container">
                            <span>Internet Search</span>
                            <input type="checkbox" id="internetToggleSetting" ${isInternetSearchEnabled ? 'checked' : ''} onchange="toggleInternetFromSettings()">
                            <span class="toggle-slider"></span>
                        </label>
                        <p class="setting-description">Enable web search for current information and additional resources beyond local materials</p>
                    </div>
                    <div class="setting-item">
                        <label class="toggle-container">
                            <span>Personalized Learning (History RAG)</span>
                            <input type="checkbox" id="historyRagToggle" onchange="toggleHistoryRAG()">
                            <span class="toggle-slider"></span>
                        </label>
                        <p class="setting-description">
                            <strong>Separate from Knowledge Base:</strong> Analyzes your conversation history to provide personalized responses.
                            <strong>Your data is encrypted and anonymized.</strong> This is optional and independent from the ChromaDB knowledge base.
                        </p>
                    </div>
                </div>

                <div class="setting-group">
                    <h4>🔒 Privacy & Data</h4>
                    <div class="setting-item">
                        <label class="toggle-container">
                            <span>Contribute to Training Data</span>
                            <input type="checkbox" id="trainingDataToggle" ${getTrainingDataPreference() ? 'checked' : ''} onchange="toggleTrainingDataPreference()">
                            <span class="toggle-slider"></span>
                        </label>
                        <p class="setting-description">
                            <strong>Global Setting:</strong> When enabled, ALL your conversations are copied to the training folder.
                            When disabled, all conversations are removed from training data. This helps improve the AI tutor for everyone.
                        </p>
                    </div>
                    <div class="privacy-status" id="trainingDataStatus">
                        <p>Loading training data status...</p>
                    </div>
                    <div class="privacy-status" id="privacyStatus">
                        <p>Loading privacy status...</p>
                    </div>
                    <div class="setting-item">
                        <button class="privacy-btn" onclick="showPrivacyDetails()">View Privacy Details</button>
                        <button class="privacy-btn" onclick="exportTrainingData()">Export Training Data</button>
                        <button class="privacy-btn" onclick="clearAllData()">Clear All Data</button>
                    </div>
                </div>

                <div class="setting-group">
                    <h4>📊 Current Configuration</h4>
                    <div class="config-info">
                        <p>• Model: <span id="configModel">Loading...</span></p>
                        <p>• RAG Mode: <span id="configRAGMode">Loading...</span></p>
                        <p>• Internet Search: <span id="configInternet">${isInternetSearchEnabled ? 'Enabled' : 'Disabled'}</span></p>
                        <p>• History RAG: <span id="configHistoryRAG">Loading...</span></p>
                        <p>• Level: Beginner (auto-detected)</p>
                        <p>• Language: English explanations</p>
                    </div>
                </div>

                <div class="setting-group">
                    <h4>ℹ️ Feature Guide</h4>
                    <div class="config-info" style="font-size: 0.9em;">
                        <p><strong>📚 Knowledge Base</strong><br>
                           Vector semantic search through local Japanese learning materials using ChromaDB</p>
                        <p><strong>🌐 Internet Search</strong><br>
                           Real-time web search for up-to-date information and examples</p>
                        <p><strong>🧠 History</strong><br>
                           References past conversations for contextual understanding</p>
                        <p><strong>✨ Personalized</strong><br>
                           Adapts responses based on your learning patterns (privacy-aware)</p>
                    </div>
                </div>
            </div>
            <div class="settings-footer">
                <button class="settings-btn primary" onclick="closeSettings()">Done</button>
            </div>
        </div>
    `;

    document.body.appendChild(settingsModal);

    // Load current settings
    await loadPrivacySettings();
    await loadSystemStatus();
    await loadTrainingDataStats();
}

async function loadTrainingDataStats() {
    try {
        const response = await fetch('/api/conversations/training/stats');
        if (response.ok) {
            const stats = await response.json();
            const trainingDataStatus = document.getElementById('trainingDataStatus');
            const isEnabled = getTrainingDataPreference();

            if (trainingDataStatus) {
                trainingDataStatus.innerHTML = `
                    <div class="privacy-indicator ${isEnabled ? 'enabled' : 'disabled'}">
                        <strong>Training Data Status:</strong> ${isEnabled ? 'Enabled' : 'Disabled'}<br>
                        <strong>Conversations in Training Folder:</strong> ${stats.count || 0}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Failed to load training data stats:', error);
        const trainingDataStatus = document.getElementById('trainingDataStatus');
        if (trainingDataStatus) {
            trainingDataStatus.innerHTML = `
                <div class="privacy-indicator disabled">
                    <strong>Training Data Status:</strong> Unable to load
                </div>
            `;
        }
    }
}

async function loadPrivacySettings() {
    try {
        const response = await fetch('/api/rag/history-rag/stats');
        if (response.ok) {
            const stats = await response.json();
            const historyToggle = document.getElementById('historyRagToggle');
            const privacyStatus = document.getElementById('privacyStatus');

            if (historyToggle) {
                historyToggle.checked = stats.enabled || false;
            }

            if (privacyStatus) {
                privacyStatus.innerHTML = `
                    <div class="privacy-indicator ${stats.enabled ? 'enabled' : 'disabled'}">
                        <strong>History RAG Status:</strong> ${stats.enabled ? 'Enabled' : 'Disabled'}<br>
                        <strong>Data Encryption:</strong> ${stats.encryption_enabled ? 'Yes' : 'No'}<br>
                        <strong>Anonymization:</strong> ${stats.data_anonymized ? 'Yes' : 'No'}<br>
                        <strong>Indexed Conversations:</strong> ${stats.total_conversations_indexed || 0}
                    </div>
                `;
            }

            const configHistoryRAG = document.getElementById('configHistoryRAG');
            if (configHistoryRAG) {
                configHistoryRAG.textContent = stats.enabled ? 'Enabled (Encrypted)' : 'Disabled';
            }
        }
    } catch (error) {
        console.error('Failed to load privacy settings:', error);
    }
}

async function loadSystemStatus() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            const health = await response.json();

            // Update model and RAG mode
            const configModel = document.getElementById('configModel');
            if (configModel) {
                const modelText = health.current_model || 'Not connected';
                const ragMode = health.rag?.mode || 'unknown';
                const ragIcon = ragMode === 'chromadb' ? '🔷' : '📁';
                configModel.innerHTML = `${modelText} • ${ragIcon} ${ragMode.toUpperCase()}`;
            }

            // Update RAG mode in config display
            const configRAGMode = document.getElementById('configRAGMode');
            if (configRAGMode) {
                const ragMode = health.rag?.mode || 'unknown';
                const status = health.rag?.status || 'unknown';
                const icon = ragMode === 'chromadb' ? '🔷' : '📁';
                const color = status === 'ready' ? '#4CAF50' : '#ff9800';
                configRAGMode.innerHTML = `<span style="color: ${color}">${icon} ${ragMode.toUpperCase()} (${status})</span>`;
            }

            // Update ChromaDB status indicator in settings
            const chromadbStatus = document.getElementById('chromadbStatus');
            if (chromadbStatus) {
                const ragMode = health.rag?.mode || 'unknown';
                const isChroma = ragMode === 'chromadb';
                chromadbStatus.innerHTML = isChroma
                    ? '<span style="color: #4CAF50;">✅ Active (ChromaDB)</span>'
                    : '<span style="color: #ff9800;">⚠️ Legacy Mode</span>';
            }
        }
    } catch (error) {
        console.error('Failed to load system status:', error);
    }
}

function toggleInternetFromSettings() {
    const toggle = document.getElementById('internetToggleSetting');
    isInternetSearchEnabled = toggle.checked;

    // Update main toggle as well
    const mainToggle = document.getElementById('internetToggle');
    const iconOn = document.getElementById('icon-globe');
    const iconOff = document.getElementById('icon-globe-off');

    mainToggle.classList.toggle('active', isInternetSearchEnabled);
    mainToggle.title = isInternetSearchEnabled ? 'Internet search enabled' : 'Internet search disabled';
    iconOn.style.display = isInternetSearchEnabled ? 'block' : 'none';
    iconOff.style.display = isInternetSearchEnabled ? 'none' : 'block';

    // Update config display
    const configInternet = document.getElementById('configInternet');
    if (configInternet) {
        configInternet.textContent = isInternetSearchEnabled ? 'Enabled' : 'Disabled';
    }
}

async function toggleHistoryRAG() {
    const toggle = document.getElementById('historyRagToggle');
    const enabled = toggle.checked;

    try {
        const response = await fetch('/api/rag/history-rag/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enable: enabled })
        });

        if (response.ok) {
            await loadPrivacySettings(); // Reload privacy status

            // Show confirmation
            const message = enabled
                ? 'Personalized learning enabled! Your conversations will now be used to improve responses (encrypted & anonymized).'
                : 'Personalized learning disabled. Your conversation history will not be used for responses.';

            showNotification(message, enabled ? 'success' : 'info');
        } else {
            throw new Error('Failed to update settings');
        }
    } catch (error) {
        console.error('Failed to toggle History RAG:', error);
        toggle.checked = !enabled; // Revert toggle
        showNotification('Failed to update privacy settings. Please try again.', 'error');
    }
}

function showPrivacyDetails() {
    alert(`🔒 Privacy & Data Protection

✅ PRIVACY MEASURES:
• All conversation data is anonymized using cryptographic hashing
• Content is encrypted using bcrypt with high salt rounds
• Original conversation IDs are replaced with anonymous hashes
• No personal information is stored in learning profiles

🔐 DATA SECURITY:
• Local storage only - your data never leaves your device
• Perfect hash functions prevent data de-anonymization
• Encryption keys are generated per session
• You can disable/clear data anytime

📊 WHAT WE USE:
• Topics discussed (anonymized)
• Grammar patterns encountered
• Vocabulary frequency (Japanese words only)
• Learning progression patterns

❌ WHAT WE DON'T STORE:
• Personal information
• Raw conversation content (when encrypted)
• User identifiers
• IP addresses or session data

You have full control over your data and can disable this feature anytime.`);
}

async function exportTrainingData() {
    try {
        // First check if there is any training data
        const statsResponse = await fetch('/api/conversations/training/stats');
        if (!statsResponse.ok) {
            throw new Error('Failed to check training data');
        }

        const stats = await statsResponse.json();
        if (stats.count === 0) {
            showNotification('No training data available to export. Enable training data contribution first.', 'warning');
            return;
        }

        // Fetch the training data
        const response = await fetch('/api/conversations/training/export');
        if (!response.ok) {
            throw new Error('Failed to export training data');
        }

        const result = await response.json();

        // Create and download the JSON file
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

        showNotification(result.message, 'success');

    } catch (error) {
        console.error('Error exporting training data:', error);
        showNotification('Failed to export training data. Please try again.', 'error');
    }
}

async function clearAllData() {
    const confirmed = confirm(`⚠️ Clear All Learning Data

This will permanently delete:
• All conversation history
• Your learning profile
• Personalized recommendations
• Conversation memory

This action cannot be undone. Are you sure?`);

    if (confirmed) {
        try {
            const response = await fetch('/api/conversations', { method: 'DELETE' });
            if (response.ok) {
                showNotification('All data cleared successfully!', 'success');

                // Reset UI
                currentConversationId = null;
                conversationHistory = [];
                startNewChat();
                await loadHistory();
                await loadPrivacySettings();
            } else {
                throw new Error('Failed to clear data');
            }
        } catch (error) {
            console.error('Failed to clear data:', error);
            showNotification('Failed to clear data. Please try again.', 'error');
        }
    }
}

function closeSettings() {
    const modal = document.querySelector('.settings-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Training Data Preference Management
function getTrainingDataPreference() {
    const preference = localStorage.getItem('trainingDataEnabled');
    // Default to false (opt-in)
    return preference === 'true';
}

function setTrainingDataPreference(enabled) {
    localStorage.setItem('trainingDataEnabled', enabled.toString());
}

async function toggleTrainingDataPreference() {
    const checkbox = document.getElementById('trainingDataToggle');
    const enabled = checkbox.checked;

    try {
        // Sync all conversations to/from training folder
        const response = await fetch('/api/conversations/training/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });

        if (!response.ok) {
            throw new Error('Failed to sync training data');
        }

        const result = await response.json();

        // Update local preference
        setTrainingDataPreference(enabled);

        // Reload training data stats to show updated count
        await loadTrainingDataStats();

        const message = enabled
            ? `✅ Thank you for contributing! ${result.count} conversation(s) copied to training data.`
            : `Training data contribution disabled. ${result.count} conversation(s) removed from training data.`;

        showNotification(message, enabled ? 'success' : 'info');

    } catch (error) {
        console.error('Error toggling training data:', error);

        // Revert checkbox state
        checkbox.checked = !enabled;

        showNotification('Failed to update training data settings. Please try again.', 'error');
    }
}
