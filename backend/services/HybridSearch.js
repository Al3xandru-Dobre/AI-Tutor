// services/HybridSearchService.js - Combines Semantic and Keyword Search

const CrossEncoderService = require('./CrossEncoderService');

class HybridSearchService {
  constructor(chromaCollection, options = {}) {
    this.collection = chromaCollection;

    // Hybrid search weights
    this.semanticWeight = options.semanticWeight || 0.7;
    this.keywordWeight = options.keywordWeight || 0.3;

    // Minimum scores for filtering
    this.minSemanticScore = options.minSemanticScore || 0.3;
    this.minKeywordScore = options.minKeywordScore || 0.2;

    // Cross-encoder configuration
    this.useCrossEncoder = options.useCrossEncoder !== false; // Default to true
    this.crossEncoder = null;
    this.crossEncoderInitialized = false;

    // Statistics
    this.stats = {
      totalSearches: 0,
      semanticOnlyResults: 0,
      keywordOnlyResults: 0,
      hybridResults: 0,
      crossEncoderRerankings: 0
    };
  }

  /**
   * Initialize the hybrid search service
   */
  async initialize() {
    console.log('🔍 Initializing Hybrid Search Service...');

    if (this.useCrossEncoder) {
      try {
        this.crossEncoder = new CrossEncoderService();
        await this.crossEncoder.initialize();
        this.crossEncoderInitialized = true;
        console.log('   ✅ Cross-encoder reranking enabled');
      } catch (error) {
        console.warn('   ⚠️  Cross-encoder initialization failed, using fallback reranking');
        this.crossEncoderInitialized = false;
      }
    }

    console.log('   ✅ Hybrid Search Service initialized');
    return true;
  }

  /**
   * Perform hybrid search combining semantic and keyword approaches
   * @param {string} query - Search query
   * @param {string} level - User level (beginner, intermediate, etc.)
   * @param {object} options - Search options
   * @returns {Promise<Array>} Ranked results
   */
  async hybridSearch(query, level = 'beginner', options = {}) {
    const {
      maxResults = 5,
      semanticWeight = this.semanticWeight,
      keywordWeight = this.keywordWeight,
      rerank = true
    } = options;

    console.log(`🔍 Hybrid Search: "${query}"`);
    this.stats.totalSearches++;

    try {
      // Run searches in parallel
      const [semanticResults, keywordResults] = await Promise.all([
        this.semanticSearch(query, level, maxResults * 2),
        this.keywordSearch(query, level, maxResults * 2)
      ]);

      console.log(`  📊 Semantic: ${semanticResults.length} results`);
      console.log(`  📊 Keyword: ${keywordResults.length} results`);

      // Combine results
      const combined = this.combineResults(
        semanticResults,
        keywordResults,
        semanticWeight,
        keywordWeight
      );

      // Optional: Rerank using cross-encoder
      const final = rerank 
        ? await this.rerankResults(combined, query, maxResults)
        : combined.slice(0, maxResults);

      // Update statistics
      this.updateStatistics(semanticResults, keywordResults, final);

      console.log(`  ✅ Final: ${final.length} hybrid results`);
      return final;

    } catch (error) {
      console.error('❌ Hybrid search error:', error);
      // Fallback to semantic only
      return await this.semanticSearch(query, level, maxResults);
    }
  }

  /**
   * Semantic search using ChromaDB embeddings
   */
  async semanticSearch(query, level, maxResults) {
    try {
      const whereFilter = this.buildLevelFilter(level);
      
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: maxResults,
        where: whereFilter
      });

