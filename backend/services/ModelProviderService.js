// backend/services/ModelProviderService.js
const OpenAI = require('openai');
const { 
  getAllProviderConfigs, 
  getProviderConfig, 
  getProviderIds,
  isProviderConfigured,
  getModelDescription 
} = require('../config/modelProviders');

/**
 * ModelProviderService - Unified interface for multiple LLM providers
 * Supports: Ollama (local), Cerebras, Groq, Mistral, OpenRouter (cloud)
 */
class ModelProviderService {
  constructor() {
    // Dynamic provider instances based on configuration
    this.providers = {};
    
    // Initialize provider storage for all configured providers
    getProviderIds().forEach(id => {
      this.providers[id] = null;
    });

    this.currentProvider = process.env.DEFAULT_MODEL_PROVIDER || 'ollama';
    this.currentModel = null; // Track current model per provider
    this.isInitialized = false;

    // Model configurations per provider (will be fetched dynamically)
    this.providerModels = {};
    getProviderIds().forEach(id => {
      this.providerModels[id] = [];
    });

    // Load all provider configurations
    this.providerConfigs = getAllProviderConfigs();

    // Statistics - dynamic based on available providers
    this.stats = {
      requests: {},
      avgLatency: {},
      errors: {}
    };
    
    getProviderIds().forEach(id => {
      this.stats.requests[id] = 0;
      this.stats.avgLatency[id] = 0;
      this.stats.errors[id] = 0;
    });
  }

  /**
   * Initialize all available providers
   */
  async initialize(ollamaService) {
    console.log('🚀 Initializing ModelProviderService...');

    try {
      // 1. Ollama (local) - already initialized
      await this._initializeOllama(ollamaService);

      // 2. Initialize cloud providers dynamically
      const cloudProviders = ['cerebras', 'groq', 'mistral', 'openrouter'];
      
      for (const providerId of cloudProviders) {
        await this._initializeCloudProvider(providerId);
      }

      // Verify we have at least one provider available
      const availableProviders = Object.keys(this.providers).filter(p => this.providers[p] !== null);

      if (availableProviders.length === 0) {
        throw new Error('No model providers available. Please configure at least one provider.');
      }

      // Set current provider to first available if current is not available
      if (!this.providers[this.currentProvider]) {
        this.currentProvider = availableProviders[0];
        console.log(`  ℹ️  Default provider not available, using ${this.currentProvider}`);
      }

      this.isInitialized = true;
      console.log(`🎯 Active provider: ${this.currentProvider}`);
      console.log(`📊 Available providers: ${availableProviders.join(', ')}`);

      return this.getAvailableProviders();

    } catch (error) {
      console.error('❌ ModelProviderService initialization error:', error);
      // Fallback to Ollama if available
      if (this.providers.ollama) {
        this.currentProvider = 'ollama';
        this.isInitialized = true;
        console.log('  ⚠️  Falling back to Ollama only');
        return this.getAvailableProviders();
      }
      throw error;
    }
  }

  /**
   * Initialize Ollama provider
   */
  async _initializeOllama(ollamaService) {
    if (ollamaService && ollamaService.isInitialized) {
      this.providers.ollama = ollamaService;
      console.log('  ✅ Ollama provider: Connected');

      // Try to fetch Ollama models (may fail if service is down)
      try {
        this.providerModels.ollama = await this._fetchOllamaModels();
      } catch (error) {
        console.log('  ⚠️  Could not fetch Ollama models, using defaults');
        const config = getProviderConfig('ollama');
        this.providerModels.ollama = config.defaultModels;
      }
    }
  }

  /**
   * Initialize a cloud provider dynamically
   */
  async _initializeCloudProvider(providerId) {
    const config = getProviderConfig(providerId);
    
    if (!config) {
      console.log(`  ⚠️  ${providerId}: No configuration found`);
      return;
    }

    if (!isProviderConfigured(providerId)) {
      console.log(`  ⚠️  ${config.name}: API key not configured`);
      return;
    }

    try {
      // Create OpenAI-compatible client
      this.providers[providerId] = new OpenAI({
        apiKey: process.env[config.envKey],
        baseURL: config.baseURL
      });

      // Test connection
      await this._testProvider(providerId);

      // Fetch available models
      try {
        this.providerModels[providerId] = await this._fetchModels(providerId);
        console.log(`  ✅ ${config.name} provider: Connected (${this.providerModels[providerId].length} models)`);
      } catch (error) {
        console.log(`  ⚠️  ${config.name}: Connected but could not fetch models, using defaults`);
        this.providerModels[providerId] = config.defaultModels;
      }
    } catch (error) {
      console.log(`  ❌ ${config.name}: Failed to initialize -`, error.message);
      this.providers[providerId] = null;
    }
  }

