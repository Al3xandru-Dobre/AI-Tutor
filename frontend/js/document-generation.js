// Document Generation Functions
// Functions for generating PDFs, DOCX, and Markdown from conversations

/**
 * Export current conversation from header button
 */
function exportCurrentConversation() {
    if (!currentConversationId) {
        showToast('No active conversation to export', 'error');
        return;
    }
    showDocumentGenerationModal(currentConversationId);
}

/**
 * Update header export button visibility
 */
function updateHeaderExportButton() {
    const headerExportContainer = document.getElementById('headerExportContainer');
    if (headerExportContainer) {
        if (currentConversationId) {
            headerExportContainer.style.display = 'flex';
        } else {
            headerExportContainer.style.display = 'none';
        }
    }
}

/**
 * Show document generation modal
 * @param {string} conversationId - The conversation ID to generate document from
 */
function showDocumentGenerationModal(conversationId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'documentModal';
    modal.innerHTML = `
        <div class="modal-content document-modal">
            <div class="modal-header">
                <h3>📄 Generate Document</h3>
                <button class="modal-close" onclick="closeDocumentModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Choose a format to export your conversation:</p>
                <div class="document-format-buttons">
                    <button class="doc-format-btn pdf-btn" onclick="generateDocument('${conversationId}', 'pdf')">
                        <span class="format-icon">📕</span>
                        <span class="format-name">PDF</span>
                        <span class="format-desc">Portable Document Format</span>
                    </button>
                    <button class="doc-format-btn docx-btn" onclick="generateDocument('${conversationId}', 'docx')">
                        <span class="format-icon">📘</span>
                        <span class="format-name">DOCX</span>
                        <span class="format-desc">Microsoft Word Document</span>
                    </button>
                    <button class="doc-format-btn md-btn" onclick="generateDocument('${conversationId}', 'markdown')">
                        <span class="format-icon">📄</span>
                        <span class="format-name">Markdown</span>
                        <span class="format-desc">Plain Text Markdown File</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDocumentModal();
        }
    });
}

/**
 * Close document generation modal
 */
function closeDocumentModal() {
    const modal = document.getElementById('documentModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Generate document in specified format
 * @param {string} conversationId - The conversation ID
 * @param {string} format - Document format (pdf, docx, markdown)
 */
async function generateDocument(conversationId, format) {
    try {
        // Show loading state
        const loadingToast = showToast(`Generating ${format.toUpperCase()}...`, 'info', 0);

        const endpoint = `/api/documents/generate/${format}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId })
        });

        if (!response.ok) {
            throw new Error(`Failed to generate ${format.toUpperCase()}`);
        }

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `conversation.${format}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Close loading toast and show success
        if (loadingToast && loadingToast.parentElement) {
            loadingToast.remove();
        }
        showToast(`✅ ${format.toUpperCase()} downloaded successfully!`, 'success');
        closeDocumentModal();

    } catch (error) {
        console.error('Error generating document:', error);
        showToast(`❌ Failed to generate ${format.toUpperCase()}`, 'error');
    }
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, info)
 * @param {number} duration - Duration in ms (0 = persistent)
 * @returns {HTMLElement} - The toast element
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove after duration (if not persistent)
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

/**
 * Show LLM document generation modal
 */
function showLLMDocumentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'llmDocumentModal';
    modal.innerHTML = `
        <div class="modal-content llm-document-modal">
            <div class="modal-header">
                <h3>🤖 AI-Powered Document Generator</h3>
                <button class="modal-close" onclick="closeLLMDocumentModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Describe what kind of study material you want to create, and the AI will generate a comprehensive document for you!</p>

                <div class="llm-form">
                    <label for="llmPrompt" class="form-label">What would you like to learn about?</label>
                    <textarea
                        id="llmPrompt"
                        class="llm-textarea"
                        placeholder="Example: Create a study guide about Japanese honorifics with examples..."
                        rows="4"
                    ></textarea>

                    <label for="llmLevel" class="form-label">Learning Level</label>
                    <select id="llmLevel" class="llm-select">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>

                    <label class="form-label">AI Model</label>
                    <div id="llmModelSelector" class="llm-model-selector">
                        <div class="loading-models">Loading available models...</div>
                    </div>

                    <label class="form-label">Document Format</label>
                    <div class="format-buttons-grid">
                        <button class="format-choice-btn active" data-format="pdf">
                            <span class="format-icon">📕</span>
                            <span>PDF</span>
                        </button>
                        <button class="format-choice-btn" data-format="docx">
                            <span class="format-icon">📘</span>
                            <span>DOCX</span>
                        </button>
                        <button class="format-choice-btn" data-format="markdown">
                            <span class="format-icon">📄</span>
                            <span>Markdown</span>
                        </button>
                    </div>

                    <button class="generate-llm-btn" onclick="generateLLMDocument()">
                        <span>✨ Generate Document</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle format selection
    const formatBtns = modal.querySelectorAll('.format-choice-btn');

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Load model selector
    loadLLMModelSelector();

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeLLMDocumentModal();
        }
    });
}