      return this.formatSemanticResults(results);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Keyword-based search using BM25 algorithm
   */
  async keywordSearch(query, level, maxResults) {
    try {
      // Get all documents for level
      const allDocs = await this.collection.get({
        where: this.buildLevelFilter(level)
      });

      if (!allDocs || !allDocs.documents || allDocs.documents.length === 0) {
        return [];
      }

      // Calculate BM25 scores
      const scores = this.calculateBM25(
        query,
        allDocs.documents,
        allDocs.metadatas
      );

      // Sort and return top results
      return scores
        .filter(result => result.score >= this.minKeywordScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Keyword search error:', error);
      return [];
    }
  }

  /**
   * BM25 scoring algorithm
   * @param {string} query - Search query
   * @param {Array} documents - Document texts
   * @param {Array} metadatas - Document metadata
   * @returns {Array} Scored results
   */
  calculateBM25(query, documents, metadatas) {
    const k1 = 1.5; // Term frequency saturation
    const b = 0.75; // Length normalization
    
    // Tokenize query
    const queryTerms = this.tokenize(query);
    
    // Calculate document stats
    const N = documents.length;
    const avgDocLength = documents.reduce((sum, doc) => 
      sum + this.tokenize(doc).length, 0) / N;
    
    // Calculate IDF for each query term
    const idf = {};
    queryTerms.forEach(term => {
      const df = documents.filter(doc => 
        this.tokenize(doc).includes(term)
      ).length;
      idf[term] = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    });

    // Score each document
    return documents.map((doc, idx) => {
      const docTerms = this.tokenize(doc);
      const docLength = docTerms.length;
      
      let score = 0;
      queryTerms.forEach(term => {
        const termFreq = docTerms.filter(t => t === term).length;
        const numerator = termFreq * (k1 + 1);
        const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
        score += idf[term] * (numerator / denominator);
      });

      return {
        content: doc,
        metadata: metadatas[idx],
        score: score,
        source_type: 'keyword'
      };
    });
  }

  /**
   * Combine semantic and keyword results with weighted scores
   */
  combineResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
    const combined = new Map();

    // Add semantic results
    semanticResults.forEach(result => {
      const key = this.getResultKey(result);
      combined.set(key, {
        ...result,
        semanticScore: result.score,
        keywordScore: 0,
        hybridScore: result.score * semanticWeight,
        source: 'semantic'
      });
    });

    // Add/merge keyword results
    keywordResults.forEach(result => {
      const key = this.getResultKey(result);
      
      if (combined.has(key)) {
        // Document found in both - update scores
        const existing = combined.get(key);
        existing.keywordScore = result.score;
        existing.hybridScore = 
          (existing.semanticScore * semanticWeight) + 
          (result.score * keywordWeight);
        existing.source = 'hybrid';
      } else {
        // Keyword-only result
        combined.set(key, {
          ...result,
          semanticScore: 0,
          keywordScore: result.score,
          hybridScore: result.score * keywordWeight,
          source: 'keyword'
        });
      }
    });

    // Convert to array and sort by hybrid score
    return Array.from(combined.values())
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }

  /**
   * Rerank results using cross-encoder model
   * Falls back to simple reranking if cross-encoder is unavailable
   */
  async rerankResults(results, query, maxResults) {
    console.log('  🔄 Reranking results...');

    // Use real cross-encoder if available
    if (this.crossEncoderInitialized && this.crossEncoder) {
      try {
        const reranked = await this.crossEncoder.rerankHybrid(query, results, {
          topK: maxResults,
          crossEncoderWeight: 0.7
        });

        this.stats.crossEncoderRerankings++;
        console.log('  ✅ Reranked using cross-encoder model');

        return reranked;
      } catch (error) {
        console.warn('  ⚠️  Cross-encoder reranking failed, using fallback:', error.message);
        return this.fallbackRerank(results, query, maxResults);
      }
    } else {
      // Fallback reranking
      return this.fallbackRerank(results, query, maxResults);
    }
  }

