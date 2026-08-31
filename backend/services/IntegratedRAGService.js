// services/IntegratedRAGService.js - Complete RAG with all advanced features

const { ChromaClient } = require('chromadb');
const HybridSearchService = require('./HybridSearch');
const QueryExpansionService = require('./QueryExpansionService');
const FineTunedEmbeddingService = require('./FineTunnedEmbeddingService');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');

class IntegratedRAGService {
  constructor(options = {}) {
    // ChromaDB configuration
    this.chromaUrl = options.chromaPath || process.env.CHROMA_DB_URL || 'http://localhost:8000';
    this.chromaClient = null;
    this.collectionName = options.collectionName || 'japanese_tutor_advanced';
    this.collection = null;
    this.embeddingFunction = null;

    // Initialize sub-services
    this.hybridSearch = null;
    this.queryExpansion = new QueryExpansionService({
      maxExpansions: options.maxExpansions || 5
    });
    this.embeddingService = new FineTunedEmbeddingService({
      baseModel: options.embeddingModel || 'Xenova/multilingual-e5-base',
      japaneseBoost: 1.3,
      grammarBoost: 1.2
    });

    // Feature flags
    this.useHybridSearch = options.useHybridSearch !== false;
    this.useQueryExpansion = options.useQueryExpansion !== false;
    this.useCustomEmbeddings = options.useCustomEmbeddings !== false;

    // Configuration
    this.maxChunkSize = options.maxChunkSize || 800;
    this.chunkOverlap = options.chunkOverlap || 100;

    // State
    this.isInitialized = false;
    this.advancedFeaturesReady = false; // NEW: Track advanced features separately
    this.documents = new Map();

    // Statistics
    this.stats = {
      totalSearches: 0,
      hybridSearches: 0,
      expandedQueries: 0,
      customEmbeddingsUsed: 0,
      avgSearchTime: 0
    };
  }