/**
 * Load model selector for LLM document generation
 */
async function loadLLMModelSelector() {
    const container = document.getElementById('llmModelSelector');
    if (!container) return;

    try {
        // Get current model selection from main model selector if available
        let currentProvider = 'ollama';
        let currentModel = null;

        if (typeof getCurrentModelSelection === 'function') {
            const selection = getCurrentModelSelection();
            currentProvider = selection.provider || 'ollama';
            currentModel = selection.model;
        }

        // Fetch available providers
        const response = await fetch('/api/models/providers');
        if (!response.ok) throw new Error('Failed to load providers');

        const data = await response.json();
        const { providers, current } = data;

        // Use current provider from main selector if available
        const activeProvider = providers[currentProvider] ? currentProvider : current;

        // Render provider selector and models
        let html = '<div class="llm-provider-selector">';

        // Provider buttons
        html += '<div class="llm-provider-buttons">';
        Object.keys(providers).forEach(providerKey => {
            const provider = providers[providerKey];
            if (provider.available) {
                const isActive = providerKey === activeProvider ? 'active' : '';
                const speedEmoji = getSpeedEmoji(provider.speed);
                html += `
                    <button class="llm-provider-btn ${isActive}" data-provider="${providerKey}" onclick="selectLLMProvider('${providerKey}')">
                        <span class="provider-emoji">${speedEmoji}</span>
                        <span class="provider-name">${providerKey}</span>
                    </button>
                `;
            }
        });
        html += '</div>';

        // Model list container
        html += '<div id="llmModelList" class="llm-model-list"></div>';
        html += '</div>';

        container.innerHTML = html;

        // Load models for active provider
        await loadLLMModels(activeProvider, currentModel);

    } catch (error) {
        console.error('Error loading LLM model selector:', error);
        container.innerHTML = '<div class="error-message">Failed to load models. Using default.</div>';
    }
}

/**
 * Select provider for LLM document generation
 */
async function selectLLMProvider(provider) {
    // Update active state
    document.querySelectorAll('.llm-provider-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.provider === provider) {
            btn.classList.add('active');
        }
    });

    // Load models for selected provider
    await loadLLMModels(provider);
}

/**
 * Load models for selected provider in LLM modal
 */
async function loadLLMModels(provider, preselectedModel = null) {
    const modelList = document.getElementById('llmModelList');
    if (!modelList) return;

    modelList.innerHTML = '<div class="loading-models">Loading models...</div>';

    try {
        const response = await fetch(`/api/models/list?provider=${provider}`);
        if (!response.ok) throw new Error('Failed to load models');

        const data = await response.json();
        const models = data.models || [];

        if (models.length === 0) {
            modelList.innerHTML = '<div class="no-models">No models available</div>';
            return;
        }

        let html = '';
        models.forEach((modelObj, index) => {
            const modelId = typeof modelObj === 'string' ? modelObj : modelObj.id;
            const modelName = typeof modelObj === 'string' ? modelObj : modelObj.name || modelObj.id;
            const modelDesc = typeof modelObj === 'object' ? modelObj.description : 'AI language model';

            // Select first model by default, or preselected model if provided
            const isActive = (preselectedModel && modelId === preselectedModel) || (!preselectedModel && index === 0) ? 'active' : '';

            html += `
                <button class="llm-model-btn ${isActive}" data-provider="${provider}" data-model="${modelId}" onclick="selectLLMModel('${provider}', '${modelId}')">
                    <div class="llm-model-name">${modelName}</div>
                    <div class="llm-model-desc">${modelDesc}</div>
                </button>
            `;
        });

        modelList.innerHTML = html;

    } catch (error) {
        console.error('Error loading models:', error);
        modelList.innerHTML = '<div class="error-message">Failed to load models</div>';
    }
}

