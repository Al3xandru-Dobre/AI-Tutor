# Japanese AI Tutor - Custom Embeddings Training

This directory contains all the scripts and models for training custom Japanese language embeddings optimized for the AI tutor application.

## Overview

The training pipeline creates a specialized embedding model that:
- Understands Japanese language nuances (hiragana, katakana, kanji)
- Is optimized for educational Q&A content
- Improves semantic search in ChromaDB
- Integrates seamlessly with the Node.js backend

## Directory Structure

```
chromaDB-development_and_AI_stuff/
├── models/
│   ├── japanese_embedder.py      # Model architecture
│   ├── checkpoints/               # Saved model weights
│   └── japanese_embedder/         # Exported for Node.js
├── scripts/
│   ├── prepare_training_data.py   # Data preparation
│   ├── train_embedder.py          # Training script
│   └── run_training_pipeline.py   # Complete pipeline
├── data/
│   └── embeddings/                # Training data (CSV)
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

## Prerequisites

### System Requirements

- Python 3.9 or higher
- Node.js 18+ (for backend integration)
- Docker (for ChromaDB)
- 8GB+ RAM (16GB recommended for training)
- GPU (optional but recommended for faster training)

### Install Dependencies

```bash
# Create a virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Quick Start

### Option 1: Complete Pipeline (Recommended)

Run the entire pipeline in one command:

```bash
python scripts/run_training_pipeline.py
```

This will:
1. Prepare training data from conversations
2. Train the embedding model
3. Export for JavaScript/Node.js
4. Provide integration instructions

### Option 2: Step-by-Step

#### Step 1: Prepare Training Data

```bash
python scripts/prepare_training_data.py
```

This creates:
- `data/embeddings/train.csv` - Training data
- `data/embeddings/val.csv` - Validation data
- `data/embeddings/test.csv` - Test data

#### Step 2: Train the Model

```bash
python scripts/train_embedder.py
```

Training parameters:
- **Epochs**: 10 (adjust in script)
- **Batch size**: 16 (adjust based on GPU memory)
- **Learning rate**: 2e-5
- **Embedding dimension**: 384 (compatible with ChromaDB)

The model uses:
- **Base model**: `cl-tohoku/bert-base-japanese-v3`
- **Fine-tuning**: Contrastive learning with Q&A pairs
- **Freezing strategy**: First 3 epochs frozen, then unfreeze last 4 layers

#### Step 3: Export for Node.js

```bash
# This is done automatically by the pipeline, but you can run manually:
python -c "
import tensorflow as tf
from models.japanese_embedder import JapaneseSentenceEmbedder
import tensorflowjs as tfjs

model = JapaneseSentenceEmbedder(
    base_model_name='cl-tohoku/bert-base-japanese-v3',
    embedding_dim=384,
    hidden_dim=512
)
model.load_weights('models/checkpoints/best_embedder.h5')
tfjs.converters.save_keras_model(model, 'models/japanese_embedder')
print('✅ Model exported!')
"
```

## Model Architecture

### JapaneseSentenceEmbedder

```
Input (Japanese text)
    ↓
BERT Tokenizer (cl-tohoku/bert-base-japanese-v3)
    ↓
BERT Encoder (768 dimensions)
    ↓
Mean Pooling
    ↓
Projection Layer (768 → 512 → 384)
    ↓
L2 Normalization
    ↓
Output (384-dimensional embedding)
```

### Training Strategy

1. **Contrastive Learning**
   - Positive pairs: (question, correct answer)
   - Negative pairs: (question, random wrong answer)
   - Loss: Cosine similarity-based contrastive loss

2. **Two-Phase Fine-tuning**
   - Phase 1 (epochs 0-2): Freeze BERT, train projection
   - Phase 2 (epochs 3-10): Unfreeze last 4 layers, fine-tune end-to-end

3. **Data Augmentation**
   - Extract Q&A pairs from conversation history
   - Create negative samples through random pairing
   - 70/15/15 train/val/test split

## Integration with Backend

### Update Backend Service

The backend automatically detects and uses custom embeddings if available:

```javascript
// backend/services/enhancedRAGService.js
await ragService.setupCustomEmbedding();
```

### Manual Integration

```javascript
const CustomJapaneseEmbedding = require('./services/customEmbbedingsService');

const embedder = new CustomJapaneseEmbedding('./models/japanese_embedder');
await embedder.initialize();

const embeddings = await embedder.embed(['こんにちは', 'Hello']);
console.log(embeddings); // 2 x 384 array
```

## Testing

### Test ChromaDB Integration

