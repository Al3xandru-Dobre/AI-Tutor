// services/CrossEncoderService.js - Real cross-encoder reranking using transformers

const { pipeline, env } = require('@xenova/transformers');
const fs = require('fs').promises;
const path = require('path');

// Configure transformer environment
env.allowLocalModels = true;
env.allowRemoteModels = true;

/**
 * Cross-Encoder service for reranking search results
 * Uses a cross-encoder model to compute relevance scores for query-document pairs
 */
class CrossEncoderService {
  constructor(options = {}) {
    // Model configuration
    this.modelName = options.modelName || 'Xenova/ms-marco-MiniLM-L-6-v2';
    this.maxLength = options.maxLength || 512;
    this.batchSize = options.batchSize || 8;

    // Available models
    this.availableModels = {
      'mini': {
        name: 'Xenova/ms-marco-MiniLM-L-6-v2',
        description: 'Fast MS MARCO model for passage ranking'
      },
      'base': {
        name: 'Xenova/ms-marco-MiniLM-L-12-v2',
        description: 'Larger MS MARCO model, better quality'
      }
    };

    // Stats
    this.stats = {
      totalRerankings: 0,
      totalPairsProcessed: 0,
      avgRerankingTime: 0,
      modelLoaded: false
    };

    this.classifier = null;
  }

  /**
   * Initialize the cross-encoder model
   */
  async initialize() {
    console.log('🎯 Initializing Cross-Encoder Reranking Service...');
    console.log(`   Model: ${this.modelName}`);

    try {
      // Load the text classification pipeline for cross-encoding
      console.log('   📥 Loading cross-encoder model (first time may take a few minutes)...');

      this.classifier = await pipeline('text-classification', this.modelName, {
        quantized: true
      });

      this.stats.modelLoaded = true;
      console.log('   ✅ Cross-encoder model loaded successfully');

      return true;
    } catch (error) {
      console.error('   ❌ Failed to initialize cross-encoder:', error);
      throw error;
    }
  }

  /**
   * Rerank a list of results based on their relevance to a query
   * @param {string} query - The search query
   * @param {Array} results - Array of result objects with 'text' or 'content' field
   * @param {object} options - Reranking options
   * @returns {Promise<Array>} Reranked results with relevance scores
   */
  async rerank(query, results, options = {}) {
    const {
      topK = results.length,
      minScore = 0.0,
      textField = 'content'
    } = options;

    if (!this.classifier) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    if (!results || results.length === 0) {
      return [];
    }

    console.log(`🎯 Reranking ${results.length} results for query: "${query.substring(0, 50)}..."`);

    const startTime = Date.now();

    // Score each query-document pair
    const scoredResults = await this._scoreResults(query, results, textField);

    // Sort by relevance score (descending)
    scoredResults.sort((a, b) => b.relevance_score - a.relevance_score);

    // Filter by minimum score and take top K
    const rerankedResults = scoredResults
      .filter(result => result.relevance_score >= minScore)
      .slice(0, topK);

    // Update stats
    const rerankingTime = Date.now() - startTime;
    this.stats.totalRerankings++;
    this.stats.totalPairsProcessed += results.length;
    this.stats.avgRerankingTime =
      ((this.stats.avgRerankingTime * (this.stats.totalRerankings - 1)) +
       rerankingTime) / this.stats.totalRerankings;

    console.log(`   ✅ Reranked ${results.length} → ${rerankedResults.length} results in ${rerankingTime}ms`);

    return rerankedResults;
  }

