// services/QueryExpansionService.js - Expands queries for better search results

class QueryExpansionService {
  constructor(options = {}) {
    this.maxExpansions = options.maxExpansions || 5;
    this.useSemanticExpansion = options.useSemanticExpansion !== false;
    
    // Japanese-specific synonym mappings
    this.synonymMaps = this.buildSynonymMaps();
    
    // Grammar patterns for expansion
    this.grammarPatterns = this.buildGrammarPatterns();
    
    // Statistics
    this.stats = {
      totalExpansions: 0,
      avgExpansionCount: 0,
      expansionTypes: {
        synonym: 0,
        related: 0,
        grammar: 0,
        romaji: 0
      }
    };
  }

  /**
   * Expand a query with synonyms and related terms
   * @param {string} query - Original query
   * @param {string} level - User level
   * @returns {object} Expanded query with variations
   */
  async expandQuery(query, level = 'beginner') {
    console.log(`🔍 Expanding query: "${query}"`);
    this.stats.totalExpansions++;

    const expansions = {
      original: query,
      synonyms: [],
      related: [],
      grammar: [],
      romaji: [],
      combined: []
    };

    try {
      // 1. Find synonyms
      expansions.synonyms = this.findSynonyms(query, level);
      
      // 2. Find related terms
      expansions.related = this.findRelatedTerms(query, level);
      
      // 3. Expand grammar patterns
      expansions.grammar = this.expandGrammarPatterns(query);
      
      // 4. Add romaji variations
      expansions.romaji = this.addRomajiVariations(query);
      
      // 5. Create combined expansions
      expansions.combined = this.combineExpansions(expansions);

      // Update statistics
      this.updateStatistics(expansions);

      console.log(`  ✅ Generated ${expansions.combined.length} query variations`);
      return expansions;

    } catch (error) {
      console.error('Query expansion error:', error);
      return {
        original: query,
        synonyms: [],
        related: [],
        grammar: [],
        romaji: [],
        combined: [query]
      };
    }
  }

  /**
   * Find synonyms for query terms
   */
  findSynonyms(query, level) {
    const queryLower = query.toLowerCase();
    const synonyms = new Set();

    // Check against synonym maps
    for (const [term, syns] of Object.entries(this.synonymMaps)) {
      if (queryLower.includes(term)) {
        // Filter by level
        const levelAppropriate = syns.filter(syn => 
          this.isLevelAppropriate(syn.level, level)
        );
        
        levelAppropriate.forEach(syn => {
          synonyms.add(syn.term);
          this.stats.expansionTypes.synonym++;
        });
      }
    }

    return Array.from(synonyms);
  }

  /**
   * Find related terms
   */
  findRelatedTerms(query, level) {
    const related = new Set();
    const queryLower = query.toLowerCase();

    // Grammar-related expansions
    if (queryLower.includes('particle')) {
      related.add('助詞 joshi');
      related.add('は wa が ga を wo');
      this.stats.expansionTypes.related++;
    }

    if (queryLower.includes('verb')) {
      related.add('動詞 doushi');
      related.add('conjugation 活用');
      related.add('u-verb ru-verb');
      this.stats.expansionTypes.related++;
    }

    if (queryLower.includes('greeting')) {
      related.add('挨拶 aisatsu');
      related.add('おはよう こんにちは こんばんは');
      this.stats.expansionTypes.related++;
    }

    if (queryLower.includes('counting')) {
      related.add('数える kazoeru');
      related.add('counter 助数詞');
      related.add('いち に さん');
      this.stats.expansionTypes.related++;
    }

    if (queryLower.includes('polite')) {
      related.add('丁寧 teinei');
      related.add('です ます keigo');
      this.stats.expansionTypes.related++;
    }

    return Array.from(related);
  }

  /**
   * Expand grammar patterns
   */
  expandGrammarPatterns(query) {
    const expansions = [];
    const queryLower = query.toLowerCase();

    for (const [pattern, data] of Object.entries(this.grammarPatterns)) {
      if (queryLower.includes(pattern)) {
        expansions.push(...data.variations);
        this.stats.expansionTypes.grammar++;
      }
    }

    return expansions;
  }

  /**
   * Add romaji variations for Japanese text
   */
  addRomajiVariations(query) {
    const variations = new Set();
    
    // Common romaji mappings
    const romajiMap = {
      'は': ['wa', 'ha'],
      'を': ['wo', 'o'],
      'へ': ['e', 'he'],
      'です': ['desu'],
      'ます': ['masu'],
      'ください': ['kudasai'],
      'おはよう': ['ohayou', 'ohayo'],
      'ありがとう': ['arigatou', 'arigato'],
      'こんにちは': ['konnichiwa'],
      'さようなら': ['sayounara', 'sayonara']
    };

    for (const [japanese, romaji] of Object.entries(romajiMap)) {
      if (query.includes(japanese)) {
        romaji.forEach(r => {
          variations.add(query.replace(japanese, r));
          this.stats.expansionTypes.romaji++;
        });
      }
    }

    return Array.from(variations);
  }

