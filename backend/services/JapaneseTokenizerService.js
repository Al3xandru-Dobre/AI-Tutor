// services/JapaneseTokenizerService.js - Advanced Japanese tokenization using Kuromoji

const kuromoji = require('kuromoji');
const path = require('path');

/**
 * Japanese tokenization service using Kuromoji morphological analyzer
 * Provides proper Japanese word segmentation and part-of-speech tagging
 */
class JapaneseTokenizerService {
  constructor(options = {}) {
    this.dicPath = options.dicPath || path.join(
      __dirname,
      '../node_modules/kuromoji/dict'
    );

    this.tokenizer = null;
    this.initialized = false;

    // Token cache for performance
    this.tokenCache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;

    // Stats
    this.stats = {
      totalTokenizations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgTokenizationTime: 0
    };
  }

  /**
   * Initialize the Kuromoji tokenizer
   */
  async initialize() {
    console.log('🇯🇵 Initializing Japanese Tokenizer Service...');
    console.log(`   Dictionary path: ${this.dicPath}`);

    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: this.dicPath }).build((err, tokenizer) => {
        if (err) {
          console.error('   ❌ Failed to initialize Kuromoji:', err);
          reject(err);
          return;
        }

        this.tokenizer = tokenizer;
        this.initialized = true;
        console.log('   ✅ Japanese tokenizer initialized');
        resolve(true);
      });
    });
  }

  /**
   * Tokenize Japanese text
   * @param {string} text - Text to tokenize
   * @param {object} options - Tokenization options
   * @returns {Array} Array of tokens with metadata
   */
  tokenize(text, options = {}) {
    const {
      useCache = true,
      includeMetadata = false,
      filterPOS = null // Array of POS to keep (e.g., ['名詞', '動詞'])
    } = options;

    if (!this.initialized || !this.tokenizer) {
      console.warn('⚠️  Tokenizer not initialized, using fallback');
      return this.fallbackTokenize(text);
    }

    // Check cache
    const cacheKey = `${text}_${includeMetadata}_${filterPOS}`;
    if (useCache && this.tokenCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.tokenCache.get(cacheKey);
    }

    const startTime = Date.now();

    // Tokenize using Kuromoji
    const tokens = this.tokenizer.tokenize(text);

    // Process tokens
    let processedTokens = tokens.map(token => {
      if (includeMetadata) {
        return {
          surface: token.surface_form,    // The actual word
          reading: token.reading,          // Reading in katakana
          baseForm: token.basic_form,      // Dictionary/base form
          pos: token.pos,                  // Part of speech (名詞, 動詞, etc.)
          posDetail: token.pos_detail_1,   // Detailed POS
          conjugationType: token.conjugated_type,
          conjugationForm: token.conjugated_form
        };
      } else {
        return token.surface_form;
      }
    });

    // Filter by POS if requested
    if (filterPOS && Array.isArray(filterPOS)) {
      processedTokens = processedTokens.filter((token, idx) => {
        const originalToken = tokens[idx];
        return filterPOS.includes(originalToken.pos);
      });
    }

    // Update stats
    const tokenizationTime = Date.now() - startTime;
    this.stats.totalTokenizations++;
    this.stats.cacheMisses++;
    this.stats.avgTokenizationTime =
      ((this.stats.avgTokenizationTime * (this.stats.totalTokenizations - 1)) +
       tokenizationTime) / this.stats.totalTokenizations;

    // Cache result
    if (useCache) {
      if (this.tokenCache.size >= this.maxCacheSize) {
        // Remove oldest entry (simple FIFO)
        const firstKey = this.tokenCache.keys().next().value;
        this.tokenCache.delete(firstKey);
      }
      this.tokenCache.set(cacheKey, processedTokens);
    }

    return processedTokens;
  }

  /**
   * Tokenize with English/Japanese mixed text handling
   * @param {string} text - Mixed language text
   * @returns {Array} Array of tokens
   */
  tokenizeMixed(text) {
    if (!this.initialized) {
      return this.fallbackTokenize(text);
    }

    // Separate English and Japanese portions
    const segments = this.segmentMixedText(text);

    const allTokens = [];

    for (const segment of segments) {
      if (segment.type === 'japanese') {
        // Use Kuromoji for Japanese
        const japaneseTokens = this.tokenize(segment.text, { useCache: true });
        allTokens.push(...japaneseTokens);
      } else {
        // Simple tokenization for English/other
        const englishTokens = segment.text
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 0);
        allTokens.push(...englishTokens);
      }
    }

    return allTokens;
  }

  /**
   * Segment text into Japanese and non-Japanese portions
   * @private
   */
  segmentMixedText(text) {
    const segments = [];
    let currentSegment = { type: null, text: '' };

    for (const char of text) {
      const isJapanese = this.isJapaneseChar(char);
      const charType = isJapanese ? 'japanese' : 'other';

      if (currentSegment.type === null) {
        currentSegment.type = charType;
        currentSegment.text = char;
      } else if (currentSegment.type === charType) {
        currentSegment.text += char;
      } else {
        // Type changed, save current segment and start new one
        if (currentSegment.text.trim().length > 0) {
          segments.push({ ...currentSegment });
        }
        currentSegment = { type: charType, text: char };
      }
    }

    // Add final segment
    if (currentSegment.text.trim().length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Check if a character is Japanese
   */
  isJapaneseChar(char) {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x3040 && code <= 0x309f) ||  // Hiragana
      (code >= 0x30a0 && code <= 0x30ff) ||  // Katakana
      (code >= 0x4e00 && code <= 0x9faf) ||  // Kanji
      (code >= 0xff66 && code <= 0xff9f)     // Half-width katakana
    );
  }

  /**
   * Extract keywords from Japanese text
   * Focuses on nouns, verbs, and adjectives
   */
  extractKeywords(text, options = {}) {
    const { maxKeywords = 10, minLength = 2 } = options;

    if (!this.initialized) {
      return this.fallbackTokenize(text).slice(0, maxKeywords);
    }

    // Tokenize with metadata
    const tokens = this.tokenize(text, {
      includeMetadata: true,
      useCache: true
    });

    // Filter for important POS
    const importantPOS = ['名詞', '動詞', '形容詞'];
    const keywords = tokens
      .filter(token => {
        if (typeof token === 'string') return token.length >= minLength;
        return (
          importantPOS.includes(token.pos) &&
          token.surface.length >= minLength
        );
      })
      .map(token => typeof token === 'string' ? token : token.surface);

    // Remove duplicates and limit
    return [...new Set(keywords)].slice(0, maxKeywords);
  }

  /**
   * Analyze JLPT level of text based on token analysis
   * @param {string} text - Text to analyze
   * @returns {object} Level analysis
   */
  analyzeJLPTLevel(text) {
    if (!this.initialized) {
      return { level: 'N5', confidence: 0.5 };
    }

    const tokens = this.tokenize(text, { includeMetadata: true });

    // Simple heuristic based on token complexity
    let complexityScore = 0;
    let kanjiCount = 0;
    let totalChars = 0;

    tokens.forEach(token => {
      if (typeof token === 'object') {
        const surface = token.surface;
        totalChars += surface.length;

        // Count kanji
        for (const char of surface) {
          const code = char.charCodeAt(0);
          if (code >= 0x4e00 && code <= 0x9faf) {
            kanjiCount++;
          }
        }

        // Longer base forms indicate more complex vocabulary
        if (token.baseForm && token.baseForm.length > 3) {
          complexityScore += 2;
        }

        // Complex conjugations
        if (token.conjugationType && token.conjugationType !== '*') {
          complexityScore += 1;
        }
      }
    });

    const kanjiDensity = totalChars > 0 ? kanjiCount / totalChars : 0;
    const avgComplexity = tokens.length > 0 ? complexityScore / tokens.length : 0;

    // Map to JLPT level
    let level = 'N5';
    let confidence = 0.7;

    if (kanjiDensity > 0.4 || avgComplexity > 1.5) {
      level = 'N1';
      confidence = 0.8;
    } else if (kanjiDensity > 0.3 || avgComplexity > 1.2) {
      level = 'N2';
      confidence = 0.75;
    } else if (kanjiDensity > 0.2 || avgComplexity > 0.8) {
      level = 'N3';
      confidence = 0.7;
    } else if (kanjiDensity > 0.1 || avgComplexity > 0.4) {
      level = 'N4';
      confidence = 0.65;
    }

    return {
      level,
      confidence,
      stats: {
        total_tokens: tokens.length,
        kanji_count: kanjiCount,
        kanji_density: kanjiDensity.toFixed(3),
        complexity_score: avgComplexity.toFixed(3)
      }
    };
  }

  /**
   * Fallback tokenization for when Kuromoji is not available
   * @private
   */
  fallbackTokenize(text) {
    // Simple regex-based tokenization
    const japanese = (text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g) || []);
    const english = text
      .toLowerCase()
      .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(word));

    return [...japanese, ...english];
  }

  /**
   * Clear token cache
   */
  clearCache() {
    this.tokenCache.clear();
    console.log('   ✅ Token cache cleared');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      total_tokenizations: this.stats.totalTokenizations,
      cache_hits: this.stats.cacheHits,
      cache_misses: this.stats.cacheMisses,
      cache_hit_rate: this.stats.totalTokenizations > 0
        ? ((this.stats.cacheHits / this.stats.totalTokenizations) * 100).toFixed(2) + '%'
        : '0%',
      avg_tokenization_time_ms: this.stats.avgTokenizationTime.toFixed(2),
      cache_size: this.tokenCache.size,
      max_cache_size: this.maxCacheSize
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Japanese Tokenizer Service...');
    this.tokenCache.clear();
    this.tokenizer = null;
    console.log('   ✅ Cleanup complete');
  }
}

module.exports = JapaneseTokenizerService;
