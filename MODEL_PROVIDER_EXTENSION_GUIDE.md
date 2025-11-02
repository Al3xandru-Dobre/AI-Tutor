# Model Provider System - Extension Guide

## 📋 Overview

The AI Tutor now supports **5 model providers** with an extensible architecture that makes it easy to add new providers or update model lists.

## 🎯 Current Providers

### 1. **Ollama** (Local)
- **Type**: Local inference
- **Cost**: Free
- **Speed**: Medium (depends on hardware)
- **Models**: llama3.1, llama3.2, mistral, qwen2.5, phi
- **Setup**: Requires Ollama running locally

### 2. **Cerebras** (Cloud)
- **Type**: Cloud API
- **Cost**: Paid
- **Speed**: Ultra-fast (Wafer-Scale Engine)
- **Models**: llama-3.3-70b, llama3.1-8b/70b, llama-4-scout/maverick, gpt-oss-120b
- **API**: https://api.cerebras.ai

### 3. **Groq** (Cloud)
- **Type**: Cloud API
- **Cost**: Paid
- **Speed**: Very fast (LPU-powered)
- **Models**: llama-3.3-70b-versatile, mixtral-8x7b, qwen models, moonshot models
- **API**: https://api.groq.com

### 4. **Mistral AI** (Cloud) ⭐ NEW
- **Type**: Cloud API
- **Cost**: Paid
- **Speed**: Fast
- **Models**: mistral-large/medium/small, mixtral-8x7b/8x22b, codestral
- **API**: https://api.mistral.ai
- **Specialty**: Efficient multilingual models, strong French support

### 5. **OpenRouter** (Cloud) ⭐ NEW
- **Type**: Cloud API Gateway
- **Cost**: Variable (depends on model)
- **Speed**: Variable (depends on model)
- **Models**: Access to 50+ models from multiple providers
  - Meta Llama (3.1, 3.2, 3.3)
  - Anthropic Claude (3, 3.5)
  - OpenAI GPT (3.5, 4, 4o)
  - Google Gemini (Pro, Flash)
  - Mistral, Qwen, DeepSeek, and more
- **API**: https://openrouter.ai
- **Specialty**: Single API for multiple providers, automatic fallback

## 🔧 Architecture

### File Structure

```
backend/
├── config/
│   └── modelProviders.js     # ⭐ CENTRALIZED PROVIDER CONFIG
├── services/
│   └── ModelProviderService.js  # Core service (uses config)
└── routes/
    └── modelProviderRoute.js    # API endpoints
```

### Key Design Principles

1. **Separation of Concerns**: Provider configurations are separate from business logic
2. **Easy Extension**: Add new providers by editing one config file
3. **Model Organization**: Clear mapping of which models belong to which provider
4. **Automatic Discovery**: System automatically detects and initializes available providers

## 📝 How to Add a New Provider

### Step 1: Add Provider Configuration

Edit `backend/config/modelProviders.js`:

```javascript
const PROVIDER_CONFIGS = {
  // ... existing providers ...
  
  yourprovider: {
    id: 'yourprovider',
    name: 'Your Provider Name',
    type: 'cloud', // or 'local'
    baseURL: 'https://api.yourprovider.com/v1',
    envKey: 'YOURPROVIDER_API_KEY',
    envModel: 'YOURPROVIDER_MODEL',
    speed: 'fast', // ultra-fast | very-fast | fast | medium
    cost: 'paid', // free | paid | variable
    description: 'Brief description of this provider',
    defaultModels: ['model-1', 'model-2'], // Fallback models
    models: {
      'model-1': 'Model 1 - Description',
      'model-2': 'Model 2 - Description',
      // Add more models...
    }
  }
};
```

### Step 2: Update Environment Variables

Add to `.env.example` and your `.env` file:

```bash
# Your Provider Configuration
YOURPROVIDER_API_KEY=your_api_key_here
YOURPROVIDER_MODEL=model-1
```

### Step 3: That's It! 🎉

The system will automatically:
- ✅ Detect your provider configuration
- ✅ Initialize the API client
- ✅ Fetch available models
- ✅ Add it to the provider list
- ✅ Enable switching via API