  /**
   * Score all results using the cross-encoder
   * @private
   */
  async _scoreResults(query, results, textField) {
    const scoredResults = [];

    // Process results in batches
    for (let i = 0; i < results.length; i += this.batchSize) {
      const batch = results.slice(i, i + this.batchSize);

      // Prepare input pairs for the batch
      const inputs = batch.map(result => {
        const text = result[textField] || result.text || result.content || '';
        // Truncate text if too long
        const truncatedText = text.length > this.maxLength * 3
          ? text.substring(0, this.maxLength * 3)
          : text;

        // Format as query + SEP + document
        return `${query} [SEP] ${truncatedText}`;
      });

      try {
        // Get relevance scores from cross-encoder
        const predictions = await this.classifier(inputs);

        // Process predictions
        for (let j = 0; j < batch.length; j++) {
          const result = batch[j];
          const prediction = Array.isArray(predictions) ? predictions[j] : predictions;

          // Extract score - format varies by model
          let score = 0;
          if (prediction.label === 'LABEL_1' || prediction.label === 'relevant') {
            score = prediction.score;
          } else if (prediction.label === 'LABEL_0') {
            // If model outputs non-relevance, convert to relevance
            score = 1 - prediction.score;
          } else {
            // Use raw score
            score = prediction.score || 0;
          }

          scoredResults.push({
            ...result,
            relevance_score: score,
            original_score: result.score || result.similarity || 0
          });
        }
      } catch (error) {
        console.error(`   ⚠️  Error scoring batch ${i / this.batchSize + 1}:`, error.message);

        // Add results with original scores as fallback
        for (const result of batch) {
          scoredResults.push({
            ...result,
            relevance_score: result.score || result.similarity || 0,
            original_score: result.score || result.similarity || 0
          });
        }
      }
    }

    return scoredResults;
  }

  /**
   * Score a single query-document pair
   * @param {string} query - The query
   * @param {string} document - The document text
   * @returns {Promise<number>} Relevance score (0-1)
   */
  async score(query, document) {
    if (!this.classifier) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    const input = `${query} [SEP] ${document}`;
    const prediction = await this.classifier(input);

    // Extract score
    if (prediction.label === 'LABEL_1' || prediction.label === 'relevant') {
      return prediction.score;
    } else if (prediction.label === 'LABEL_0') {
      return 1 - prediction.score;
    }

    return prediction.score || 0;
  }

  /**
   * Rerank results using a hybrid approach:
   * - Combine original score with cross-encoder score
   * @param {string} query - The search query
   * @param {Array} results - Results with original scores
   * @param {object} options - Options
   * @returns {Promise<Array>} Reranked results
   */
  async rerankHybrid(query, results, options = {}) {
    const {
      topK = results.length,
      crossEncoderWeight = 0.7, // 70% cross-encoder, 30% original
      minScore = 0.0
    } = options;

    const rerankedResults = await this.rerank(query, results, { topK: results.length });

    // Normalize scores to 0-1 range
    const maxOriginalScore = Math.max(...rerankedResults.map(r => r.original_score || 0));
    const maxRelevanceScore = Math.max(...rerankedResults.map(r => r.relevance_score || 0));

    // Combine scores
    const hybridResults = rerankedResults.map(result => {
      const normalizedOriginal = maxOriginalScore > 0
        ? (result.original_score || 0) / maxOriginalScore
        : 0;
      const normalizedRelevance = maxRelevanceScore > 0
        ? result.relevance_score / maxRelevanceScore
        : 0;

      const hybridScore =
        (normalizedRelevance * crossEncoderWeight) +
        (normalizedOriginal * (1 - crossEncoderWeight));

      return {
        ...result,
        hybrid_score: hybridScore,
        score: hybridScore // Update main score field
      };
    });

    // Sort by hybrid score
    hybridResults.sort((a, b) => b.hybrid_score - a.hybrid_score);

    // Filter and limit
    return hybridResults
      .filter(result => result.hybrid_score >= minScore)
      .slice(0, topK);
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelKey) {
    if (!this.availableModels[modelKey]) {
      throw new Error(`Model ${modelKey} not available. Choose from: ${Object.keys(this.availableModels).join(', ')}`);
    }

    const modelConfig = this.availableModels[modelKey];
    console.log(`🔄 Switching to ${modelKey} cross-encoder model...`);
    console.log(`   ${modelConfig.description}`);

    this.modelName = modelConfig.name;

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
      total_rerankings: this.stats.totalRerankings,
      total_pairs_processed: this.stats.totalPairsProcessed,
      avg_reranking_time_ms: Math.round(this.stats.avgRerankingTime),
      model_loaded: this.stats.modelLoaded
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up cross-encoder service...');
    this.classifier = null;
    console.log('   ✅ Cleanup complete');
  }
}

module.exports = CrossEncoderService;