  /**
   * Combine all expansions into final query variations
   */
  combineExpansions(expansions) {
    const combined = new Set();
    
    // Always include original
    combined.add(expansions.original);

    // Add top synonyms
    expansions.synonyms.slice(0, 3).forEach(syn => {
      combined.add(`${expansions.original} ${syn}`);
    });

    // Add top related terms
    expansions.related.slice(0, 2).forEach(rel => {
      combined.add(`${expansions.original} ${rel}`);
    });

    // Add grammar variations
    expansions.grammar.slice(0, 2).forEach(gram => {
      combined.add(gram);
    });

    // Add romaji variations
    expansions.romaji.slice(0, 2).forEach(rom => {
      combined.add(rom);
    });

    // Limit total expansions
    return Array.from(combined).slice(0, this.maxExpansions + 1);
  }

  /**
   * Build synonym mappings for Japanese learning
   */
  buildSynonymMaps() {
    return {
      // Grammar terms
      'particle': [
        { term: '助詞', level: 'beginner' },
        { term: 'joshi', level: 'beginner' },
        { term: 'postposition', level: 'advanced' }
      ],
      'verb': [
        { term: '動詞', level: 'beginner' },
        { term: 'doushi', level: 'beginner' },
        { term: 'action word', level: 'beginner' }
      ],
      'adjective': [
        { term: '形容詞', level: 'elementary' },
        { term: 'keiyoushi', level: 'elementary' },
        { term: 'i-adjective', level: 'elementary' },
        { term: 'na-adjective', level: 'elementary' }
      ],
      'conjugation': [
        { term: '活用', level: 'elementary' },
        { term: 'katsuyou', level: 'elementary' },
        { term: 'inflection', level: 'intermediate' }
      ],
      
      // Topics
      'greeting': [
        { term: '挨拶', level: 'beginner' },
        { term: 'aisatsu', level: 'beginner' },
        { term: 'salutation', level: 'intermediate' }
      ],
      'introduction': [
        { term: '自己紹介', level: 'beginner' },
        { term: 'jikoshoukai', level: 'beginner' },
        { term: 'self-introduction', level: 'beginner' }
      ],
      'counting': [
        { term: '数える', level: 'beginner' },
        { term: 'kazoeru', level: 'beginner' },
        { term: 'counter', level: 'beginner' }
      ],
      'food': [
        { term: '食べ物', level: 'beginner' },
        { term: 'tabemono', level: 'beginner' },
        { term: 'cuisine', level: 'elementary' }
      ],
      
      // Levels
      'polite': [
        { term: '丁寧', level: 'beginner' },
        { term: 'teinei', level: 'beginner' },
        { term: 'formal', level: 'beginner' },
        { term: 'keigo', level: 'intermediate' }
      ],
      'casual': [
        { term: '普通', level: 'elementary' },
        { term: 'futsuu', level: 'elementary' },
        { term: 'plain form', level: 'elementary' }
      ],
      
      // Common verbs
      'eat': [
        { term: '食べる', level: 'beginner' },
        { term: 'taberu', level: 'beginner' }
      ],
      'drink': [
        { term: '飲む', level: 'beginner' },
        { term: 'nomu', level: 'beginner' }
      ],
      'go': [
        { term: '行く', level: 'beginner' },
        { term: 'iku', level: 'beginner' }
      ],
      'come': [
        { term: '来る', level: 'beginner' },
        { term: 'kuru', level: 'beginner' }
      ],
      'see': [
        { term: '見る', level: 'beginner' },
        { term: 'miru', level: 'beginner' }
      ]
    };
  }

  /**
   * Build grammar pattern expansions
   */
  buildGrammarPatterns() {
    return {
      'て form': {
        variations: [
          'te-form',
          'て-form',
          'て形',
          'te conjugation',
          'connecting form'
        ]
      },
      'past tense': {
        variations: [
          'た form',
          'ta-form',
          'past',
          '過去形',
          'kako-kei'
        ]
      },
      'negative': {
        variations: [
          'ない form',
          'nai-form',
          'negation',
          '否定',
          'hitei'
        ]
      },
      'potential': {
        variations: [
          'can do',
          'られる',
          'possibility',
          '可能形',
          'kanou-kei'
        ]
      },
      'passive': {
        variations: [
          'られる',
          '受身',
          'ukemi',
          'passive voice'
        ]
      },
      'causative': {
        variations: [
          'させる',
          'make someone do',
          '使役',
          'shieki'
        ]
      }
    };
  }

  /**
   * Check if term is appropriate for user level
   */
  isLevelAppropriate(termLevel, userLevel) {
    const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced'];
    const termIndex = levelOrder.indexOf(termLevel);
    const userIndex = levelOrder.indexOf(userLevel);
    
    // Show current level and below
    return termIndex <= userIndex;
  }

  /**
   * Update statistics
   */
  updateStatistics(expansions) {
    const totalExpansions = 
      expansions.synonyms.length +
      expansions.related.length +
      expansions.grammar.length +
      expansions.romaji.length;
    
    this.stats.avgExpansionCount = 
      ((this.stats.avgExpansionCount * (this.stats.totalExpansions - 1)) + 
       totalExpansions) / this.stats.totalExpansions;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      total_expansions_performed: this.stats.totalExpansions,
      avg_terms_per_expansion: Math.round(this.stats.avgExpansionCount * 10) / 10,
      expansion_types: this.stats.expansionTypes,
      configuration: {
        max_expansions: this.maxExpansions,
        semantic_expansion_enabled: this.useSemanticExpansion
      }
    };
  }
}

module.exports = QueryExpansionService;