# Quick Start Guide - ChromaDB & Custom Embeddings

Complete guide to get ChromaDB and custom embeddings working with your Japanese AI Tutor.

## 🎯 Overview

This setup will:
1. ✅ Fix all syntax errors in your code
2. ✅ Set up ChromaDB with Docker
3. ✅ Train custom Japanese embeddings
4. ✅ Integrate everything with your frontend

---

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ (you have this ✅)
- **Python** 3.9+
- **Docker** (for ChromaDB)
- **Git** (you have this ✅)

### Check Python Installation
```bash
python3 --version  # Should be 3.9 or higher
pip3 --version     # Should be available
```

If Python is not installed:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip python3-venv

# macOS
brew install python@3.11
```

### Check Docker Installation
```bash
docker --version
docker-compose --version
```

If Docker is not installed:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER  # Log out and back in after this

# macOS
brew install --cask docker
```

---

## 🚀 Step-by-Step Setup

### Step 1: Install Node.js Dependencies

```bash
# From project root
cd backend
npm install chromadb @tensorflow/tfjs-node @xenova/transformers
cd ..
```

### Step 2: Install Python Dependencies

```bash
cd chromaDB-development_and_AI_stuff

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

This will install:
- TensorFlow (for training)
- Transformers (Japanese BERT)
- Pandas, NumPy (data processing)
- ChromaDB (database client)

**Note:** This might take 5-10 minutes depending on your internet speed.

### Step 3: Start ChromaDB

```bash
cd ../backend/chromaDB

# Create necessary directories
mkdir -p chroma_data chroma_logs backups

# Start ChromaDB
docker-compose up -d

# Check if it's running
docker-compose ps
```

Expected output:
```
NAME                COMMAND             SERVICE     STATUS      PORTS
chromadb            ...                 chromadb    Up          0.0.0.0:8000->8000/tcp
```

### Step 4: Verify ChromaDB Connection

```bash
# Quick test
curl http://localhost:8000/api/v1/heartbeat

# Or use the health check
node chromadb-maitanance.js health
```

You should see a timestamp response.

### Step 5: Test Backend Integration

```bash
cd ..  # Back to backend directory
node scripts/test-chromadb.js
```

This will:
- ✅ Test ChromaDB connection
- ✅ Initialize RAG service
- ✅ Test semantic search
- ✅ Show collection statistics

Expected output should have lots of ✅ green checkmarks!

---

## 🎓 Training Custom Embeddings (Optional but Recommended)

This step improves search quality by training embeddings on your conversation data.

### Prerequisites for Training

1. **Check GPU availability** (optional but faster):
```bash
python3 -c "import tensorflow as tf; print('GPUs:', tf.config.list_physical_devices('GPU'))"
```

2. **Check you have conversation data**:
```bash
ls -lh backend/data/history/conversations.json
```

If the file is empty or very small, the system will still work with default embeddings.

### Run Training Pipeline

```bash
cd chromaDB-development_and_AI_stuff

# Make sure virtual environment is activated
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the complete pipeline
python scripts/run_training_pipeline.py
```

This will:
1. Extract Q&A pairs from conversations
2. Train the embedding model (takes 30-60 minutes)
3. Export model for JavaScript
4. Test integration

**During training you'll see:**
```
Epoch 1/10
Training: 100%|████████████| 45/45 [02:30<00:00]
Train Loss: 0.1234, Val Loss: 0.1456
✅ Saved best model!
```

**Training Tips:**
- **Low on memory?** Edit `scripts/train_embedder.py` and change `batch_size=16` to `batch_size=8` or `batch_size=4`
- **GPU not working?** That's fine, it will use CPU (just slower)
- **Want to stop?** Press Ctrl+C (you can resume later)

### Verify Model Export

```bash
# Check if model was exported
ls -la models/japanese_embedder/

# Should see:
# - model.json
# - group1-shard*.bin files
```

---

## 🔗 Connect Everything

### Update Backend to Use Custom Embeddings

The backend automatically detects custom embeddings if they exist. No code changes needed!

But you can explicitly enable it in [enhancedRAGService.js:172-182](backend/services/enhancedRAGService.js#L172-L182):

```javascript
// In your backend initialization
const ragService = new EnhancedRAGService({
    chromaPath: 'http://localhost:8000',
    useChromaDB: true
});

await ragService.initialize();

// Optional: Use custom embeddings
await ragService.setupCustomEmbedding();
```

### Restart Your Backend

```bash
cd backend

# If using npm
npm start

# If using node directly
node server.js
```

### Test from Frontend

Open your frontend and try asking questions:
- "How do I use particles は and が?"
- "Explain verb conjugation"
- "What are Japanese honorifics?"

The responses should now use ChromaDB for better context!

---

## 🧪 Testing & Verification

### Test 1: ChromaDB Health
```bash
cd backend/chromaDB
node chromadb-maitanance.js health
```

### Test 2: Collection Info
```bash
node chromadb-maitanance.js info
```

### Test 3: Performance Analysis
```bash
node chromadb-maitanance.js analyze
```

### Test 4: Complete Integration
```bash
cd backend
node scripts/test-chromadb.js
```

### Test 5: Query from Code
```javascript
// backend/test-query.js
const EnhancedRAGService = require('./services/enhancedRAGService');

(async () => {
    const ragService = new EnhancedRAGService({
        chromaPath: 'http://localhost:8000',
        useChromaDB: true
    });

    await ragService.initialize();

    const results = await ragService.searchRelevantContent(
        'particles wa and ga',
        'beginner',
        3
    );

    console.log('Search Results:', results);
})();
```

---

## 📊 Monitoring & Maintenance

### Check ChromaDB Logs
```bash
cd backend/chromaDB
docker-compose logs chromadb
```

### Backup Your Data
```bash
node chromadb-maitanance.js backup
```

Backups are saved to `backend/chromaDB/backups/`

### Monitor Performance
```bash
node chromadb-maitanance.js analyze
```

### View Collection Stats
```bash
node scripts/test-chromadb.js
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to ChromaDB"

