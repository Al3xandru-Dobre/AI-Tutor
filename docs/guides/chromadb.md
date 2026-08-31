*Set up ChromaDB and understand the tutor's RAG modes: Enhanced RAG (always-on knowledge base), Advanced RAG (hybrid search toggle), and History RAG (conversation memory).*

# ChromaDB & RAG Modes

## Setup

### Prerequisites

- Docker (ChromaDB runs in a container on port 8000)
- Node.js 18+
- Python 3.9+ (only needed for training custom embeddings)

Automated path:

```bash
./setup-chromadb.sh
```

Manual steps:

```bash
# 1. Start ChromaDB
cd backend/chromaDB
mkdir -p chroma_data chroma_logs backups
docker compose up -d
docker compose ps                     # container should be Up, port 8000

# 2. Verify
curl http://localhost:8000/api/v1/heartbeat
node chromadb-maitanance.js health

# 3. Test backend integration (from backend/)
cd .. && node scripts/test-chromadb.js
```

If `chromadb` / `@xenova/transformers` are missing, install them in `backend/`:

```bash
cd backend && npm install chromadb @tensorflow/tfjs-node @xenova/transformers
```

### Custom embeddings (optional)

The app ships with fine-tuned Japanese embeddings (BERT-based, trained in `chromaDB-development_and_AI_stuff/`). To retrain on your own conversation data:

```bash
cd chromaDB-development_and_AI_stuff
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python scripts/run_training_pipeline.py   # 30-60 min; reduce batch_size in train_embedder.py if memory-bound
```

### Maintenance

```bash
cd backend/chromaDB
node chromadb-maitanance.js health    # service check
node chromadb-maitanance.js info      # collection info
node chromadb-maitanance.js analyze   # performance analysis
node chromadb-maitanance.js backup    # backup to backend/chromaDB/backups/
docker compose logs chromadb          # logs
```

## RAG Modes

### Enhanced RAG (knowledge base) — always on

Semantic vector search over your local Japanese learning materials (grammar books, PDFs in `backend/data/grammar/`, sample grammar data indexed at startup). It cannot be toggled off; if ChromaDB is down the app falls back to legacy keyword search.

- Collection: `japanese_tutor_knowledge`
- Endpoint examples: `GET /api/rag/hybrid-stats`, `POST /api/rag/search`, `POST /api/chromadb/semantic-search`
- Response badge: 📚 **Knowledge Base**

### Advanced RAG — toggle in chat

Click the 🔬 button next to the internet toggle (gray = standard, green = advanced). When enabled, retrieval adds:

- **Hybrid search** — semantic + keyword scoring combined
- **Query expansion** — up to 5 query variations (Kuromoji-based)
- **Japanese-optimized reranking** of results

Use it for complex, ambiguous, or comprehensive questions; leave it off for simple lookups or when you want the fastest response (~2x retrieval latency).

Requests pass `useAdvancedRAG: true` to `POST /api/chat`; the response metadata reports `advanced_rag_used`, expansions, and timing. Related endpoints: `/api/rag/advanced-search`, `/api/rag/expand-query`.

### History RAG — conversation memory

A separate, privacy-aware system that optionally uses your past conversations for personalization. Off by default; toggled in Settings. See [Architecture](../architecture.md) and the [User Guide](user-guide.md#privacy-aware-personalization).

Verify both knowledge systems:

```bash
curl http://localhost:3000/api/rag/hybrid-stats
curl http://localhost:3000/api/history-rag/stats
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Cannot connect to ChromaDB | `docker ps | grep chroma`; restart from `backend/chromaDB`; check logs. |
| Port 8000 in use | `lsof -i :8000`, then change the host port mapping in `backend/chromaDB/docker-compose.yml`. |
| Training out of memory | Lower `batch_size` (16 → 8 → 4) in `chromaDB-development_and_AI_stuff/scripts/train_embedder.py`. |
| No conversation data to train on | Normal for a fresh install — the app works with default embeddings; retrain later. |
| transformers library errors | In the venv: `pip install --upgrade transformers tokenizers`. |
| Docker permission denied | `sudo usermod -aG docker $USER`, then re-login. |
