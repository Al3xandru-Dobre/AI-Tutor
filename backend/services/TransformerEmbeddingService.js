// services/TransformerEmbeddingService.js - Real transformer-based embeddings using @xenova/transformers

const { pipeline, env } = require('@xenova/transformers');
const fs = require('fs').promises;
const path = require('path');

// Configure to use local models (disable remote model loading in production if needed)
env.allowLocalModels = true;
env.allowRemoteModels = true;

// CRITICAL: Force CPU-only execution to avoid ONNX device errors
env.backends.onnx.wasm.numThreads = 1;
env.useBrowserCache = false;

/**
 * Transformer-based embedding service using @xenova/transformers
 * Supports multiple models optimized for different use cases
 */
class TransformerEmbeddingService {
  constructor(options = {}) {
    this.modelName = options.modelName || 'Xenova/all-MiniLM-L6-v2';
    this.dimension = options.dimension || 384; // all-MiniLM-L6-v2 dimension
    this.maxLength = options.maxLength || 512;
    this.cachePath = path.join(__dirname, '../data/model-cache');
    this.useCache = options.useCache !== false;

    // Model configurations for different use cases
    this.availableModels = {
      'mini': {
        name: 'Xenova/all-MiniLM-L6-v2',
        dimension: 384,
        description: 'Fast, lightweight model for general use'
      },
      'multilingual': {
        name: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        dimension: 384,
        description: 'Optimized for 50+ languages including Japanese'
      },
      'large': {
        name: 'Xenova/all-mpnet-base-v2',
        dimension: 768,
        description: 'Higher quality embeddings, slower'
      }
    };

    // Stats
    this.stats = {
      totalEmbeddings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgGenerationTime: 0,
      modelLoaded: false
    };

    // Cache
    this.embeddingCache = new Map();
    this.extractor = null;
  }

  /**
   * Initialize the transformer model
   */
  async initialize() {
    console.log('🤖 Initializing Transformer Embedding Service...');
    console.log(`   Model: ${this.modelName}`);
    console.log(`   Dimension: ${this.dimension}`);

    try {
      // Create cache directory
      await fs.mkdir(this.cachePath, { recursive: true });

      // Load the model pipeline
      console.log('   📥 Loading transformer model (first time may take a few minutes)...');
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        quantized: true, // Use quantized model for faster inference
      });

      this.stats.modelLoaded = true;
      console.log('   ✅ Transformer model loaded successfully');

      // Load embedding cache
      if (this.useCache) {
        await this.loadCache();
      }