  /**
   * Fallback reranking based on simple heuristics
   */
  fallbackRerank(results, query, maxResults) {
    // Simple reranking based on query-document similarity
    const queryTerms = this.tokenize(query.toLowerCase());

    const reranked = results.map(result => {
      const docTerms = this.tokenize(result.content.toLowerCase());

      // Calculate additional relevance signals
      const exactMatches = queryTerms.filter(term =>
        docTerms.includes(term)
      ).length;

      const positionScore = docTerms.findIndex(term =>
        queryTerms.includes(term)
      );

      // Boost for exact matches and early term positions
      const rerankBoost =
        (exactMatches / queryTerms.length) * 0.3 +
        (positionScore >= 0 ? (1 / (positionScore + 1)) * 0.2 : 0);

      return {
        ...result,
        rerankScore: result.hybridScore + rerankBoost,
        exactMatches,
        positionScore
      };
    });

    return reranked
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, maxResults);
  }

  /**
   * Tokenize text for keyword matching
   */
  tokenize(text) {
    // Enhanced tokenization for Japanese and English
    const english = text
      .toLowerCase()
      .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Extract Japanese characters as tokens
    const japanese = (text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g) || [])
      .filter(word => word.length >= 1);
    
    return [...english, ...japanese];
  }

  /**
   * Get unique key for a result (for deduplication)
   */
  getResultKey(result) {
    // Use content hash or metadata ID
    if (result.metadata?.doc_id) {
      return result.metadata.doc_id;
    }
    // Fallback to content hash
    return result.content.substring(0, 100);
  }

  /**
   * Build level filter for ChromaDB
   */
  buildLevelFilter(level) {
    const levelHierarchy = {
      'beginner': ['beginner'],
      'elementary': ['beginner', 'elementary'],
      'intermediate': ['beginner', 'elementary', 'intermediate'],
      'advanced': ['beginner', 'elementary', 'intermediate', 'advanced']
    };

    return {
      level: { $in: levelHierarchy[level] || ['beginner'] }
    };
  }

  /**
   * Format semantic search results from ChromaDB
   */
  formatSemanticResults(results) {
    if (!results || !results.ids || results.ids.length === 0) {
      return [];
    }

    const formatted = [];
    const ids = results.ids[0];
    const documents = results.documents[0];
    const metadatas = results.metadatas[0];
    const distances = results.distances[0];

    for (let i = 0; i < ids.length; i++) {
      formatted.push({
        content: documents[i],
        metadata: metadatas[i],
        score: 1 - (distances[i] || 0), // Convert distance to similarity
        source_type: 'semantic'
      });
    }

    return formatted;
  }

  /**
   * Update search statistics
   */
  updateStatistics(semanticResults, keywordResults, finalResults) {
    finalResults.forEach(result => {
      if (result.source === 'semantic') {
        this.stats.semanticOnlyResults++;
      } else if (result.source === 'keyword') {
        this.stats.keywordOnlyResults++;
      } else if (result.source === 'hybrid') {
        this.stats.hybridResults++;
      }
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    const stats = {
      total_searches: this.stats.totalSearches,
      result_sources: {
        semantic_only: this.stats.semanticOnlyResults,
        keyword_only: this.stats.keywordOnlyResults,
        hybrid: this.stats.hybridResults
      },
      cross_encoder: {
        enabled: this.crossEncoderInitialized,
        rerankings: this.stats.crossEncoderRerankings
      },
      configuration: {
        semantic_weight: this.semanticWeight,
        keyword_weight: this.keywordWeight,
        min_semantic_score: this.minSemanticScore,
        min_keyword_score: this.minKeywordScore,
        use_cross_encoder: this.useCrossEncoder
      }
    };

    // Add cross-encoder stats if available
    if (this.crossEncoderInitialized && this.crossEncoder) {
      stats.cross_encoder.model_stats = this.crossEncoder.getStats();
    }

    return stats;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Hybrid Search Service...');

    if (this.crossEncoder) {
      await this.crossEncoder.cleanup();
    }

    console.log('   ✅ Cleanup complete');
  }
}

module.exports = HybridSearchService;