  /**
   * Test provider connection
   */
  async _testProvider(providerId) {
    const config = getProviderConfig(providerId);
    const testModel = process.env[config.envModel] || config.defaultModels[0];

    try {
      const response = await this.providers[providerId].chat.completions.create({
        model: testModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error(`${config.name} test failed:`, error.message);
      throw error;
    }
  }

  /**
   * Generate completion using selected provider
   * @param {string|Array} prompt - The input prompt (string) or conversation history (array of {role, content})
   * @param {object} options - Generation options
   * @returns {Promise<string>} - The generated response
   */
  async generate(prompt, options = {}) {
    const provider = options.provider || this.currentProvider;
    const startTime = Date.now();

    try {
      let response;

      if (provider === 'ollama') {
        response = await this._generateOllama(prompt, options);
      } else {
        // All cloud providers use OpenAI-compatible API
        response = await this._generateCloud(provider, prompt, options);
      }

      // Update statistics
      const latency = Date.now() - startTime;
      this._updateStats(provider, latency, false);

      return response;

    } catch (error) {
      this._updateStats(provider, Date.now() - startTime, true);
      console.error(`❌ Error with ${provider}:`, error.message);

      // Fallback mechanism
      if (provider !== 'ollama' && this.providers.ollama) {
        console.log('🔄 Falling back to Ollama...');
        return this._generateOllama(prompt, options);
      }

      throw error;
    }
  }

  /**
   * Fetch available models - unified method
   */
  async _fetchModels(providerId) {
    if (providerId === 'ollama') {
      return this._fetchOllamaModels();
    }

    // Cloud providers use OpenAI-compatible models.list()
    try {
      const response = await this.providers[providerId].models.list();
      const models = response.data.map(model => model.id);
      
      const config = getProviderConfig(providerId);
      return models.length > 0 ? models : config.defaultModels;
    } catch (error) {
      console.error(`Error fetching ${providerId} models:`, error);
      const config = getProviderConfig(providerId);
      return config.defaultModels;
    }
  }

  /**
   * Fetch available models from Ollama
   */
  async _fetchOllamaModels() {
    try {
      if (this.providers.ollama && this.providers.ollama.listModels) {
        const models = await this.providers.ollama.listModels();
        return models.map(m => m.name || m);
      }
      // Fallback to default models
      const config = getProviderConfig('ollama');
      return config.defaultModels;
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      const config = getProviderConfig('ollama');
      return config.defaultModels;
    }
  }

  /**
   * Generate using Ollama (local)
   */
  async _generateOllama(prompt, options) {
    if (!this.providers.ollama) {
      throw new Error('Ollama not initialized');
    }

    const response = await this.providers.ollama.generate(
      prompt,
      options.temperature || 0.7,
      options.maxTokens || 2000
    );

    return response;
  }

  /**
   * Generate using cloud provider (unified method)
   * Supports both single prompt and conversation history
   */
  async _generateCloud(providerId, prompt, options) {
    if (!this.providers[providerId]) {
      throw new Error(`${providerId} not configured`);
    }

    const config = getProviderConfig(providerId);
    const model = options.model || process.env[config.envModel] || config.defaultModels[0];

    // Handle conversation history (array of messages) vs single prompt (string)
    let messages;
    if (Array.isArray(prompt)) {
      // Prompt is already a conversation history array
      messages = prompt;
      console.log(`💬 Using conversation history with ${messages.length} messages for ${config.name}`);
    } else {
      // Single prompt - convert to message format
      messages = [{ role: 'user', content: prompt }];
    }

    const response = await this.providers[providerId].chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,  // Increased default from 2000 to 4000
      stream: false
    });

    const content = response.choices[0].message.content;

    // Check if response was potentially truncated
    if (response.choices[0].finish_reason === 'length') {
      console.warn(`⚠️  Response may be truncated (hit max_tokens limit for ${config.name})`);
      console.warn(`   Consider increasing maxTokens or using a model with larger context`);
    }

    return content;
  }

  /**
   * Set active provider
   */
  setProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider ${providerName} not available`);
    }
    this.currentProvider = providerName;
    console.log(`🔄 Switched to provider: ${providerName}`);
  }

  /**
   * Get available models for a specific provider
   */
  async getAvailableModels(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return this.providerModels[providerName] || [];
  }

  /**
   * Set active model for a provider
   */
  setModel(providerName, modelName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider ${providerName} not available`);
    }

    const availableModels = this.providerModels[providerName];
    if (!availableModels.includes(modelName)) {
      console.warn(`Model ${modelName} not in available list for ${providerName}, but will try to use it`);
    }

    this.currentModel = modelName;
    console.log(`🔄 Set model to: ${modelName} for provider ${providerName}`);
  }

  /**
   * Get description for a model
   */
  getModelDescription(modelId) {
    // Try to find in any provider's configuration
    for (const providerId of getProviderIds()) {
      const description = getModelDescription(providerId, modelId);
      if (description !== 'AI language model') {
        return description;
      }
    }
    return 'AI language model';
  }

  /**
   * Get list of available providers with model descriptions
   */
  getAvailableProviders() {
    // Add descriptions to models
    const addDescriptions = (models, providerId) => {
      return models.map(model => ({
        id: model,
        name: model,
        description: getModelDescription(providerId, model)
      }));
    };

    const result = {
      current: this.currentProvider,
      currentModel: this.currentModel,
      available: Object.keys(this.providers).filter(p => this.providers[p] !== null),
      providers: {}
    };

    // Build provider information dynamically
    for (const providerId of getProviderIds()) {
      const config = getProviderConfig(providerId);
      result.providers[providerId] = {
        available: !!this.providers[providerId],
        type: config.type,
        speed: config.speed,
        cost: config.cost,
        description: config.description,
        models: addDescriptions(this.providerModels[providerId] || [], providerId)
      };
    }

    return result;
  }

  /**
   * Update statistics
   */
  _updateStats(provider, latency, isError) {
    this.stats.requests[provider]++;
    
    if (isError) {
      this.stats.errors[provider]++;
    } else {
      // Calculate running average latency
      const prevAvg = this.stats.avgLatency[provider];
      const count = this.stats.requests[provider] - this.stats.errors[provider];
      this.stats.avgLatency[provider] = 
        (prevAvg * (count - 1) + latency) / count;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentProvider: this.currentProvider,
      available: this.getAvailableProviders()
    };
  }
}

module.exports = ModelProviderService;