// TutorOrchestratorService.js

class TutorOrchestratorService {
  constructor(ragService, internetService, ollamaService) {
    this.ragService = ragService;
    this.internetService = internetService;
    this.ollamaService = ollamaService;
    this.maxLocalResults = 3;
    this.maxInternetResults = 2;
  }

  /**
   * Main orchestration method that combines local RAG and internet search
   * @param {string} query - User's question
   * @param {string} userLevel - User's proficiency level
   * @param {object} context - Additional context
   * @returns {Promise<object>}
   */
  async getAugmentedAnswer(query, userLevel = 'beginner', context = {}) {
    console.log(`🎯 TutorOrchestrator processing: "${query}" (${userLevel})`);

    const startTime = Date.now();

    try {
      // Run both searches in parallel for efficiency
      const [localResults, internetResults] = await Promise.allSettled([
        this.searchLocalContent(query, userLevel),
        this.searchInternetContent(query, userLevel)
      ]);

      const augmentedContext = this.combineResults(
        localResults.status === 'fulfilled' ? localResults.value : [],
        internetResults.status === 'fulfilled' ? internetResults.value : [],
        query,
        userLevel
      );

      // Generate response using enhanced context
      const response = await this.ollamaService.tutorChat(query, {
        ...context,
        level: userLevel,
        rag_context: augmentedContext.local,
        internet_context: augmentedContext.internet,
        combined_sources: augmentedContext.summary
      });

      const processingTime = Date.now() - startTime;

      return {
        response,
        sources: {
          local: augmentedContext.local,
          internet: augmentedContext.internet,
          summary: augmentedContext.summary
        },
        processing_time: processingTime,
        query: query,
        level: userLevel
      };

    } catch (error) {
      console.error('🚨 TutorOrchestrator error:', error);
      
      // Fallback to local RAG only
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
          summary: `Using local resources only due to internet search error: ${error.message}`
        },
        processing_time: Date.now() - startTime,
        query: query,
        level: userLevel,
        fallback_mode: true
      };
    }
  }

  /**
   * Search local RAG content
   */
  async searchLocalContent(query, userLevel) {
    try {
      if (!this.ragService.isInitialized) {
        console.log('⚠️  RAG service not initialized, attempting to initialize...');
        await this.ragService.initialize();
      }
      
      return await this.ragService.searchRelevantContent(query, userLevel, this.maxLocalResults);
    } catch (error) {
      console.error('❌ Local RAG search error:', error);
      return [];
    }
  }

  /**
   * Search internet content with Japanese language learning focus
   */
  async searchInternetContent(query, userLevel) {
    try {
      // Create focused search queries for Japanese learning
      const japaneseQuery = this.buildJapaneseSearchQuery(query, userLevel);
      return await this.internetService.search(japaneseQuery, this.maxInternetResults);
    } catch (error) {
      console.error('❌ Internet search error:', error);
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

    // Combine the original query with Japanese learning terms
    return `${query} ${japaneseTerms.join(' ')} site:jisho.org OR site:guidetojapanese.org OR site:japanesetest4you.com OR site:imabi.net`;
  }

  /**
   * Combine and rank results from different sources
   */
  combineResults(localResults, internetResults, query, userLevel) {
    const combined = {
      local: localResults.map(result => ({
        ...result,
        source_type: 'local',
        relevance_boost: this.calculateLocalRelevance(result, query)
      })),
      internet: internetResults.map(result => ({
        ...result,
        source_type: 'internet',
        relevance_boost: this.calculateInternetRelevance(result, query)
      })),
      summary: ''
    };

    // Create a summary of available sources
    const totalSources = combined.local.length + combined.internet.length;
    combined.summary = `Found ${combined.local.length} local resources and ${combined.internet.length} internet resources (${totalSources} total). `;
    
    if (combined.local.length > 0) {
      combined.summary += `Local sources include: ${combined.local.map(r => r.title || 'grammar reference').slice(0, 2).join(', ')}. `;
    }
    
    if (combined.internet.length > 0) {
      combined.summary += `Internet sources include: ${combined.internet.map(r => r.title).slice(0, 2).join(', ')}.`;
    }

    return combined;
  }

  /**
   * Calculate relevance score for local content
   */
  calculateLocalRelevance(result, query) {
    let score = result.score || 0.5;
    
    // Boost score for grammar-specific content
    if (result.content && result.content.toLowerCase().includes('grammar')) {
      score += 0.1;
    }
    
    // Boost for examples
    if (result.content && result.content.includes('例') || result.content.includes('example')) {
      score += 0.1;
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
   * Get service statistics
   */
  getStats() {
    return {
      ragService: this.ragService.getStats(),
      internetService: {
        available: !!this.internetService,
        configured: !!(this.internetService && this.internetService.apiKey)
      },
      maxLocalResults: this.maxLocalResults,
      maxInternetResults: this.maxInternetResults
    };
  }
}

module.exports = TutorOrchestratorService;