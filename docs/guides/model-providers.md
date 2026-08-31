*Configure the five supported LLM providers and add new ones via a single config file.*

# Model Providers

## Supported Providers

| Provider | Type | Speed | Cost | Example models | API key env var |
|----------|------|-------|------|----------------|-----------------|
| **Ollama** (default) | Local | Medium | Free | llama3:8b, mistral, qwen2.5 | — (needs a running Ollama) |
| **Cerebras** | Cloud | Ultra-fast | Paid | llama-3.3-70b, gpt-oss-120b | `CEREBRAS_API_KEY` |
| **Groq** | Cloud | Very fast | Paid | llama-3.3-70b-versatile, mixtral-8x7b | `GROQ_API_KEY` |
| **Mistral AI** | Cloud | Fast | Paid | mistral-large-latest, codestral | `MISTRAL_API_KEY` |
| **OpenRouter** | Gateway | Variable | Variable | 50+ models (Llama, Claude, GPT, Gemini…) | `OPENROUTER_API_KEY` |

All cloud providers use OpenAI-compatible APIs. Select the active provider/model with `DEFAULT_MODEL_PROVIDER` in `.env`, and set an optional per-provider model (e.g. `GROQ_MODEL=llama-3.3-70b-versatile`).

Providers with an API key set are detected and initialized automatically at startup; the rest are skipped. If a cloud provider fails at request time, the system can fall back to local Ollama.

## Runtime API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/models/providers` | All providers, availability, and model lists |
| `POST /api/models/switch` | Switch provider (`{"provider": "mistral"}`) |
| `GET /api/models/list?provider=mistral` | Models for one provider |
| `GET /api/models/stats` | Requests, latency, and error rate per provider |

The chat UI's model selector reflects all of this automatically — no frontend changes are needed when you add a provider.

## Adding a New Provider

Everything lives in `backend/config/modelProviders.js`. Add one entry:

```javascript
yourprovider: {
  id: 'yourprovider',
  name: 'Your Provider Name',
  type: 'cloud',                        // or 'local'
  baseURL: 'https://api.yourprovider.com/v1',
  envKey: 'YOURPROVIDER_API_KEY',
  envModel: 'YOURPROVIDER_MODEL',
  speed: 'fast',                        // ultra-fast | very-fast | fast | medium
  cost: 'paid',                         // free | paid | variable
  description: 'Brief description',
  defaultModels: ['model-1', 'model-2'], // fallbacks if the models API fetch fails
  models: {
    'model-1': 'Model 1 - Description',
    'model-2': 'Model 2 - Description'
  }
}
```

Then add the env vars to `.env.example` and your `.env`:

```env
YOURPROVIDER_API_KEY=your_api_key_here
YOURPROVIDER_MODEL=model-1
```

That's it — detection, initialization, model listing, and switching are automatic. To update a provider's model catalog later, edit its `models` object (and `defaultModels`) in the same file.

Programmatic use:

```javascript
const { modelProvider } = getServices();
modelProvider.setProvider('mistral');
const response = await modelProvider.generate(prompt, {
  model: 'mistral-large-latest',
  temperature: 0.7,
  maxTokens: 2000
});
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Provider not showing up | API key set in `.env`? Config valid in `modelProviders.js`? Check server init logs and `DEFAULT_MODEL_PROVIDER`. |
| Models not loading | Provider may be down or the key invalid — the system falls back to `defaultModels`. |
| Slow responses | Cloud providers depend on network; pick a smaller model or use local Ollama for low latency. |

Security notes: keep API keys in `.env` (never committed), keys are never logged or returned by the API.
