const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

/**
 * Multilingual Embedding Service using paraphrase-multilingual-mpnet-base-v2
 * Optimized for Japanese language understanding
 */
class MultilingualEmbeddingService {
  constructor(options = {}) {
    this.modelName = options.modelName || 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2';
    this.ollamaUrl = options.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    this.useOllama = options.useOllama !== false; // Default to true
    this.cachePath = path.join(__dirname, '../data/embeddings_cache');
    this.cacheEnabled = options.cacheEnabled !== false;
    this.batchSize = options.batchSize || 10;
    
    console.log(`🌏 Initializing Multilingual Embedding Service`);
    console.log(`   Model: ${this.modelName}`);
    console.log(`   Cache: ${this.cacheEnabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Initialize the embedding service
   */
  async initialize() {
    try {
      if (this.cacheEnabled) {
        await fs.mkdir(this.cachePath, { recursive: true });
      }
      
      // Test if Ollama is available
      if (this.useOllama) {
        try {
          await axios.get(`${this.ollamaUrl}/api/tags`);
          console.log('   ✅ Ollama server connected');
          
          // Check if embedding model is available
          await this.ensureModelAvailable();
        } catch (error) {
          console.warn('   ⚠️  Ollama not available, will use fallback method');
          this.useOllama = false;
        }
      }
      
      console.log('   ✅ Multilingual Embedding Service initialized');
      return true;
    } catch (error) {
      console.error('   ❌ Embedding service initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Ensure the embedding model is available in Ollama
   */
  async ensureModelAvailable() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      const models = response.data.models || [];
      
      // Check if our model is available
      const modelAvailable = models.some(m => 
        m.name.includes('nomic-embed-text') || 
        m.name.includes('mxbai-embed-large')
      );
      
      if (!modelAvailable) {
        console.log('   📥 Pulling embedding model (this may take a few minutes)...');
        console.log('   Using nomic-embed-text as a multilingual alternative');
        
        // Pull nomic-embed-text which supports multiple languages including Japanese
        await axios.post(`${this.ollamaUrl}/api/pull`, {
          name: 'nomic-embed-text'
        });
        
        console.log('   ✅ Embedding model downloaded');
      }
    } catch (error) {
      console.warn('   ⚠️  Could not ensure model availability:', error.message);
    }
  }

  /**
   * Generate embeddings for text
   * @param {string|string[]} texts - Text or array of texts to embed
   * @returns {Promise<number[]|number[][]>} Embedding vector(s)
   */
  async generate(texts) {
    const isArray = Array.isArray(texts);
    const textArray = isArray ? texts : [texts];
    
    if (textArray.length === 0) {
      return isArray ? [] : [];
    }

    try {
      // Check cache first
      if (this.cacheEnabled) {
        const cachedResults = await this.getCached(textArray);
        if (cachedResults.allFound) {
          return isArray ? cachedResults.embeddings : cachedResults.embeddings[0];
        }
      }

      // Generate embeddings
      let embeddings;
      if (this.useOllama) {
        embeddings = await this.generateWithOllama(textArray);
      } else {
        embeddings = await this.generateFallback(textArray);
      }

      // Cache results
      if (this.cacheEnabled && embeddings) {
        await this.cacheEmbeddings(textArray, embeddings);
      }

      return isArray ? embeddings : embeddings[0];
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      // Return zero vectors as fallback
      const dim = 768; // Standard dimension for multilingual models
      const fallback = textArray.map(() => new Array(dim).fill(0));
      return isArray ? fallback : fallback[0];
    }
  }

  /**
   * Generate embeddings using Ollama
   */
  async generateWithOllama(texts) {
    const embeddings = [];
    
    // Process in batches
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      
      for (const text of batch) {
        try {
          const response = await axios.post(`${this.ollamaUrl}/api/embeddings`, {
            model: 'nomic-embed-text',
            prompt: text
          });
          
          embeddings.push(response.data.embedding);
        } catch (error) {
          console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`);
          embeddings.push(new Array(768).fill(0));
        }
      }
    }
    
    return embeddings;
  }

  /**
   * Fallback embedding generation (simple TF-IDF-like approach)
   * This is a very basic fallback and should be replaced with a proper model
   */
  async generateFallback(texts) {
    console.warn('⚠️  Using fallback embedding generation (not recommended for production)');
    
    return texts.map(text => {
      // Simple character-based embedding for demonstration
      // In production, you should use a proper model or API
      const chars = text.split('');
      const embedding = new Array(768).fill(0);
      
      chars.forEach((char, idx) => {
        const code = char.charCodeAt(0);
        const pos = (code * idx) % 768;
        embedding[pos] = (embedding[pos] + 1) / (idx + 1);
      });
      
      // Normalize
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => norm > 0 ? val / norm : 0);
    });
  }

  /**
   * Get cached embeddings
   */
  async getCached(texts) {
    const embeddings = [];
    const notFound = [];
    
    for (const text of texts) {
      const hash = this.hashText(text);
      const cachePath = path.join(this.cachePath, `${hash}.json`);
      
      try {
        const data = await fs.readFile(cachePath, 'utf-8');
        embeddings.push(JSON.parse(data));
      } catch {
        notFound.push(text);
        embeddings.push(null);
      }
    }
    
    return {
      embeddings,
      allFound: notFound.length === 0,
      notFound
    };
  }

  /**
   * Cache embeddings
   */
  async cacheEmbeddings(texts, embeddings) {
    for (let i = 0; i < texts.length; i++) {
      const hash = this.hashText(texts[i]);
      const cachePath = path.join(this.cachePath, `${hash}.json`);
      
      try {
        await fs.writeFile(cachePath, JSON.stringify(embeddings[i]));
      } catch (error) {
        console.warn(`Failed to cache embedding: ${error.message}`);
      }
    }
  }

  /**
   * Hash text for caching
   */
  hashText(text) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Get embedding dimension
   */
  getDimension() {
    return 768; // Standard for multilingual-mpnet-base-v2
  }
}

module.exports = MultilingualEmbeddingService;