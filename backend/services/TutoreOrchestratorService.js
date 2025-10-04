// services/TutorOrchestratorService.js - Updated for EnhancedRAG Integration

class TutorOrchestratorService {
  constructor(ragService, internetService, ollamaService, historyRAGService = null) {
    // Services (ragService is now EnhancedRAGService)
    this.ragService = ragService;
    this.internetService = internetService;
    this.ollamaService = ollamaService;
    this.historyRAGService = historyRAGService;
    
    // Configuration
    this.maxLocalResults = 3;
    this.maxInternetResults = 2;
    this.maxHistoryResults = 2;
    
    // Statistics
    this.stats = {
      totalQueries: 0,
      avgResponseTime: 0,
      sourceUsage: {
        chromadb: 0,
        legacy_rag: 0,
        internet: 0,
        history: 0
      }
    };
  }

  /**
   * Main orchestration method - Enhanced with ChromaDB semantic search
   * @param {string} query - User's question
   * @param {string} userLevel - User's proficiency level
   * @param {object} context - Additional context
   * @returns {Promise<object>}
   */
  async getAugmentedAnswer(query, userLevel = 'beginner', context = {}) {
    console.log(`🎯 TutorOrchestrator processing: "${query}" (${userLevel})`);

    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      // ============================================
      // Phase 1: Parallel Multi-Source Search
      // ============================================
      console.log('🔍 Phase 1: Searching all sources in parallel...');
      
      const sources = {
        local_resources: 0,
        internet_sources: 0,
        history_contexts: 0,
        summary: ''
      };

      let localContent = [];
      let internetContent = [];
      let historyContext = [];

      // Check if we have preloaded Advanced RAG results
      if(context.preloadedRAGResults && context.preloadedRAGResults.length > 0) {
        console.log(`  📂 Using ${context.preloadedRAGResults.length} preloaded Advanced RAG results`);
        localContent = context.preloadedRAGResults.slice(0, this.maxLocalResults);
        sources.local_resources = localContent.length;
        
        // Still search internet and history in parallel
        const searchPromises = [this.searchInternetContent(query, userLevel)];
        
        if (this.historyRAGService && this.historyRAGService.isEnabled) {
          searchPromises.push(this.searchHistoryContent(query, userLevel));
        }
        
        const results = await Promise.all(searchPromises);
        internetContent = results[0];
        historyContext = results[1] || [];
        
      } else {
        console.log('  📂 Searching all sources...');
        
        const searchPromises = [
          this.searchLocalContent(query, userLevel),
          this.searchInternetContent(query, userLevel)
        ];

        // Add history search if available
        if (this.historyRAGService && this.historyRAGService.isInitialized) {
          console.log('  📚 Adding history search to promises...');
          searchPromises.push(this.searchHistoryContent(query, userLevel));
        } else {
          console.log('  ⚠️ History RAG service not available or not initialized');
        }

        console.log(`  ⏳ Waiting for ${searchPromises.length} search promises...`);
        const searchResults = await Promise.allSettled(searchPromises);
        console.log('  ✅ All search promises settled');

        // Extract results
        console.log('  📦 Extracting search results...');
        localContent = searchResults[0].status === 'fulfilled' ? searchResults[0].value : [];
        console.log(`  ✅ Local results extracted: ${localContent.length} items`);
        
        internetContent = searchResults[1].status === 'fulfilled' ? searchResults[1].value : [];
        console.log(`  ✅ Internet results extracted: ${internetContent.length} items`);
        
        historyContext = searchResults.length > 2 && searchResults[2].status === 'fulfilled' 
          ? searchResults[2].value : [];
        console.log(`  ✅ History results extracted: ${historyContext.length} items`);
      }

      // Track source usage
      if (localContent.length > 0) {
        if (context.preloadedRAGResults) {
          console.log('  ✅ Advanced RAG (Hybrid): Found results');
        } else if (this.ragService.useChromaDB) {
          this.stats.sourceUsage.chromadb++;
          console.log('  ✅ ChromaDB semantic search: Found results');
        } else {
          this.stats.sourceUsage.legacy_rag++;
          console.log('  ✅ Legacy keyword search: Found results');
        }
      }
      if (internetContent.length > 0) {
        this.stats.sourceUsage.internet++;
        console.log('  ✅ Internet search: Found results');
      }
      if (historyContext.length > 0) {
        this.stats.sourceUsage.history++;
        console.log('  ✅ History search: Found results');
      }

      // ============================================
      // Phase 2: Combine and Rank Results
      // ============================================
      console.log('📊 Phase 2: Combining and ranking results...');
      console.log(`  Input: ${localContent.length} local, ${internetContent.length} internet, ${historyContext.length} history`);
      
      const augmentedContext = this.combineAndRankResults(
        localContent,
        internetContent,
        historyContext,
        query,
        userLevel
      );

      console.log('  ✅ Results combined successfully');
      console.log(`  📚 Total sources: ${augmentedContext.local.length + augmentedContext.internet.length + augmentedContext.history.length}`);

      // ============================================
      // Phase 3: Get User Profile (if available)
      // ============================================
      console.log('👤 Getting user profile...');
      const userProfile = this.historyRAGService 
        ? this.historyRAGService.getUserLearningProfile() 
        : null;
      console.log(`  ${userProfile ? '✅' : 'ℹ️'} User profile: ${userProfile ? 'available' : 'not available'}`);

      // ============================================
      // Phase 4: Generate Enhanced Response
      // ============================================
      console.log('🤖 Phase 4: Generating LLM response...');
      console.log('  📝 Preparing context for Ollama...');
      
      const ollamaContext = {
        ...context,
        level: userLevel,
        rag_context: augmentedContext.local,
        internet_context: augmentedContext.internet,
        history_context: augmentedContext.history,
        user_profile: userProfile,
        combined_sources: augmentedContext.summary,
        search_mode: this.ragService.useChromaDB ? 'semantic' : 'keyword'
      };
      
      console.log('  🚀 Calling ollamaService.tutorChat...');
      console.log(`  Query: "${query}"`);
      console.log(`  Context keys: ${Object.keys(ollamaContext).join(', ')}`);
      
      const response = await this.ollamaService.tutorChat(query, ollamaContext);
      
      console.log('  ✅ Ollama response received');
      console.log(`  Response length: ${response.length} characters`);

      // ============================================
      // Phase 5: Return Complete Result
      // ============================================
      const processingTime = Date.now() - startTime;
      
      // Update average response time
      this.stats.avgResponseTime = 
        ((this.stats.avgResponseTime * (this.stats.totalQueries - 1)) + processingTime) / this.stats.totalQueries;

      console.log(`✅ Complete processing in ${processingTime}ms`);

      return {
        response,
        sources: {
          local: augmentedContext.local,
          internet: augmentedContext.internet,
          history: augmentedContext.history,
          summary: augmentedContext.summary
        },
        metadata: {
          search_mode: this.ragService.useChromaDB ? 'semantic_chromadb' : 'keyword_legacy',
          user_profile: userProfile,
          processing_time: processingTime,
          query: query,
          level: userLevel,
          total_sources: augmentedContext.local.length + augmentedContext.internet.length + augmentedContext.history.length
        }
      };

    } catch (error) {
      console.error('🚨🚨🚨 CRITICAL ERROR in TutorOrchestrator 🚨🚨🚨');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('========================================');
      
      // ============================================
      // Fallback Strategy
      // ============================================
      console.log('⚠️ Falling back to local RAG only...');
      
      const localResults = await this.searchLocalContent(query, userLevel);
      const response = await this.ollamaService.tutorChat(query, {
        ...context,
        level: userLevel,
        rag_context: localResults
      });

      return {
        response,
        sources: {
          local: localResults,
          internet: [],
          history: [],
          summary: `Using local resources only due to error: ${error.message}`
        },
        metadata: {
          search_mode: 'fallback',
          processing_time: Date.now() - startTime,
          query: query,
          level: userLevel,
          fallback_mode: true,
          error: error.message
        }
      };
    }
  } 

  /**
   * Search local RAG content (now with ChromaDB semantic search!)
   */
  async searchLocalContent(query, userLevel) {
    try {
      console.log(`  ðŸ” Searching local RAG (${this.ragService.useChromaDB ? 'ChromaDB' : 'Legacy'})...`);
      
      if (!this.ragService.isInitialized) {
        console.log('  âš ï¸  RAG service not initialized, attempting to initialize...');
        await this.ragService.initialize();
      }
      
      // EnhancedRAGService automatically uses ChromaDB if available
      const results = await this.ragService.searchRelevantContent(
        query, 
        userLevel, 
        this.maxLocalResults
      );
      
      console.log(`  âœ… Found ${results.length} local results`);
      return results;
      
    } catch (error) {
      console.error('âŒ Local RAG search error:', error);
      return [];
    }
  }

  /**
   * Search internet content with Japanese language learning focus
   */
  async searchInternetContent(query, userLevel) {
    try {
      console.log('  ðŸŒ Searching internet sources...');
      
      const japaneseQuery = this.buildJapaneseSearchQuery(query, userLevel);
      const results = await this.internetService.search(japaneseQuery, this.maxInternetResults);
      
      console.log(`  âœ… Found ${results.length} internet results`);
      return results;
      
    } catch (error) {
      console.error('âŒ Internet search error:', error);
      return [];
    }
  }

  /**
   * Search conversation history for relevant context
   */
  async searchHistoryContent(query, userLevel) {
    try {
      if (!this.historyRAGService || !this.historyRAGService.isInitialized) {
        console.log('  âš ï¸  History RAG service not available');
        return [];
      }
      
      console.log('  ðŸ“š Searching conversation history...');
      
      const historyResults = await this.historyRAGService.searchHistoryContext(
        query, 
        userLevel, 
        this.maxHistoryResults
      );
      
      console.log(`  âœ… Found ${historyResults.length} historical contexts`);
      return historyResults;
      
    } catch (error) {
      console.error('âŒ History search error:', error);
      return [];
    }
  }

  /**
   * Build optimized search query for Japanese learning resources
   */
  buildJapaneseSearchQuery(query, userLevel) {
    const levelTerms = {
      'beginner': 'beginner JLPT N5 N4',
      'elementary': 'elementary JLPT N4 N3',
      'intermediate': 'intermediate JLPT N3 N2',
      'advanced': 'advanced JLPT N2 N1'
    };

    const japaneseTerms = [
      'Japanese grammar',
      'Japanese language',
      'Japanese learning',
      'JLPT',
      levelTerms[userLevel] || 'beginner'
    ];

    return `${query} ${japaneseTerms.join(' ')}`;
  }

  /**
   * Combine and rank results from different sources
   * Enhanced with ChromaDB similarity scores
   */
  combineAndRankResults(localResults, internetResults, historyResults = [], query, userLevel) {
    const combined = {
      local: localResults.map(result => ({
        ...result,
        source_type: 'local',
        search_mode: this.ragService.useChromaDB ? 'semantic' : 'keyword',
        relevance_boost: this.calculateLocalRelevance(result, query)
      })),
      internet: internetResults.map(result => ({
        ...result,
        source_type: 'internet',
        relevance_boost: this.calculateInternetRelevance(result, query)
      })),
      history: historyResults.map(result => ({
        ...result,
        source_type: 'history',
        relevance_boost: this.calculateHistoryRelevance(result, query)
      })),
      summary: ''
    };

    // ============================================
    // Create comprehensive summary
    // ============================================
    const totalSources = combined.local.length + combined.internet.length + combined.history.length;
    
    combined.summary = `Found ${totalSources} total resources across all sources:\n`;
    
    // Local sources summary
    if (combined.local.length > 0) {
      const searchMode = this.ragService.useChromaDB ? 'semantic vector search' : 'keyword matching';
      combined.summary += `\nðŸ“š Local RAG (${searchMode}): ${combined.local.length} results\n`;
      combined.summary += `   - ${combined.local.slice(0, 2).map(r => r.title || 'grammar reference').join(', ')}\n`;
      
      if (this.ragService.useChromaDB) {
        const avgScore = (combined.local.reduce((sum, r) => sum + (r.score || 0), 0) / combined.local.length).toFixed(3);
        combined.summary += `   - Avg semantic similarity: ${avgScore}\n`;
      }
    }
    
    // Internet sources summary
    if (combined.internet.length > 0) {
      combined.summary += `\nðŸŒ Internet Sources: ${combined.internet.length} results\n`;
      combined.summary += `   - ${combined.internet.slice(0, 2).map(r => r.title).join(', ')}\n`;
    }
    
    // History sources summary
    if (combined.history.length > 0) {
      const historyTopics = combined.history.flatMap(r => r.topics || []).slice(0, 3);
      combined.summary += `\nðŸ“– Past Conversations: ${combined.history.length} relevant contexts\n`;
      combined.summary += `   - Topics covered: ${historyTopics.join(', ')}\n`;
    }

    return combined;
  }

  /**
   * Calculate relevance score for local content
   * Enhanced for ChromaDB semantic scores
   */
  calculateLocalRelevance(result, query) {
    let score = result.score || 0.5;
    
    // ChromaDB scores are already semantic similarity (0-1)
    // Legacy scores are keyword-based and need normalization
    if (!this.ragService.useChromaDB) {
      // Normalize legacy scores to 0-1 range
      score = Math.min(score / 20, 1.0);
    }
    
    // Boost for grammar-specific content
    if (result.content && result.content.toLowerCase().includes('grammar')) {
      score += 0.1;
    }
    
    // Boost for examples
    if (result.content && (result.content.includes('ä¾‹') || result.content.includes('example'))) {
      score += 0.1;
    }
    
    // Boost for matching category
    if (result.category) {
      const queryLower = query.toLowerCase();
      if (queryLower.includes(result.category.toLowerCase())) {
        score += 0.15;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate relevance score for internet content
   */
  calculateInternetRelevance(result, query) {
    let score = 0.5;
    
    // Boost for trusted Japanese learning sites
    const trustedSites = ['jisho.org', 'guidetojapanese.org', 'japanesetest4you.com', 'imabi.net'];
    if (trustedSites.some(site => result.source_url && result.source_url.includes(site))) {
      score += 0.3;
    }
    
    // Boost for JLPT content
    if (result.title && result.title.toLowerCase().includes('jlpt')) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate relevance score for history content
   */
  calculateHistoryRelevance(result, query) {
    let score = result.score || 0.3;
    
    // Boost for recent conversations
    if (result.source && result.source.includes('today')) {
      score += 0.3;
    } else if (result.source && result.source.includes('yesterday')) {
      score += 0.2;
    }
    
    // Boost for topics that match the query
    const queryLower = query.toLowerCase();
    if (result.topics && result.topics.some(topic => queryLower.includes(topic))) {
      score += 0.2;
    }
    
    // Boost for vocabulary overlap
    if (result.vocabulary_covered && result.vocabulary_covered.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Method to be called after a new conversation message is added
   */
  async onNewConversation(conversationId) {
    if (this.historyRAGService && this.historyRAGService.isInitialized) {
      try {
        await this.historyRAGService.addNewConversationToIndex(conversationId);
        console.log(`âœ… Added conversation ${conversationId} to history index`);
      } catch (error) {
        console.error('âŒ Error adding conversation to history index:', error);
      }
    }
  }

  /**
   * Get comprehensive service statistics
   */
  getStats() {
    const stats = {
      orchestrator: {
        total_queries: this.stats.totalQueries,
        avg_response_time: Math.round(this.stats.avgResponseTime),
        source_usage: this.stats.sourceUsage
      },
      ragService: this.ragService.getStats(),
      internetService: {
        available: !!this.internetService,
        configured: !!(this.internetService && this.internetService.isConfigured())
      },
      historyService: this.historyRAGService ? this.historyRAGService.getStats() : { available: false },
      configuration: {
        max_local_results: this.maxLocalResults,
        max_internet_results: this.maxInternetResults,
        max_history_results: this.maxHistoryResults
      },
      features: {
        semantic_search: this.ragService.useChromaDB,
        local_rag: true,
        internet_search: !!(this.internetService && this.internetService.isConfigured()),
        history_based_rag: !!(this.historyRAGService && this.historyRAGService.isInitialized),
        personalized_learning: !!(this.historyRAGService && this.historyRAGService.isInitialized)
      }
    };

    return stats;
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats() {
    this.stats = {
      totalQueries: 0,
      avgResponseTime: 0,
      sourceUsage: {
        chromadb: 0,
        legacy_rag: 0,
        internet: 0,
        history: 0
      }
    };
  }
}

module.exports = TutorOrchestratorService;