      return true;
    } catch (error) {
      console.error('   ❌ Failed to initialize transformer model:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for text(s)
   * @param {string|string[]} texts - Text or array of texts to embed
   * @param {object} options - Generation options
   * @returns {Promise<number[]|number[][]>} Embedding vector(s)
   */
  async generate(texts, options = {}) {
    const {
      normalize = true,
      pooling = 'mean',
      useCache = this.useCache
    } = options;

    if (!this.extractor) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const isArray = Array.isArray(texts);
    const textArray = isArray ? texts : [texts];

    if (textArray.length === 0) {
      return isArray ? [] : [];
    }

    const startTime = Date.now();
    const embeddings = [];

    for (const text of textArray) {
      // Check cache first
      if (useCache && this.embeddingCache.has(text)) {
        embeddings.push(this.embeddingCache.get(text));
        this.stats.cacheHits++;
        continue;
      }

      // Generate embedding
      const embedding = await this._generateSingle(text, { normalize, pooling });

      // Cache it
      if (useCache) {
        this.embeddingCache.set(text, embedding);
        this.stats.cacheMisses++;
      }

      embeddings.push(embedding);
    }

    // Update stats
    const generationTime = Date.now() - startTime;
    this.stats.totalEmbeddings += textArray.length;
    this.stats.avgGenerationTime =
      ((this.stats.avgGenerationTime * (this.stats.totalEmbeddings - textArray.length)) +
       generationTime) / this.stats.totalEmbeddings;

    console.log(`   🔢 Generated ${textArray.length} embedding(s) in ${generationTime}ms`);

    return isArray ? embeddings : embeddings[0];
  }

  /**
   * Generate a single embedding
   * @private
   */
  async _generateSingle(text, options) {
    const { normalize, pooling } = options;

    try {
      // Truncate text if too long
      const truncatedText = text.length > this.maxLength * 4
        ? text.substring(0, this.maxLength * 4)
        : text;

      // Generate embeddings using the model
      const output = await this.extractor(truncatedText, {
        pooling: pooling,
        normalize: normalize
      });

      // Convert tensor to array
      let embedding;
      if (output.data) {
        // Extract the data array from the tensor
        embedding = Array.from(output.data);
      } else {
        embedding = Array.from(output);
      }

      // Ensure correct dimension
      if (embedding.length > this.dimension) {
        embedding = embedding.slice(0, this.dimension);
      } else if (embedding.length < this.dimension) {
        // Pad with zeros if needed
        embedding = [...embedding, ...new Array(this.dimension - embedding.length).fill(0)];
      }

      return embedding;
    } catch (error) {
      console.error(`   ❌ Error generating embedding for text: "${text.substring(0, 50)}..."`, error);
      // Return zero vector as fallback
      return new Array(this.dimension).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Normalize an embedding vector
   */
  normalizeEmbedding(embedding) {
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) return embedding;
    return embedding.map(val => val / magnitude);
  }

  /**
   * Load embedding cache from disk
   */
  async loadCache() {
    try {
      const cachePath = path.join(this.cachePath, 'transformer-cache.json');
      const cacheData = await fs.readFile(cachePath, 'utf-8');
      const cache = JSON.parse(cacheData);

      this.embeddingCache = new Map(Object.entries(cache));
      console.log(`   ✅ Loaded ${this.embeddingCache.size} cached embeddings`);
    } catch (error) {
      console.log('   ℹ️  No cache found, starting fresh');
    }
  }

  /**
   * Save embedding cache to disk
   */
  async saveCache() {
    if (!this.useCache) return;

    try {
      const cachePath = path.join(this.cachePath, 'transformer-cache.json');

      // Limit cache size to prevent huge files
      const cacheEntries = Array.from(this.embeddingCache.entries());
      const limitedCache = cacheEntries.slice(-2000); // Keep last 2000 entries

      await fs.writeFile(
        cachePath,
        JSON.stringify(Object.fromEntries(limitedCache), null, 2)
      );

      console.log(`   ✅ Saved ${limitedCache.length} embeddings to cache`);
    } catch (error) {
      console.error('   ❌ Failed to save cache:', error);
    }
  }

  /**
   * Clear the embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
    console.log('   ✅ Cache cleared');
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelKey) {
    if (!this.availableModels[modelKey]) {
      throw new Error(`Model ${modelKey} not available. Choose from: ${Object.keys(this.availableModels).join(', ')}`);
    }

    const modelConfig = this.availableModels[modelKey];
    console.log(`🔄 Switching to ${modelKey} model...`);
    console.log(`   ${modelConfig.description}`);

    this.modelName = modelConfig.name;
    this.dimension = modelConfig.dimension;

    // Reinitialize with new model
    await this.initialize();
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return this.availableModels;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      model_name: this.modelName,
      embedding_dimension: this.dimension,
      total_embeddings_generated: this.stats.totalEmbeddings,
      cache_hits: this.stats.cacheHits,
      cache_misses: this.stats.cacheMisses,
      cache_hit_rate: this.stats.totalEmbeddings > 0
        ? (this.stats.cacheHits / this.stats.totalEmbeddings * 100).toFixed(2) + '%'
        : '0%',
      avg_generation_time_ms: Math.round(this.stats.avgGenerationTime),
      cache_size: this.embeddingCache.size,
      model_loaded: this.stats.modelLoaded
    };
  }

  /**
   * Cleanup and save state
   */
  async cleanup() {
    console.log('🧹 Cleaning up transformer embedding service...');
    await this.saveCache();
    this.embeddingCache.clear();
    console.log('   ✅ Cleanup complete');
  }
}

module.exports = TransformerEmbeddingService;