  /**
   * Initialize the integrated RAG service
   */
  async initialize() {
    console.log('🚀 Initializing Integrated RAG Service...');

    try {
      // Step 1: Initialize ChromaDB first (fast)
      console.log('1️⃣  Connecting to ChromaDB...');
      await this.initializeChromaDB();

      // Step 2: Initialize hybrid search
      console.log('2️⃣  Initializing hybrid search...');
      this.hybridSearch = new HybridSearchService(this.collection, {
        semanticWeight: 0.7,
        keywordWeight: 0.3
      });

      // Step 3: Mark as initialized early (allows server to start)
      this.isInitialized = true;
      console.log('✅ Integrated RAG Service basic initialization complete!\n');

      // Step 4: Initialize advanced features in background (non-blocking)
      console.log('3️⃣  Starting background initialization of advanced features...');
      this.initializeAdvancedFeatures().then(() => {
        console.log('✅ Advanced features initialized successfully');
      }).catch(err => {
        console.error('⚠️  Advanced features initialization error:', err.message);
        console.log('   System will continue with basic RAG features');
      });

      // Load sample data in background (non-blocking)
      const count = await this.collection.count();
      if (count === 0) {
        console.log('4️⃣  Loading sample data in background...');
        this.loadSampleData().then(() => {
          console.log('✅ Background sample data loading complete');
        }).catch(err => {
          console.error('⚠️  Background sample data loading error:', err.message);
        });
      } else {
        console.log(`4️⃣  Found ${count} existing documents`);
      }

      return true;

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Initialize advanced features (embeddings, hybrid search, query expansion)
   * This runs in the background to avoid blocking server startup
   * @private
   */
  async initializeAdvancedFeatures() {
    console.log('   🔧 Loading transformer models (this may take 1-2 minutes on first run)...');

    try {
      // Initialize embedding service (downloads models on first run)
      console.log('   📥 Initializing embedding service...');
      await this.embeddingService.initialize();
      console.log('   ✅ Embedding service ready');

      // Initialize hybrid search with cross-encoder
      if (this.hybridSearch) {
        console.log('   📥 Initializing hybrid search with cross-encoder...');
        await this.hybridSearch.initialize();
        console.log('   ✅ Hybrid search ready');
      }

      // Initialize query expansion with tokenizer
      if (this.queryExpansion) {
        console.log('   📥 Initializing query expansion with Japanese tokenizer...');
        await this.queryExpansion.initialize();
        console.log('   ✅ Query expansion ready');
      }

      // Mark advanced features as ready
      this.advancedFeaturesReady = true;
      console.log('   🎉 All advanced features loaded!');
      this.printFeatureSummary();

    } catch (error) {
      console.error('   ❌ Error initializing advanced features:', error.message);
      console.log('   ⚠️  System will continue with basic RAG features');
      this.advancedFeaturesReady = false;
      // Don't throw - allow system to continue with basic features
    }
  }

  /**
   * Advanced search with all features enabled
   * @param {string} query - User query
   * @param {string} level - User level
   * @param {object} options - Search options
   */
  async advancedSearch(query, level = 'beginner', options = {}) {
    // Check if initialized
    if (!this.isInitialized) {
      console.warn('⚠️  Advanced RAG service not initialized yet');
      return {
        results: [],
        metadata: {
          searchTime: 0,
          expansions: [],
          features: {
            hybridSearch: false,
            queryExpansion: false,
            advancedRanking: false
          }
        }
      };
    }

    // Check if advanced features are ready
    const featuresReady = this.advancedFeaturesReady;
    if (!featuresReady) {
      console.log('⚠️  Advanced features still loading, using basic search...');
    }

    const {
      maxResults = 5,
      useHybrid = this.useHybridSearch && featuresReady,
      expandQuery = this.useQueryExpansion && featuresReady,
      rerank = featuresReady
    } = options;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 ${featuresReady ? 'ADVANCED' : 'BASIC'} SEARCH`);
    console.log(`Query: "${query}"`);
    console.log(`Level: ${level}`);
    console.log(`Features: ${featuresReady ? 'All enabled' : 'Limited (models loading)'}`);
    console.log(`${'='.repeat(60)}`);

    const startTime = Date.now();
    this.stats.totalSearches++;

    try {
      let searchQuery = query;
      let expansions = null;

      // Phase 1: Query Expansion (only if advanced features ready)
      if (expandQuery && this.useQueryExpansion && featuresReady) {
        console.log('\n📝 Phase 1: Query Expansion');
        try {
          expansions = await this.queryExpansion.expandQuery(query, level);

          console.log(`  Original: "${expansions.original}"`);
          console.log(`  Synonyms: ${expansions.synonyms.slice(0, 3).join(', ')}`);
          console.log(`  Related: ${expansions.related.slice(0, 2).join(', ')}`);
          console.log(`  Total variations: ${expansions.combined.length}`);

          this.stats.expandedQueries++;
        } catch (error) {
          console.warn('  ⚠️  Query expansion failed, using original query:', error.message);
          expansions = null;
        }
      }

      // Phase 2: Hybrid Search
      let results;
      if (useHybrid && this.useHybridSearch && this.hybridSearch && featuresReady) {
        console.log('\n🔄 Phase 2: Hybrid Search (Semantic + Keyword)');

        try {
          if (expansions && expansions.combined.length > 1) {
            // Search with multiple query variations
            results = await this.multiQueryHybridSearch(
              expansions.combined,
              level,
              maxResults
            );
          } else {
            // Single query hybrid search
            results = await this.hybridSearch.hybridSearch(
              query,
              level,
              { maxResults, rerank: false } // Disable rerank if models not ready
            );
          }

          this.stats.hybridSearches++;
        } catch (error) {
          console.warn('  ⚠️  Hybrid search failed, falling back to semantic search:', error.message);
          results = await this.semanticSearch(query, level, maxResults);
        }
      } else {
        console.log('\n🔎 Phase 2: Semantic Search Only');
        results = await this.semanticSearch(query, level, maxResults);
      }

      // Phase 3: Post-processing and ranking
      console.log('\n📊 Phase 3: Final Ranking');
      const rankedResults = this.applyAdvancedRanking(results, query, level);

      const searchTime = Date.now() - startTime;
      this.updateSearchStats(searchTime);

      console.log(`\n✅ Search completed in ${searchTime}ms`);
      console.log(`   Found ${rankedResults.length} results`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        results: rankedResults,
        metadata: {
          searchTime,
          originalQuery: query,
          expansions: expansions?.combined || [query],
          advancedFeaturesReady: featuresReady,
          features: {
            hybridSearch: useHybrid && this.useHybridSearch && featuresReady,
            queryExpansion: expandQuery && this.useQueryExpansion && featuresReady,
            customEmbeddings: this.useCustomEmbeddings && featuresReady,
            reranking: rerank && featuresReady
          },
          warning: !featuresReady ? 'Advanced features still loading, using basic search' : null
        }
      };

    } catch (error) {
      console.error('❌ Advanced search error:', error);
      
      // Fallback to basic search
      console.log('⚠️  Falling back to basic semantic search...');
      const results = await this.semanticSearch(query, level, maxResults);
      
      return {
        results,
        metadata: {
          searchTime: Date.now() - startTime,
          originalQuery: query,
          fallback: true,
          error: error.message
        }
      };
    }
  }

  /**
   * Multi-query hybrid search using expanded queries
   */
  async multiQueryHybridSearch(queries, level, maxResults) {
    console.log(`  Searching with ${queries.length} query variations...`);
    
    // Search with each query variation
    const allResults = await Promise.all(
      queries.map(q => 
        this.hybridSearch.hybridSearch(q, level, { 
          maxResults: Math.ceil(maxResults * 1.5),
          rerank: false 
        })
      )
    );

    // Merge and deduplicate results
    const merged = this.mergeMultiQueryResults(allResults);
    
    console.log(`  Merged to ${merged.length} unique results`);
    return merged.slice(0, maxResults);
  }

  /**
   * Merge results from multiple queries
   */
  mergeMultiQueryResults(resultSets) {
    const mergedMap = new Map();

    resultSets.forEach((results, queryIndex) => {
      results.forEach(result => {
        const key = result.content.substring(0, 100);
        
        if (mergedMap.has(key)) {
          // Boost score if found in multiple queries
          const existing = mergedMap.get(key);
          existing.score = Math.max(existing.score, result.score);
          existing.queryMatches = (existing.queryMatches || 1) + 1;
        } else {
          mergedMap.set(key, {
            ...result,
            queryMatches: 1
          });
        }
      });
    });

    return Array.from(mergedMap.values())
      .sort((a, b) => {
        // Sort by query matches first, then by score
        if (b.queryMatches !== a.queryMatches) {
          return b.queryMatches - a.queryMatches;
        }
        return b.score - a.score;
      });
  }

  /**
   * Apply advanced ranking with multiple signals
   */
  applyAdvancedRanking(results, query, level) {
    console.log('  Applying advanced ranking...');
    
    return results.map(result => {
      let finalScore = result.score || 0.5;
      
      // Signal 1: Level appropriateness
      if (result.metadata?.level === level) {
        finalScore *= 1.15;
      }
      
      // Signal 2: Content quality (length, structure)
      if (result.content.length > 200 && result.content.length < 1000) {
        finalScore *= 1.1;
      }
      
      // Signal 3: Japanese content density
      const japaneseRatio = this.calculateJapaneseDensity(result.content);
      if (japaneseRatio > 0.2) {
        finalScore *= (1 + japaneseRatio * 0.2);
      }
      
      // Signal 4: Examples present
      if (/example|例|sample/i.test(result.content)) {
        finalScore *= 1.15;
      }
      
      // Signal 5: Grammar patterns
      if (/particle|verb|adjective|conjugation/i.test(result.content)) {
        finalScore *= 1.1;
      }
      
      return {
        ...result,
        finalScore,
        rankingSignals: {
          baseScore: result.score,
          levelMatch: result.metadata?.level === level,
          hasExamples: /example|例/i.test(result.content),
          japaneseRatio
        }
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Calculate Japanese character density
   */
  calculateJapaneseDensity(text) {
    const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
    return japaneseChars / text.length;
  }

  /**
   * Basic semantic search
   */
  async semanticSearch(query, level, maxResults) {
    const whereFilter = {
      level: { 
        $in: this.getLevelHierarchy(level) 
      }
    };

    const results = await this.collection.query({
      queryTexts: [query],
      nResults: maxResults,
      where: whereFilter
    });

    return this.formatChromaResults(results);
  }

  /**
   * Add document with custom embeddings
   */
  async addDocument(title, content, metadata = {}) {
    console.log(`📄 Adding document: "${title}"`);
    
    try {
      // Chunk the document
      const chunks = this.chunkDocument(content);
      console.log(`  Created ${chunks.length} chunks`);
      
      // Generate IDs and metadata for each chunk
      const ids = [];
      const documents = [];
      const metadatas = [];
      
      chunks.forEach((chunk, idx) => {
        const docId = `${this.generateDocId(title)}_${idx}`;
        ids.push(docId);
        documents.push(chunk);
        
        // Ensure all metadata values are primitives (string, number, boolean)
        const chunkMetadata = {
          title: String(title),
          chunk_index: Number(idx),
          total_chunks: Number(chunks.length),
          level: String(metadata.level || 'beginner'),
          category: String(metadata.category || 'general'),
          japanese_density: Number(this.calculateJapaneseDensity(chunk))
        };
        
        // Add tags as comma-separated string instead of array
        if (metadata.tags && Array.isArray(metadata.tags)) {
          chunkMetadata.tags = metadata.tags.join(',');
        }
        
        metadatas.push(chunkMetadata);
      });

      // Add to ChromaDB
      await this.collection.add({
        ids,
        documents,
        metadatas
      });
      
      this.documents.set(this.generateDocId(title), { title, content, metadata });
      console.log(`  ✅ Added ${chunks.length} chunks to collection`);
      
      return { success: true, chunks: chunks.length };
    } catch (error) {
      console.error(`❌ Failed to add document: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize ChromaDB
   */
  async initializeChromaDB() {
    this.chromaClient = new ChromaClient({ path: this.chromaUrl });
    
    // Test connection
    await this.chromaClient.heartbeat();
    
    // Initialize embedding function FIRST
    console.log('  🧠 Initializing embedding function...');
    this.embeddingFunction = new DefaultEmbeddingFunction();
    console.log('  ✅ Embedding function configured');

    // Get or create collection with embedding function
    try {
      this.collection = await this.chromaClient.getCollection({
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction
      });
      console.log('  ✅ Connected to existing collection');
    } catch {
      this.collection = await this.chromaClient.createCollection({
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction,
        metadata: {
          description: 'Advanced Japanese learning with hybrid search',
          features: 'hybrid_search,query_expansion,custom_embeddings'
        }
      });
      console.log('  ✅ Created new collection');
    }
  }

  /**
   * Load sample data (same as before but with better structure)
   */
  async loadSampleData() {
    const samples = [
      {
        title: "Particles は (wa) and が (ga)",
        content: `は (wa) - Topic Marker:
The は particle marks the topic of the sentence. Think of it as "As for X..." or "Speaking of X..."

Example: 私は学生です (Watashi wa gakusei desu)
Translation: "As for me, I am a student"
Usage: Use は when introducing a topic or making contrasts

が (ga) - Subject Marker:
The が particle marks the grammatical subject and emphasizes who/what performs the action.

Example: 私が行きます (Watashi ga ikimasu)  
Translation: "I (will) go" (emphasis on "I")
Usage: Use が for new information, emphasis, or in certain grammatical patterns

Key Difference:
- は sets the topic (what you're talking about)
- が identifies the subject (who does the action)`,
        level: "beginner",
        category: "grammar",
        tags: ["particles", "は", "が", "wa", "ga"]
      },
      {
        title: "て-form (Te-form) Comprehensive Guide",
        content: `The て-form is one of the most versatile verb forms in Japanese.

Formation Rules:
う-verbs:
- う、つ、る → って (買う → 買って)
- む、ぶ、ぬ → んで (飲む → 飲んで)  
- く → いて (書く → 書いて)
- ぐ → いで (泳ぐ → 泳いで)
- す → して (話す → 話して)

る-verbs:
- Drop る, add て (食べる → 食べて)

Uses:
1. Connecting actions: 起きて、食べて、学校に行きます
2. Requesting: 待ってください (Please wait)
3. Permission: 写真を撮ってもいいですか
4. Progressive: 食べています (am eating)
5. Completed state: 窓が開いています (window is open)

Example sentences:
- 朝起きて、顔を洗います (I wake up and wash my face)
- ここに座ってください (Please sit here)
- 音楽を聞いています (I'm listening to music)`,
        level: "elementary",
        category: "grammar",
        tags: ["te-form", "verbs", "conjugation"]
      }
    ];

    for (const doc of samples) {
      await this.addDocument(doc.title, doc.content, {
        level: doc.level,
        category: doc.category,
        tags: doc.tags
      });
    }
  }

  /**
   * Utility methods
   */
  
  chunkDocument(content) {
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.maxChunkSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.length > 0 ? chunks : [content];
  }

  generateDocId(title) {
    return require('crypto')
      .createHash('md5')
      .update(title + Date.now())
      .digest('hex')
      .substring(0, 12);
  }

  getLevelHierarchy(level) {
    const hierarchy = {
      'beginner': ['beginner'],
      'elementary': ['beginner', 'elementary'],
      'intermediate': ['beginner', 'elementary', 'intermediate'],
      'advanced': ['beginner', 'elementary', 'intermediate', 'advanced']
    };
    return hierarchy[level] || ['beginner'];
  }

  formatChromaResults(results) {
    if (!results?.ids?.[0]) return [];
    
    return results.ids[0].map((id, i) => ({
      content: results.documents[0][i],
      metadata: results.metadatas[0][i],
      score: 1 - (results.distances[0][i] || 0)
    }));
  }

  updateSearchStats(searchTime) {
    this.stats.avgSearchTime = 
      ((this.stats.avgSearchTime * (this.stats.totalSearches - 1)) + searchTime) 
      / this.stats.totalSearches;
  }

  printFeatureSummary() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     INTEGRATED RAG FEATURES            ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`  ✅ Hybrid Search (Semantic + Keyword)`);
    console.log(`  ✅ Query Expansion`);
    console.log(`  ✅ Custom Embeddings`);
    console.log(`  ✅ Advanced Ranking`);
    console.log(`  ✅ Multi-query Fusion`);
    console.log(`  ✅ Japanese-optimized processing`);
    console.log('');
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      service: {
        initialized: this.isInitialized,
        collection: this.collectionName,
        total_searches: this.stats.totalSearches,
        avg_search_time: Math.round(this.stats.avgSearchTime)
      },
      features: {
        hybrid_searches: this.stats.hybridSearches,
        expanded_queries: this.stats.expandedQueries,
        custom_embeddings_generated: this.stats.customEmbeddingsUsed
      },
      subservices: {
        hybrid_search: this.hybridSearch?.getStats(),
        query_expansion: this.queryExpansion?.getStats(),
        embeddings: this.embeddingService?.getStats()
      }
    };
  }
}

module.exports = IntegratedRAGService;