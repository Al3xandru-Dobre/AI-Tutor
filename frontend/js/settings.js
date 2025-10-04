// Settings Module
// Functions for managing settings, privacy, and system configuration

async function showSettings() {
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
                    <h4>🔒 Privacy</h4>
                    <div class="privacy-status" id="privacyStatus">
                        <p>Loading privacy status...</p>
                    </div>
                    <div class="setting-item">
                        <button class="privacy-btn" onclick="showPrivacyDetails()">View Privacy Details</button>
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
                        <strong>Status:</strong> ${stats.enabled ? 'Enabled' : 'Disabled'}<br>
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
