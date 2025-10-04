# Enhanced RAG Service - Quick Reference

## 🚀 Quick Start

### 1. Start ChromaDB (Required for enhanced features)
```bash
cd backend/chromaDB
docker compose up -d
```

### 2. Verify ChromaDB is Running
```bash
curl http://localhost:8000/api/v1/heartbeat
```

### 3. Start the Server
```bash
npm start
```

### 4. Run Tests
```bash
./test-enhanced-rag.sh
```

## 📡 API Endpoints

### New Enhanced Endpoints

#### Semantic Search (NEW)
```bash
POST /api/rag/semantic-search
Content-Type: application/json

{
  "query": "How do I use particles in Japanese?",
  "level": "beginner",
  "options": {
    "maxResults": 5,
    "categories": ["grammar"],
    "minScore": 0.3
  }
}
```

**Response:**
```json
{
  "results": [...],
  "query": "How do I use particles in Japanese?",
  "level": "beginner",
  "search_type": "semantic_vector",
  "mode": "chromadb"
}
```

#### ChromaDB Stats (NEW)
```bash
GET /api/rag/chroma-stats
```

**Response:**
```json
{
  "mode": "chromadb",
  "total_chunks": 150,
  "collection_name": "japanese_tutor_knowledge",
  "embedding_model": "all-MiniLM-L6-v2",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Existing Endpoints (Enhanced)

#### Add Document
```bash
POST /api/rag/add
Content-Type: application/json

{
  "title": "Japanese Verb Forms",
  "content": "Detailed explanation of verb conjugation...",
  "metadata": {
    "level": "intermediate",
    "category": "grammar",
    "tags": ["verbs", "conjugation"]
  }
}
```

**Note:** Documents are now automatically chunked for ChromaDB!

#### Regular Search
```bash
POST /api/rag/search
Content-Type: application/json

{
  "query": "counting in Japanese",
  "level": "beginner",
  "maxResults": 3
}
```

#### RAG Statistics
```bash
GET /api/rag/stats
```

**Response:**
```json
{
  "initialized": true,
  "mode": "chromadb",
  "total_documents": 25,
  "total_chunks": 150,
  "total_searches": 42,
  "avg_search_time": 125,
  "chroma_url": "http://localhost:8000",
  "collection_name": "japanese_tutor_knowledge"
}
```

## 🎯 Feature Comparison

| Feature | Legacy Mode | ChromaDB Mode |
|---------|------------|---------------|
| Search Type | Keyword-based | Semantic vector |
| Accuracy | Good | Excellent |
| Speed | Fast | Very Fast |
| Scalability | Limited | High |
| Japanese Support | Basic | Advanced |
| Document Chunking | Manual | Automatic |
| Relevance Scoring | Simple | Sophisticated |

## 🔧 Configuration

### Environment Variables (.env)
```env
# ChromaDB Configuration
CHROMA_DB_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=japanese_tutor_knowledge
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Google Search (Optional)
GOOGLE_API_KEY=your_api_key
SEARCH_ENGINE_ID=your_search_engine_id

# Privacy Settings
HISTORY_RAG_SEED=japanese-tutor-privacy-2024
```

## 🐛 Troubleshooting

### ChromaDB Not Available
**Symptoms:** API returns `mode: "legacy"` instead of `mode: "chromadb"`

**Solutions:**
1. Check if Docker is running: `docker ps`
2. Start ChromaDB: `cd backend/chromaDB && docker compose up -d`
3. Verify connection: `curl http://localhost:8000/api/v1/heartbeat`
4. Check logs: `docker compose logs chromadb`

### Server Won't Start
**Check:**
1. Node.js version: `node --version` (requires >= 16.0.0)
2. Dependencies installed: `npm install`
3. Port 3000 available: `lsof -i :3000`

### Search Returns No Results
**Check:**
1. RAG service initialized: `curl http://localhost:3000/api/rag/stats`
2. Documents loaded: Check `total_documents` in stats
3. Query is clear and specific
4. Level filter isn't too restrictive

### Migration Not Working
**Solutions:**
1. Delete migration status: `rm backend/data/migration-status.json`
2. Restart server to trigger re-migration
3. Check ChromaDB has enough space

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### System Status
```bash
curl http://localhost:3000/api/test | jq '.services'
```

### RAG Performance
```bash
curl http://localhost:3000/api/rag/stats | jq '{searches: .total_searches, avg_time: .avg_search_time, mode: .mode}'
```

## 🎓 Best Practices

### Document Chunking
- ✅ **Optimal chunk size:** 800 characters
- ✅ **Overlap:** 100 characters for context
- ✅ **Paragraph-aware:** Respects natural breaks

### Search Queries
- ✅ **Be specific:** "How to use は particle" vs "particles"
- ✅ **Use context:** "beginner verb conjugation" vs "verbs"
- ✅ **Japanese + English:** Mix both for best results

### Level Filtering
- **Beginner:** Only beginner content
- **Elementary:** Beginner + Elementary
- **Intermediate:** Beginner + Elementary + Intermediate
- **Advanced:** All content

### Performance Tips
1. Use semantic search for complex queries
2. Use regular search for simple keyword matching
3. Cache frequently accessed documents
4. Monitor search times with stats endpoint

## 🔐 Security Notes

- ChromaDB runs locally (no external data transfer)
- All conversation data is privacy-protected
- History RAG uses encryption + anonymization
- User data never leaves the server

## 📚 Additional Resources

- **ChromaDB Docs:** https://docs.trychroma.com/
- **Embedding Models:** https://www.sbert.net/docs/pretrained_models.html
- **Japanese NLP:** https://github.com/buruzaemon/natto-py

## 🆘 Support

For issues or questions:
1. Check logs in terminal
2. Review `ENHANCED_RAG_INTEGRATION.md`
3. Run test suite: `./test-enhanced-rag.sh`
4. Check API health: `curl http://localhost:3000/api/health`
