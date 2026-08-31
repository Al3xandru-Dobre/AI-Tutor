// backend/config/modelProviders.js
// Centralized provider configurations for easy management

/**
 * Provider Configuration Schema:
 * - id: unique identifier
 * - name: display name
 * - type: 'local' | 'cloud'
 * - baseURL: API endpoint
 * - envKey: environment variable for API key
 * - defaultModels: fallback models if fetch fails
 * - speed: performance indicator
 * - cost: pricing tier
 * - models: list of available models with descriptions
 */

const PROVIDER_CONFIGS = {
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    type: 'local',
    baseURL: null, // Handled by OllamaService
    envKey: null, // No API key needed
    speed: 'medium',
    cost: 'free',
    description: 'Local LLM inference on your machine',
    defaultModels: ['llama3.1', 'llama3.2', 'mistral', 'qwen2.5', 'phi'],
    models: {
      'llama3.1': 'Llama 3.1 - Meta\'s latest open model',
      'llama3.2': 'Llama 3.2 - Enhanced reasoning and multilingual',
      'mistral': 'Mistral - French AI lab\'s efficient model',
      'qwen2.5': 'Qwen 2.5 - Alibaba\'s multilingual model',
      'phi': 'Phi - Microsoft\'s compact efficient model'
    }
  },

  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    type: 'cloud',
    baseURL: 'https://api.cerebras.ai/v1',
    envKey: 'CEREBRAS_API_KEY',
    envModel: 'CEREBRAS_MODEL',
    speed: 'ultra-fast',
    cost: 'paid',
    description: 'Ultra-fast inference on Wafer-Scale Engine',
    defaultModels: ['llama-3.3-70b', 'llama3.1-8b', 'llama3.1-70b'],
    models: {
      'llama-3.3-70b': 'Llama 3.3 70B - Latest model with improved reasoning',
      'llama3.1-8b': 'Llama 3.1 8B - Fast and efficient',
      'llama3.1-70b': 'Llama 3.1 70B - High performance',
      'llama-4-scout-17b-16e-instruct': 'Llama 4 Scout - Optimized for instruction following',
      'llama-4-maverick-17b-128e-instruct': 'Llama 4 Maverick - High performance instructions',
      'gpt-oss-120b': 'Open-source GPT equivalent with 120B parameters'
    }
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    type: 'cloud',
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    envModel: 'GROQ_MODEL',
    speed: 'very-fast',
    cost: 'paid',
    description: 'LPU-powered ultra-fast inference',
    defaultModels: [
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'llama-3.1-8b-instant'
    ],
    models: {
      'llama-3.3-70b-versatile': 'Llama 3.3 70B - Versatile with better accuracy',
      'llama-3.1-8b-instant': 'Llama 3.1 8B - Instant response',
      'llama-3.1-70b-versatile': 'Llama 3.1 70B - High capability',
      'meta-llama/llama-4-maverick-17b-128e-instruct': 'Llama 4 Maverick - High performance',
      'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout - Instruction optimized',
      'meta-llama/llama-prompt-guard-2-22m': 'Llama Prompt Guard - Safety model',
      'moonshotai/kimi-k2-instruct-0905': 'Kimi K2 - Dialogue optimized',
      'qwen/qwen3-32b': 'Qwen 3 - 32B with strong reasoning',
      'qwen/qwq-32b-preview': 'Qwen QwQ - Advanced reasoning preview',
      'mixtral-8x7b-32768': 'Mixtral 8x7B - Mixture of Experts'
    }
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    type: 'cloud',
    baseURL: 'https://api.mistral.ai/v1',
    envKey: 'MISTRAL_API_KEY',
    envModel: 'MISTRAL_MODEL',
    speed: 'fast',
    cost: 'paid',
    description: 'French AI lab with efficient multilingual models',
    defaultModels: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    models: {
      'mistral-large-latest': 'Mistral Large - Most capable model for complex tasks',
      'mistral-large-2411': 'Mistral Large 24.11 - Latest large model',
      'mistral-medium-latest': 'Mistral Medium - Balanced performance and cost',
      'mistral-small-latest': 'Mistral Small - Fast and efficient',
      'mistral-small-2409': 'Mistral Small 24.09 - Optimized small model',
      'open-mistral-7b': 'Open Mistral 7B - Open weights model',
      'open-mixtral-8x7b': 'Open Mixtral 8x7B - Mixture of Experts',
      'open-mixtral-8x22b': 'Open Mixtral 8x22B - Larger MoE model',
      'codestral-latest': 'Codestral - Specialized for code generation',
      'mistral-embed': 'Mistral Embed - Text embedding model'
    }
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'cloud',
    baseURL: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    envModel: 'OPENROUTER_MODEL',
    speed: 'variable',
    cost: 'variable',
    description: 'Unified API for multiple LLM providers',
    defaultModels: [
      'deepseek/deepseek-v3.2-exp'
    ],
    models: {
      'deepseek/deepseek-v3.2-exp': 'DeepSeek V3.2 Expert - High performance'
    }
  }
};

/**
 * Get configuration for a specific provider
 */
function getProviderConfig(providerId) {
  return PROVIDER_CONFIGS[providerId] || null;
}

/**
 * Get all provider configurations
 */
function getAllProviderConfigs() {
  return PROVIDER_CONFIGS;
}

/**
 * Get list of all provider IDs
 */
function getProviderIds() {
  return Object.keys(PROVIDER_CONFIGS);
}

/**
 * Check if a provider is configured in environment
 */
function isProviderConfigured(providerId) {
  const config = PROVIDER_CONFIGS[providerId];
  if (!config) return false;
  
  // Ollama doesn't need API key
  if (providerId === 'ollama') return true;
  
  // Check if API key is set in environment
  return config.envKey && !!process.env[config.envKey];
}

/**
 * Get model description
 */
function getModelDescription(providerId, modelId) {
  const config = PROVIDER_CONFIGS[providerId];
  if (!config) return 'AI language model';
  
  return config.models[modelId] || 'AI language model';
}

module.exports = {
  PROVIDER_CONFIGS,
  getProviderConfig,
  getAllProviderConfigs,
  getProviderIds,
  isProviderConfigured,
  getModelDescription
};
