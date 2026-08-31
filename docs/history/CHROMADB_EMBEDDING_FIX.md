# ChromaDB Embedding Function Fix

## Issue
```
ChromaValueError: Embedding function must be defined for operations requiring embeddings.
```

## Root Cause
ChromaDB requires an embedding function to be specified when creating or getting collections. The embedding function is responsible for converting text into numerical vectors (embeddings) that ChromaDB uses for semantic search.

## Solution

### 1. Added Correct Import
```javascript
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
```

**Note:** The `@chroma-core/default-embed` package was already in your dependencies but wasn't being imported.

### 2. Added Embedding Function Property
```javascript
this.embeddingFunction = null; // Will be initialized during setup
```

### 3. Initialize Embedding Function in `initializeChromaDB()`
```javascript
// Initialize embedding function
console.log('🧠 Initializing embedding function...');
this.embeddingFunction = new DefaultEmbeddingFunction();
```

### 4. Pass Embedding Function to Collection Operations
```javascript
// When getting existing collection:
this.collection = await this.chromaClient.getCollection({
  name: this.collectionName,
  embeddingFunction: this.embeddingFunction
});

// When creating new collection:
this.collection = await this.chromaClient.createCollection({
  name: this.collectionName,
  embeddingFunction: this.embeddingFunction,
  metadata: { ... }
});
```

## What is DefaultEmbeddingFunction?

The `DefaultEmbeddingFunction` from `@chroma-core/default-embed` is ChromaDB's built-in embedding model that:
- Converts text into 384-dimensional vectors
- Uses the Transformers.js library under the hood
- Runs locally in Node.js (no external API calls)
- Works well for multilingual text including Japanese

## Why This Fix Works

1. **Automatic Embedding Generation**: ChromaDB now knows how to convert your Japanese learning documents into vectors
2. **Semantic Search**: Enables true semantic similarity search instead of just keyword matching
3. **No Manual Embeddings**: You don't need to generate embeddings yourself - ChromaDB does it automatically
4. **Consistent Results**: All documents use the same embedding model for comparable results

## Testing the Fix

After this fix, your app should:
1. ✅ Successfully connect to ChromaDB
2. ✅ Create/get collections without errors
3. ✅ Add documents to ChromaDB
4. ✅ Perform semantic searches
5. ✅ Migrate existing documents

## Performance Note

The first time you add documents, the embedding function will:
- Download the embedding model (~40MB) to cache
- Generate embeddings for all text chunks
- This may take a few seconds but happens only once

Subsequent operations will be fast as the model is cached locally.

## Alternative Embedding Functions

If you want to use a different embedding model in the future, ChromaDB supports:
- OpenAI embeddings (requires API key)
- Cohere embeddings (requires API key)
- Custom embedding functions

For now, `DefaultEmbeddingFunction` is the best choice because:
- ✅ No API keys required
- ✅ Runs locally
- ✅ Privacy-preserving (no data sent externally)
- ✅ Works offline
- ✅ Good performance for Japanese text

## Files Modified

- `backend/services/enhancedRAGService.js`:
  - Added import for `DefaultEmbeddingFunction`
  - Added `embeddingFunction` property
  - Initialize embedding function in `initializeChromaDB()`
  - Pass embedding function to all collection operations

## Next Steps

1. Restart your server: `npm start` or `npm run dev`
2. The embedding function will be initialized automatically
3. Your app should now work with ChromaDB without errors
4. Test with: `./test-enhanced-rag.sh`

## Verification

Check the server logs for:
```
🔗 Connecting to ChromaDB at http://localhost:8000...
💓 ChromaDB heartbeat: [timestamp]
🧠 Initializing embedding function...
📚 Connected to existing collection: japanese_tutor_knowledge
✅ Embedding function configured successfully
```

## Additional Resources

- **DefaultEmbeddingFunction**: https://docs.trychroma.com/guides#default-embedding-function
- **Custom Embeddings**: https://docs.trychroma.com/guides#custom-embedding-functions
- **Transformers.js**: https://huggingface.co/docs/transformers.js
