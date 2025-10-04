# 🔬 Advanced RAG Quick Reference

## What is Advanced RAG?

Advanced RAG enhances standard search with:
- **Hybrid Search**: Semantic (70%) + Keyword (30%)
- **Query Expansion**: Up to 5 query variations
- **Smart Ranking**: Japanese-optimized result scoring

## How to Use

### 1. Enable in UI
Click the 🔬 button next to the internet toggle
- Gray = OFF (standard search)
- Green = ON (advanced features)

### 2. Ask Questions
Type your question as normal. Advanced RAG works automatically when enabled.

### 3. Compare Results
Try the same question with Advanced RAG ON/OFF to see the difference!

## When to Use

### ✅ Use Advanced RAG When:
- Looking for comprehensive coverage
- Need Japanese-specific content
- Want better result relevance
- Have complex or ambiguous queries

### ❌ Use Standard RAG When:
- Need faster responses
- Simple, direct questions
- Server resources are limited

## Visual Indicators

| State | Button | Notification |
|-------|--------|--------------|
| OFF   | 🔬 (gray, low opacity) | "📚 Using standard search" |
| ON    | 🔬 (green, highlighted) | "🔬 Hybrid search + query expansion" |

## Backend Logs

```bash
# When enabled:
🚀 Using ADVANCED RAG (Hybrid Search + Query Expansion)...
✅ Advanced RAG completed successfully
   Processing time: 245ms
   Query expansions: 3
   Hybrid search: Yes
```

## API Usage

```javascript
// Frontend Request
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: "How do I use particles?",
    useAdvancedRAG: true  // ← Enable advanced features
  })
});

// Response includes metadata
{
  response: "...",
  metadata: {
    advanced_rag_used: true,
    searchTime: 245,
    expansions: ["particles usage", "particle functions", ...],
    features: {
      hybridSearch: true,
      queryExpansion: true,
      advancedRanking: true
    }
  }
}
```

## Performance

| Feature | Standard RAG | Advanced RAG |
|---------|--------------|--------------|
| Speed   | ~100-150ms   | ~200-300ms   |
| Memory  | Base         | +50MB        |
| Accuracy| Good         | Excellent    |

## Troubleshooting

### Not Working?

1. **Check server logs** for initialization errors
2. **Verify ChromaDB** is running at `localhost:8000`
3. **Refresh page** and try toggling again

### Slow Performance?

- Disable query expansion (in future settings)
- Reduce max results from 5 to 3
- Check network connection to ChromaDB

## Services Used

```
Frontend (index.html)
    ↓ useAdvancedRAG: true
Server (/api/chat)
    ↓
IntegratedRAGService
    ├── FineTunedEmbeddingService (Japanese-optimized)
    ├── HybridSearchService (semantic + keyword)
    └── QueryExpansionService (query variations)
    ↓
ChromaDB (vector storage)
    ↓
Ollama LLM (generate response)
```

## Key Files

```
backend/
  services/
    IntegratedRAGService.js      ← Main advanced RAG logic
    HybridSearch.js              ← Semantic + keyword search
    QueryExpansionService.js     ← Query variation generator
    FineTunnedEmbeddingService.js ← Japanese embeddings
  server.js                      ← Chat endpoint routing

frontend/
  index.html                     ← Toggle button + request logic
  style.css                      ← Button styling
```

## Quick Start

```bash
# 1. Start server (if not running)
node backend/server.js

# 2. Open browser
http://localhost:3000

# 3. Click 🔬 button to enable

# 4. Ask a question and watch the magic! ✨
```

---

**Pro Tip**: Advanced RAG is perfect for complex questions like "What's the difference between は and が?" where you want comprehensive, well-sourced answers!
