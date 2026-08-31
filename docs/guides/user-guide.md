*User guide for the Japanese AI Tutor: how to start the app, chat, use the knowledge sources, manage history and privacy, review vocabulary, and export conversations.*

# User Guide

## Getting Started

1. **Start the required services** (see the [README](../../README.md) for one-time setup):

   ```bash
   # ChromaDB (knowledge base)
   cd backend/chromaDB && docker compose up -d && cd ../..

   # Server
   npm start
   ```

2. **Open the app** at <http://localhost:3000> and register an account, or use **Guest chat** to try the tutor without one.

3. **Ask a question** in the input box and press **Enter** (**Shift + Enter** inserts a newline).

## Chat

### Knowledge sources

Each response shows badges telling you which sources were used:

| Badge | Meaning |
|-------|---------|
| 📚 **Knowledge Base** | Semantic search over your local Japanese learning materials (ChromaDB). Always active when ChromaDB is running. |
| 🌐 **Internet** | Live web search for current information, slang, and contemporary usage. |
| 🧠 **History** | Context from your past conversations (History RAG). |
| ✨ **Personalized** | Explanations adapted to your learning patterns and level. |

### Toggles in the input bar

- **🌐 Internet search** — click the globe to toggle. Solid/blue = on, crossed out = off. If a search fails, the tutor falls back to local knowledge.
- **🔬 Advanced RAG** — enables hybrid search (semantic + keyword) plus query expansion and reranking for better recall on complex or ambiguous questions. Costs a bit of extra latency. See [ChromaDB & RAG modes](chromadb.md).

### Model selector

The selector below the chat input lets you switch provider and model at any time — for example the local **Ollama** models, or cloud providers (Cerebras, Groq, Mistral, OpenRouter) if you configured API keys. See [Model Providers](model-providers.md).

### Conversation history

- Conversations are saved automatically and listed in the left sidebar; click one to reload it.
- Delete individual conversations or clear everything from the sidebar.
- Follow-up questions work naturally: "Earlier you explained は — how does it work with adjectives?"

### Privacy-aware personalization

Opt in via **Settings → Enable History-Based Personalization**. When enabled:

- Conversation identifiers are hashed (HMAC SHA-256) and content is encrypted before storage.
- Only learning patterns (grammar topics, vocabulary) are analyzed — original conversations are untouched.
- **Privacy Details** shows exactly what is collected; **Clear All Data** permanently deletes conversations and your learning profile.
- Nothing is sent to external servers except the LLM provider you choose; there is no tracking or analytics.

## Notebook & Review Dashboard

The notebook at `/notebook.html` manages vocabulary with SM-2 spaced repetition (due reviews, leech detection), exercises, study guides, and learning analytics. Full instructions: [Notebook Guide](notebook.md).

## Themes

Use the theme toggle to switch between light and dark mode; the choice is persisted.

## Exporting Conversations

Two export paths exist for any conversation:

1. **From the sidebar** — hover over a conversation and click the 📥 (JSON) or 📄 (document) button.
2. **From the header** — open the **Export** dropdown while viewing a conversation.

| Option | What you get |
|--------|--------------|
| Export as JSON | Raw conversation file (`conversation_{id}_{timestamp}.json`). Optionally tick **"Use for training data"** to save an opt-in copy to `backend/data/training/` — your history itself is never modified. |
| Export as Document | Generated **PDF**, **DOCX**, or **Markdown**, or an LLM-written study guide on a topic of your choice. |

## Settings Overview

The settings panel shows:

- **Model** — active provider/model.
- **RAG mode** — ChromaDB active or legacy keyword fallback.
- **Internet search** — on/off.
- **History RAG** — enabled/disabled, encryption status, indexed conversation count.
- **Level & language** — auto-detected or manual JLPT level; response language.

## Tips for Better Answers

- Be specific: "What's the difference between は and が?" beats "Tell me about particles".
- Mention your level: "As a beginner, how do I say…?"
- Ask for formats: "as a table", "with romaji", "give me 5 examples".
- Start a new chat per topic so history stays clean.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Knowledge Base not available" | Start ChromaDB: `cd backend/chromaDB && docker compose up -d`. Settings should show ChromaDB active. |
| No response from AI | Check `ollama list` (or your cloud provider key), check server logs, try a simpler question. |
| Internet search failed | Check connectivity; toggle it off/on. The app falls back to local knowledge. |
| History RAG errors | Check privacy settings, or disable and re-enable personalization. |
| ChromaDB connection issues | `docker ps | grep chroma`, then restart from `backend/chromaDB`. |

For system-level checks: `./test-enhanced-rag.sh` and `curl http://localhost:3000/api/health`. More detail: [ChromaDB guide](chromadb.md), [Docker deployment](deployment-docker.md), [Redis guide](redis.md). Release history: [CHANGELOG](../../CHANGELOG.md).