/**
 * Select model for LLM document generation
 */
function selectLLMModel(provider, model) {
    document.querySelectorAll('.llm-model-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.provider === provider && btn.dataset.model === model) {
            btn.classList.add('active');
        }
    });
}

/**
 * Get current LLM model selection
 */
function getCurrentLLMModelSelection() {
    const activeProviderBtn = document.querySelector('.llm-provider-btn.active');
    const activeModelBtn = document.querySelector('.llm-model-btn.active');

    return {
        provider: activeProviderBtn ? activeProviderBtn.dataset.provider : null,
        model: activeModelBtn ? activeModelBtn.dataset.model : null
    };
}

/**
 * Get speed emoji for provider (reuse from model-selector.js if available)
 */
function getSpeedEmoji(speed) {
    const emojiMap = {
        'ultra-fast': '⚡',
        'very-fast': '🚀',
        'fast': '💨',
        'medium': '🔄',
        'slow': '🐢'
    };
    return emojiMap[speed] || '🤖';
}

/**
 * Close LLM document modal
 */
function closeLLMDocumentModal() {
    const modal = document.getElementById('llmDocumentModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Generate document using LLM
 */
async function generateLLMDocument() {
    const prompt = document.getElementById('llmPrompt')?.value?.trim();
    const level = document.getElementById('llmLevel')?.value || 'beginner';
    const activeFormat = document.querySelector('.format-choice-btn.active');
    const format = activeFormat?.dataset?.format || 'pdf';

    // Get selected model and provider
    const modelSelection = getCurrentLLMModelSelection();

    if (!prompt) {
        showToast('Please describe what you want to learn about', 'error');
        return;
    }

    try {
        // Show loading state
        const generateBtn = document.querySelector('.generate-llm-btn');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span>🔄 Generating... This may take a moment</span>';
        generateBtn.disabled = true;

        const loadingToast = showToast('AI is creating your study material...', 'info', 0);

        const response = await fetch('/api/documents/generate-with-llm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                level,
                format,
                provider: modelSelection.provider,
                model: modelSelection.model
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || 'Generation failed');
        }

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `study_guide.${format}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Close loading toast and show success
        if (loadingToast && loadingToast.parentElement) {
            loadingToast.remove();
        }
        showToast(`✅ Document generated successfully!`, 'success');
        closeLLMDocumentModal();

    } catch (error) {
        console.error('Error generating LLM document:', error);
        showToast(`❌ ${error.message}`, 'error');

        // Reset button
        const generateBtn = document.querySelector('.generate-llm-btn');
        if (generateBtn) {
            generateBtn.innerHTML = '<span>✨ Generate Document</span>';
            generateBtn.disabled = false;
        }
    }
}

/**
 * Show document statistics modal
 */
async function showDocumentStats() {
    try {
        const response = await fetch('/api/documents/stats');
        if (!response.ok) throw new Error('Failed to load stats');

        const stats = await response.json();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'statsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📊 Document Statistics</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalGenerated}</div>
                            <div class="stat-label">Total Generated</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.pdfCount}</div>
                            <div class="stat-label">PDFs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.docxCount}</div>
                            <div class="stat-label">DOCX Files</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalFiles}</div>
                            <div class="stat-label">Stored Files</div>
                        </div>
                    </div>
                    ${stats.lastGenerated ? `<p class="text-muted">Last generated: ${new Date(stats.lastGenerated).toLocaleString()}</p>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load document statistics', 'error');
    }
}