```bash
# Start ChromaDB first
cd ../backend/chromaDB
docker-compose up -d

# Run integration tests
cd ..
node scripts/test-chromadb.js
```

### Evaluate Model Performance

```python
# scripts/evaluate_model.py (create this if needed)
from models.japanese_embedder import JapaneseSentenceEmbedder
import pandas as pd

model = JapaneseSentenceEmbedder(
    base_model_name='cl-tohoku/bert-base-japanese-v3',
    embedding_dim=384,
    hidden_dim=512
)
model.load_weights('models/checkpoints/best_embedder.h5')

# Load test data
test_df = pd.read_csv('data/embeddings/test.csv')

# Evaluate
# ... (implement evaluation logic)
```

## Training Data Sources

The model trains on:

1. **Conversation History** (`backend/data/history/conversations.json`)
   - User questions and AI responses
   - Real interaction patterns
   - Domain-specific language

2. **Grammar Documents** (`backend/data/grammar/`)
   - Japanese grammar PDF books
   - Reference materials
   - Educational content

## Performance Optimization

### Training Optimization

1. **Use GPU**
   ```python
   # Check GPU availability
   import tensorflow as tf
   print("GPUs:", tf.config.list_physical_devices('GPU'))
   ```

2. **Adjust Batch Size**
   - More GPU memory → larger batch size → faster training
   - Start with 8 if you get OOM errors
   - Increase to 32 if you have plenty of memory

3. **Mixed Precision Training**
   ```python
   from tensorflow.keras import mixed_precision
   policy = mixed_precision.Policy('mixed_float16')
   mixed_precision.set_global_policy(policy)
   ```

### Inference Optimization

1. **Model Quantization** (future work)
2. **Batch Processing** in production
3. **Caching** frequent queries

## Troubleshooting

### Issue: Out of Memory (OOM)

**Solution:**
- Reduce batch size to 8 or 4
- Reduce max_length to 256
- Use CPU instead of GPU (slower but works)

### Issue: Model doesn't converge

**Solution:**
- Check data quality (need diverse Q&A pairs)
- Adjust learning rate (try 1e-5 or 3e-5)
- Increase training epochs
- Verify positive/negative pair balance

### Issue: Can't load model in Node.js

**Solution:**
```bash
# Ensure tensorflowjs is installed
pip install tensorflowjs

# Re-export the model
python scripts/run_training_pipeline.py
```

### Issue: ChromaDB connection failed

**Solution:**
```bash
# Check if ChromaDB is running
docker ps | grep chroma

# Restart if needed
cd backend/chromaDB
docker-compose restart
```

## Advanced Configuration

### Custom Tokenizer

```python
# In models/japanese_embedder.py
from transformers import AutoTokenizer

# Use a different tokenizer
self.tokenizer = AutoTokenizer.from_pretrained('your-custom-tokenizer')
```

### Different Base Model

```python
# Try different Japanese BERT models:
# - 'cl-tohoku/bert-base-japanese-v3'
# - 'cl-tohoku/bert-large-japanese'
# - 'nlp-waseda/roberta-base-japanese'

model = JapaneseSentenceEmbedder(
    base_model_name='nlp-waseda/roberta-base-japanese',
    embedding_dim=384,
    hidden_dim=512
)
```

### Hyperparameter Tuning

Edit `scripts/train_embedder.py`:

```python
trainer = EmbeddingTrainer(
    model,
    learning_rate=2e-5,  # Try: 1e-5, 2e-5, 3e-5
)

trainer.train(
    train_df,
    val_df,
    epochs=10,        # Try: 5, 10, 15
    batch_size=16     # Try: 8, 16, 32
)
```

## Monitoring Training

### TensorBoard (optional)

```python
# Add to train_embedder.py
import tensorflow as tf

tensorboard_callback = tf.keras.callbacks.TensorBoard(
    log_dir='./logs',
    histogram_freq=1
)

# Add to trainer.train()
```

### Weights & Biases (optional)

```python
# Uncomment in train_embedder.py
import wandb

wandb.init(project='japanese-ai-tutor')
# Log metrics during training
```

## Contributing

When adding new features:

1. Test thoroughly with `test-chromadb.js`
2. Document changes in this README
3. Update model version in comments
4. Provide example usage

## Resources

- [Sentence-BERT Paper](https://arxiv.org/abs/1908.10084)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [TensorFlow.js Guide](https://www.tensorflow.org/js)
- [Transformers Documentation](https://huggingface.co/docs/transformers)

## License

Same as main project.

## Support

For issues:
1. Check troubleshooting section above
2. Review backend logs
3. Test with `test-chromadb.js`
4. Open an issue in the main repository
