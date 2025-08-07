// InternetAugmentationService.js
const axios = require('axios');

class InternetAugmentationService {
  constructor(apiKey = null, searchEngineId = null) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY;
    this.searchEngineId = searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.searchUrl = 'https://www.googleapis.com/customsearch/v1';
    this.fallbackEnabled = true;
    this.requestTimeout = 5000; // 5 seconds timeout
    this.maxRetries = 2;
  }

  /**
   * Search the internet using Google Custom Search API with fallback options
   * @param {string} query - Search term
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array<{title: string, snippet: string, source_url: string, score: number}>>}
   */
  async search(query, maxResults = 3) {
    // If API credentials are not available, try fallback search
    if (!this.apiKey || !this.searchEngineId) {
      console.log('⚠️  Google API credentials not found, using fallback search');
      return this.fallbackSearch(query, maxResults);
    }

    try {
      console.log(`🌐 Searching internet for: "${query}"`);
      
      const response = await this.performGoogleSearch(query, maxResults);
      
      if (response && response.data && response.data.items) {
        const results = this.formatGoogleResults(response.data.items);
        console.log(`✅ Found ${results.length} internet results`);
        return results;
      }

      console.log('⚠️  No results from Google Search, trying fallback');
      return this.fallbackSearch(query, maxResults);

    } catch (error) {
      console.error('❌ Google Search error:', error.response?.data || error.message);
      
      if (this.fallbackEnabled) {
        return this.fallbackSearch(query, maxResults);
      }
      
      return [];
    }
  }

  /**
   * Perform Google Custom Search API request
   */
  async performGoogleSearch(query, maxResults) {
    const params = {
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: Math.min(maxResults, 10), // Google API limit
      lr: 'lang_en', // English language results
      safe: 'active',
      // Focus on educational and reliable Japanese learning sources
      siteSearch: 'jisho.org OR guidetojapanese.org OR japanesetest4you.com OR imabi.net OR tofugu.com OR japanesepod101.com'
    };

    return await axios.get(this.searchUrl, {
      params,
      timeout: this.requestTimeout
    });
  }

  /**
   * Format Google Search results into standardized format
   */
  formatGoogleResults(items) {
    return items.map((item, index) => ({
      title: this.cleanText(item.title),
      snippet: this.cleanText(item.snippet),
      source_url: item.link,
      score: this.calculateGoogleScore(item, index),
      source_type: 'google_search',
      domain: this.extractDomain(item.link)
    }));
  }

  /**
   * Calculate relevance score for Google results
   */
  calculateGoogleScore(item, index) {
    let score = Math.max(0.9 - (index * 0.1), 0.3); // Higher score for higher position
    
    // Boost trusted Japanese learning domains
    const trustedDomains = {
      'jisho.org': 0.9,
      'guidetojapanese.org': 0.8,
      'imabi.net': 0.8,
      'tofugu.com': 0.7,
      'japanesepod101.com': 0.7,
      'japanesetest4you.com': 0.6
    };

    const domain = this.extractDomain(item.link);
    if (trustedDomains[domain]) {
      score = Math.max(score, trustedDomains[domain]);
    }

    // Boost for JLPT content
    if (item.title.toLowerCase().includes('jlpt') || item.snippet.toLowerCase().includes('jlpt')) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Fallback search using predefined Japanese learning resources
   */
  async fallbackSearch(query, maxResults) {
    console.log(`🔄 Using fallback search for: "${query}"`);
    
    const fallbackResults = this.generateFallbackResults(query);
    return fallbackResults.slice(0, maxResults);
  }

  /**
   * Generate fallback results based on common Japanese learning topics
   */
  generateFallbackResults(query) {
    const queryLower = query.toLowerCase();
    const fallbackData = [
      {
        title: "Japanese Grammar Guide - Tae Kim's Guide to Japanese",
        snippet: "Comprehensive guide to Japanese grammar covering particles, verb forms, and sentence structure. Perfect for beginners to advanced learners.",
        source_url: "http://www.guidetojapanese.org/learn/grammar",
        score: 0.8,
        source_type: 'fallback',
        domain: 'guidetojapanese.org'
      },
      {
        title: "Jisho.org - Japanese Dictionary",
        snippet: "Online Japanese dictionary with example sentences, stroke order, and JLPT level information for vocabulary and kanji.",
        source_url: "https://jisho.org/",
        score: 0.9,
        source_type: 'fallback',
        domain: 'jisho.org'
      },
      {
        title: "JLPT Grammar Points - Japanese Test 4 You",
        snippet: "Complete collection of JLPT grammar points from N5 to N1 with explanations and example sentences.",
        source_url: "https://japanesetest4you.com/jlpt-grammar-list/",
        score: 0.7,
        source_type: 'fallback',
        domain: 'japanesetest4you.com'
      },
      {
        title: "Imabi - Advanced Japanese Grammar",
        snippet: "Detailed explanations of complex Japanese grammar patterns and linguistic concepts for serious learners.",
        source_url: "http://www.imabi.net/",
        score: 0.8,
        source_type: 'fallback',
        domain: 'imabi.net'
      },
      {
        title: "Tofugu Japanese Learning Resources",
        snippet: "Articles and guides on Japanese language learning, culture, and study methods for all levels.",
        source_url: "https://www.tofugu.com/japanese/",
        score: 0.7,
        source_type: 'fallback',
        domain: 'tofugu.com'
      }
    ];

    // Filter and score based on query relevance
    return fallbackData
      .map(result => ({
        ...result,
        relevance: this.calculateFallbackRelevance(result, queryLower)
      }))
      .filter(result => result.relevance > 0.3)
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate relevance for fallback results
   */
  calculateFallbackRelevance(result, queryLower) {
    let relevance = result.score;
    
    // Check if query terms appear in title or snippet
    const titleLower = result.title.toLowerCase();
    const snippetLower = result.snippet.toLowerCase();
    
    const queryTerms = queryLower.split(' ').filter(term => term.length > 2);
    
    for (const term of queryTerms) {
      if (titleLower.includes(term)) relevance += 0.2;
      if (snippetLower.includes(term)) relevance += 0.1;
    }

    // Boost for specific grammar topics
    const grammarTerms = ['particle', 'verb', 'adjective', 'grammar', 'tense', 'form'];
    if (grammarTerms.some(term => queryLower.includes(term))) {
      if (titleLower.includes('grammar') || snippetLower.includes('grammar')) {
        relevance += 0.2;
      }
    }

    return Math.min(relevance, 1.0);
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Clean and truncate text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF.,!?()]/g, '') // Keep alphanumeric, Japanese chars, and basic punctuation
      .trim()
      .substring(0, 300); // Limit length
  }

  /**
   * Check if service is properly configured
   */
  isConfigured() {
    return !!(this.apiKey && this.searchEngineId);
  }

  /**
   * Get service status and statistics
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      fallback_enabled: this.fallbackEnabled,
      api_available: !!(this.apiKey && this.searchEngineId),
      timeout: this.requestTimeout,
      max_retries: this.maxRetries
    };
  }
}

module.exports = InternetAugmentationService;