**No changes needed** to `ModelProviderService.js` or routes!

## 🔄 How to Update Model Lists

### For a Specific Provider

Edit `backend/config/modelProviders.js` and update the `models` object:

```javascript
mistral: {
  // ... other config ...
  models: {
    'mistral-large-latest': 'Mistral Large - Most capable',
    'new-model-id': 'New Model - Description', // ⭐ ADD HERE
    // ... other models ...
  }
}
```

### Update Default Models

If you want to change the fallback models (used when API fetch fails):

```javascript
mistral: {
  // ... other config ...
  defaultModels: ['mistral-large-latest', 'mistral-small-latest'], // ⭐ UPDATE HERE
}
```

## 📡 API Endpoints

### Get All Providers
```http
GET /api/models/providers
```

Response:
```json
{
  "current": "ollama",
  "currentModel": null,
  "available": ["ollama", "groq", "mistral"],
  "providers": {
    "ollama": {
      "available": true,
      "type": "local",
      "speed": "medium",
      "cost": "free",
      "description": "Local LLM inference",
      "models": [
        {
          "id": "llama3.1",
          "name": "llama3.1",
          "description": "Llama 3.1 - Meta's latest"
        }
      ]
    }
  }
}
```

### Switch Provider
```http
POST /api/models/switch
Content-Type: application/json

{
  "provider": "mistral"
}
```

### Get Models for Provider
```http
GET /api/models/list?provider=mistral
```

### Get Statistics
```http
GET /api/models/stats
```

## 🎯 Frontend Integration

The model selector UI automatically adapts to show all available providers and their models. No frontend changes needed when adding providers!

## 🔍 Provider-Specific Notes

### Mistral AI
- Known for efficient models with strong multilingual support
- Excellent for European languages, especially French
- Codestral model specializes in code generation
- Mix of open-weight and proprietary models

### OpenRouter
- Acts as a gateway to 50+ models from different providers
- Automatic fallback if primary model is unavailable
- Single API key for multiple providers
- Variable pricing based on chosen model
- Great for experimentation and A/B testing

## 🛠️ Configuration Best Practices

1. **API Keys**: Store in `.env`, never commit to git
2. **Default Models**: Choose stable, reliable models as defaults
3. **Model Descriptions**: Keep them concise but informative
4. **Speed/Cost Labels**: Be realistic and update based on actual performance
5. **Testing**: Always test new providers with a simple query first

## 🚀 Usage Example

```javascript
// In your code, switching providers is simple:
const { modelProvider } = getServices();

// Switch to Mistral
modelProvider.setProvider('mistral');

// Generate with specific model
const response = await modelProvider.generate(prompt, {
  model: 'mistral-large-latest',
  temperature: 0.7,
  maxTokens: 2000
});

// Or let it use the default model
const response2 = await modelProvider.generate(prompt);
```

## 📊 Statistics Tracking

The system automatically tracks:
- Request count per provider
- Average latency per provider
- Error rate per provider

Access via `/api/models/stats`

## 🔐 Security Considerations

- API keys are stored in environment variables
- Never expose API keys in logs or responses
- Each provider has independent authentication
- Fallback to local Ollama if cloud providers fail

## 🆘 Troubleshooting

### Provider Not Showing Up
1. Check API key is set in `.env`
2. Verify configuration in `modelProviders.js`
3. Check server logs for initialization errors
4. Ensure `DEFAULT_MODEL_PROVIDER` is valid

### Models Not Loading
1. Provider might be down - check status page
2. API key might be invalid
3. System falls back to `defaultModels`
4. Check network connectivity

### Slow Performance
1. Cloud providers depend on internet speed
2. Consider using Ollama for offline/low-latency needs
3. Choose faster models (smaller parameter count)
4. Check provider status page

## 📚 Additional Resources

- [Cerebras Documentation](https://docs.cerebras.ai)
- [Groq Documentation](https://docs.groq.com)
- [Mistral AI Documentation](https://docs.mistral.ai)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Ollama Documentation](https://ollama.ai/docs)

---

**Made with ❤️ for extensibility and ease of maintenance**
