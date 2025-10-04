// InternetAugmentationService.js - Refactored for Clarity and Single Responsibility

const axios = require('axios');

class InternetAugmentationService {
  constructor(apiKey = null, searchEngineId = null) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY;
    this.searchEngineId = searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.searchUrl = 'https://www.googleapis.com/customsearch/v1';
    this.requestTimeout = 5000; // 5 seconds
  }

  /**
   * Searches the web using the configured Google Programmable Search Engine.
   * This method has a single responsibility: perform the search and format the results.
   * If the search fails or returns no results, it returns an empty array.
   * The responsibility of handling an empty result lies with the calling service (e.g., TutorOrchestrator).
   * 
   * @param {string} query - The search term.
   * @param {number} maxResults - The maximum number of results to return.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of formatted search results, or an empty array on failure.
   */
  async search(query, maxResults = 3) {
    if (!this.isConfigured()) {
      console.warn('⚠️ InternetAugmentationService is not configured. API key or Search Engine ID is missing. Skipping search.');
      return []; // Return empty if not configured
    }

    try {
      console.log(`🌐 Searching curated internet sources for: "${query}"`);
      const response = await this._performSearchRequest(query, maxResults);

      // Check if the response has items and the array is not empty
      if (response?.data?.items?.length > 0) {
        const results = this._formatResults(response.data.items);
        console.log(`✅ Found ${results.length} results from the internet.`);
        return results;
      } else {
        // This is a valid outcome, not an error. It means the search found nothing.
        console.log('✅ Search successful, but no relevant results found in the curated sources.');
        return [];
      }
    } catch (error) {
      // This catches actual network/API errors
      console.error('❌ An error occurred during the Google Search API call:', error.message);
      return []; // On any error, return an empty array
    }
  }

  /**
   * (Internal) Performs the actual GET request to the Google Custom Search API.
   * @private
   */
  async _performSearchRequest(query, maxResults) {
    const params = {
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: Math.min(maxResults, 10), // Google API allows a max of 10
      lr: 'lang_en',
      safe: 'active'
    };

    return axios.get(this.searchUrl, {
      params,
      timeout: this.requestTimeout
    });
  }

  /**
   * (Internal) Formats the raw items from the Google API into a standardized structure.
   * @private
   */
  _formatResults(items) {
    return items.map((item, index) => ({
      title: this._cleanText(item.title),
      snippet: this._cleanText(item.snippet),
      source_url: item.link,
      score: this._calculateScore(item, index),
      source_type: 'google_search',
      domain: this._extractDomain(item.link)
    }));
  }

  /**
   * (Internal) Calculates a relevance score for a given search result.
   * @private
   */
  _calculateScore(item, index) {
    // Start with a base score that decreases with position
    let score = Math.max(0.9 - (index * 0.1), 0.3);
    
    // You can still boost scores from domains you trust the most, even within your curated list
    const trustedDomains = {
      'jisho.org': 0.95,
      'guidetojapanese.org': 0.9,
      'imabi.net': 0.9,
    };

    const domain = this._extractDomain(item.link);
    if (trustedDomains[domain]) {
      score = Math.max(score, trustedDomains[domain]);
    }

    return Math.min(score, 1.0);
  }

  /**
   * (Internal) Extracts the domain from a URL.
   * @private
   */
  _extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * (Internal) Cleans and truncates text.
   * @private
   */
  _cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim().substring(0, 300);
  }

  /**
   * Checks if the service has the necessary API credentials.
   */
  isConfigured() {
    return !!(this.apiKey && this.searchEngineId);
  }

  /**
   * Gets the current status of the service.
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured(),
      searchUrl: this.searchUrl
    };
  }
}

module.exports = InternetAugmentationService;