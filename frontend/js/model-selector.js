// Model Selector Module
// Handles model provider and model selection

let currentProvider = null;
let currentModel = null;
let availableProviders = null;

/**
 * Initialize model selector
 */
async function initializeModelSelector() {
    console.log('🔧 Initializing Model Selector...');

    try {
        await fetchProviders();
        renderModelSelector();
        console.log('✅ Model Selector initialized');
    } catch (error) {
        console.error('❌ Failed to initialize model selector:', error);
    }
}

/**
 * Fetch available providers and their models
 */
async function fetchProviders() {
    try {
        const response = await fetch('/api/models/providers');
        const data = await response.json();

        availableProviders = data;
        currentProvider = data.current;
        currentModel = data.currentModel;

        console.log('📦 Providers loaded:', data);
        return data;
    } catch (error) {
        console.error('Error fetching providers:', error);
        throw error;
    }
}

/**
 * Fetch models for a specific provider
 */
async function fetchModelsForProvider(provider) {
    try {
        const response = await fetch(`/api/models/list?provider=${provider}`);
        const data = await response.json();
        return data.models || [];
    } catch (error) {
        console.error(`Error fetching models for ${provider}:`, error);
        return [];
    }
}

/**
 * Render the model selector UI (small icon button)
 */
function renderModelSelector() {
    const container = document.getElementById('modelSelectorContainer');
    if (!container || !availableProviders) return;

    const { providers, current } = availableProviders;
    const speedEmoji = getSpeedEmoji(providers[current]?.speed || 'medium');

    // Create small icon button
    let html = `
        <button class="model-icon-btn" onclick="openModelModal()" id="modelIconBtn" title="Select AI Model">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            <span class="model-badge">${speedEmoji}</span>
        </button>

        <!-- Modal -->
        <div class="model-modal-overlay" id="modelModalOverlay" style="display: none;" onclick="closeModelModal()">
            <div class="model-modal" onclick="event.stopPropagation()">
                <div class="model-modal-header">
                    <h3>Select AI Model</h3>
                    <button class="model-modal-close" onclick="closeModelModal()">×</button>
                </div>

                <div class="model-modal-body">
                    <!-- Provider Selection -->
                    <div class="model-modal-section">
                        <label class="model-modal-label">Provider</label>
                        <div class="provider-grid">
    `;

    // Add provider cards
    for (const [providerName, providerInfo] of Object.entries(providers)) {
        if (providerInfo.available) {
            const isActive = providerName === current;
            const emoji = getSpeedEmoji(providerInfo.speed);
            html += `
                <button class="provider-card ${isActive ? 'active' : ''}"
                        onclick="selectProvider('${providerName}')"
                        data-provider="${providerName}">
                    <span class="provider-card-emoji">${emoji}</span>
                    <div class="provider-card-info">
                        <div class="provider-card-name">${providerName.toUpperCase()}</div>
                        <div class="provider-card-meta">${providerInfo.type} • ${providerInfo.cost}</div>
                    </div>
                    ${isActive ? '<span class="provider-card-check">✓</span>' : ''}
                </button>
            `;
        }
    }

    html += `
                        </div>
                    </div>

                    <!-- Model Selection -->
                    <div class="model-modal-section">
                        <label class="model-modal-label">Model</label>
                        <div class="model-list" id="modelListModal">
                            <div class="loading-models">Loading models...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Load models for current provider
    if (current) {
        loadModelsForProvider(current);
    }
}

/**
 * Open model selection modal
 */
function openModelModal() {
    const overlay = document.getElementById('modelModalOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

/**
 * Close model selection modal
 */
function closeModelModal() {
    const overlay = document.getElementById('modelModalOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
    }
}

/**
 * Select a provider
 */
function selectProvider(providerName) {
    currentProvider = providerName;

    // Update UI
    document.querySelectorAll('.provider-card').forEach(card => {
        card.classList.remove('active');
        const check = card.querySelector('.provider-card-check');
        if (check) check.remove();
    });

    const selectedCard = document.querySelector(`[data-provider="${providerName}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
        selectedCard.innerHTML += '<span class="provider-card-check">✓</span>';
    }

    // Load models for this provider
    loadModelsForProvider(providerName);
}

/**
 * Load and display models for a provider
 */
async function loadModelsForProvider(provider) {
    const modelList = document.getElementById('modelListModal');
    if (!modelList) return;

    modelList.innerHTML = '<div class="loading-models">Loading models...</div>';

    try {
        const models = availableProviders.providers[provider]?.models || [];

        if (models.length === 0) {
            modelList.innerHTML = '<div class="no-models">No models available</div>';
            return;
        }

        let html = '';

        models.forEach(modelObj => {
            // Handle both old format (string) and new format (object with description)
            const modelId = typeof modelObj === 'string' ? modelObj : modelObj.id;
            const modelName = typeof modelObj === 'string' ? modelObj : modelObj.name;
            const modelDesc = typeof modelObj === 'object' ? modelObj.description : 'AI language model';

            const isActive = modelId === currentModel;

            html += `
                <button class="model-card ${isActive ? 'active' : ''}"
                        onclick="selectModelFromModal('${provider}', '${modelId}')"
                        data-model="${modelId}">
                    <div class="model-card-header">
                        <span class="model-card-name">${modelName}</span>
                        ${isActive ? '<span class="model-card-check">✓</span>' : ''}
                    </div>
                    <div class="model-card-description">${modelDesc}</div>
                </button>
            `;
        });

        modelList.innerHTML = html;
    } catch (error) {
        console.error('Error loading models:', error);
        modelList.innerHTML = '<div class="error-models">Failed to load models</div>';
    }
}

/**
 * Handle provider change
 */
async function onProviderChange(provider) {
    console.log(`🔄 Switching to provider: ${provider}`);
    currentProvider = provider;
    currentModel = null; // Reset model selection

    // Update display
    updateCurrentDisplay();

    await loadModelsForProvider(provider);

    // Notify user
    showNotification(`Switched to ${provider}`, 'info');
}

/**
 * Select model from modal
 */
function selectModelFromModal(provider, model) {
    selectModel(provider, model);
    closeModelModal();
}

/**
 * Select a specific model
 */
function selectModel(provider, model) {
    console.log(`✅ Selected model: ${model} from ${provider}`);
    currentProvider = provider;
    currentModel = model;

    // Update badge
    const badge = document.querySelector('.model-badge');
    if (badge && availableProviders) {
        const speedEmoji = getSpeedEmoji(availableProviders.providers[provider]?.speed);
        badge.textContent = speedEmoji;
    }

    showNotification(`Selected ${model}`, 'success');
}

/**
 * Get current model selection
 */
function getCurrentModelSelection() {
    return {
        provider: currentProvider,
        model: currentModel
    };
}

/**
 * Get speed emoji for provider
 */
function getSpeedEmoji(speed) {
    const emojiMap = {
        'ultra-fast': '⚡',
        'very-fast': '🚀',
        'fast': '✈️',
        'medium': '🚗',
        'slow': '🐌'
    };
    return emojiMap[speed] || '🤖';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // You can implement a toast notification here
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Simple alert for now (you can enhance this with a toast library)
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModelSelector);
} else {
    initializeModelSelector();
}