**Solution:**
```bash
# Check if ChromaDB is running
docker ps | grep chroma

# If not, start it
cd backend/chromaDB
docker-compose up -d

# Check logs for errors
docker-compose logs chromadb
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :8000

# Kill the process or change ChromaDB port in docker-compose.yml
# Change ports: "8001:8000" instead of "8000:8000"
```

### Issue: "Model training out of memory"

**Solution:**
Edit `chromaDB-development_and_AI_stuff/scripts/train_embedder.py`:
```python
# Change this line:
trainer.train(train_df, val_df, epochs=10, batch_size=8)  # Was 16
```

### Issue: "No conversations data found"

**Solution:**
This is normal if you haven't used the app yet. The system will work with default embeddings. As users interact with the app, data will accumulate and you can retrain later.

### Issue: "transformers library error"

**Solution:**
```bash
cd chromaDB-development_and_AI_stuff
source venv/bin/activate
pip install --upgrade transformers tokenizers
```

### Issue: "Docker permission denied"

**Solution:**
```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

---

## 🎯 What's Fixed

### JavaScript Files
- ✅ [customEmbbedingsService.js](backend/services/customEmbbedingsService.js) - Fixed typos (`embbeding` → `embedding`, `intialize` → `initialize`)
- ✅ [enhancedRAGService.js](backend/services/enhancedRAGService.js) - Fixed import path and integration
- ✅ [chromadb-maitanance.js](backend/chromaDB/chromadb-maitanance.js) - Complete rewrite with proper CLI

### Python Files
- ✅ [prepare_training_data.py](chromaDB-development_and_AI_stuff/scripts/prepare_training_data.py) - Fixed paths
- ✅ [japanese_embedder.py](chromaDB-development_and_AI_stuff/models/japanese_embedder.py) - Fixed typos (`embbeding` → `embedding`, `inputs_ids` → `input_ids`)
- ✅ [train_embedder.py](chromaDB-development_and_AI_stuff/scripts/train_embedder.py) - Fixed paths and imports

### New Files Created
- ✅ [run_training_pipeline.py](chromaDB-development_and_AI_stuff/scripts/run_training_pipeline.py) - Complete automated pipeline
- ✅ [test-chromadb.js](backend/scripts/test-chromadb.js) - Comprehensive testing suite
- ✅ [requirements.txt](chromaDB-development_and_AI_stuff/requirements.txt) - Python dependencies
- ✅ [README.md](chromaDB-development_and_AI_stuff/README.md) - Training documentation
- ✅ [README.md](backend/chromaDB/README.md) - ChromaDB documentation
- ✅ [log_config.yml](backend/chromaDB/chroma_config/log_config.yml) - Logging configuration

---

## 📈 Performance Expectations

### Without Custom Embeddings (Default)
- Search time: ~50-100ms
- Accuracy: Good
- Setup time: 5 minutes

### With Custom Embeddings (Trained)
- Search time: ~100-150ms (slightly slower, much more accurate)
- Accuracy: Excellent (optimized for Japanese learning)
- Setup time: 1-2 hours (including training)

---

## 🎓 Next Steps

### Immediate (Must Do)
1. ✅ Install dependencies
2. ✅ Start ChromaDB
3. ✅ Run `test-chromadb.js` to verify

### Short Term (Recommended)
1. Collect conversation data by using the app
2. Train custom embeddings
3. Set up regular backups

### Long Term (Optional)
1. Monitor performance with analytics
2. Retrain periodically with new data
3. Fine-tune hyperparameters
4. Deploy ChromaDB to production server

---

## 📚 Resources

### Documentation
- [ChromaDB Docs](https://docs.trychroma.com/)
- [TensorFlow.js Guide](https://www.tensorflow.org/js)
- [Transformers Docs](https://huggingface.co/docs/transformers)

### Your Project Files
- **Backend Service:** [enhancedRAGService.js](backend/services/enhancedRAGService.js)
- **Custom Embeddings:** [customEmbbedingsService.js](backend/services/customEmbbedingsService.js)
- **Training Scripts:** [chromaDB-development_and_AI_stuff/scripts/](chromaDB-development_and_AI_stuff/scripts/)
- **Model:** [japanese_embedder.py](chromaDB-development_and_AI_stuff/models/japanese_embedder.py)

### Test Scripts
- **Full Test Suite:** `node backend/scripts/test-chromadb.js`
- **Maintenance:** `node backend/chromaDB/chromadb-maitanance.js`
- **Training Pipeline:** `python chromaDB-development_and_AI_stuff/scripts/run_training_pipeline.py`

---

## ✅ Success Checklist

- [ ] Docker installed and running
- [ ] Python 3.9+ installed
- [ ] Node.js dependencies installed
- [ ] Python dependencies installed
- [ ] ChromaDB running (`docker ps`)
- [ ] ChromaDB health check passes
- [ ] test-chromadb.js runs successfully
- [ ] Backend starts without errors
- [ ] Frontend can query the system
- [ ] (Optional) Custom embeddings trained
- [ ] (Optional) Backups configured

---

## 🎉 You're Done!

Your Japanese AI Tutor now has:
- ✅ Persistent ChromaDB storage
- ✅ Semantic search capabilities
- ✅ Custom Japanese embeddings (optional)
- ✅ Improved context retrieval
- ✅ Better learning experience

**Questions?** Check the troubleshooting section or review the detailed READMEs in each directory.
