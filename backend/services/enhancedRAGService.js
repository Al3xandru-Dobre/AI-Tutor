// services/enhancedRAGService.js - ChromaDB-powered RAG System
const { ChromaClient } = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const pdf = require('pdf-parse');
const { pipeline, env } = require('@xenova/transformers');

// Configure Hugging Face authentication from environment
if (process.env.HUGGING_FACE_HUB_TOKEN) {
  env.accessToken = process.env.HUGGING_FACE_HUB_TOKEN;
}

// Use local model cache but allow remote downloads with token
env.allowLocalModels = true;
env.allowRemoteModels = true; // Allow remote downloads with HuggingFace token

class EnhancedRAGService {
  constructor(options = {}) {
    // ChromaDB configuration
    this.chromaUrl = options.chromaPath || process.env.CHROMA_DB_URL || 'http://localhost:8000';
    this.chromaClient = null;
    this.collectionName = options.collectionName || 'japanese_tutor_knowledge';
    this.collection = null;
    this.embeddingFunction = null;

    // Embedding configuration
    this.embeddingModel = options.embeddingModel || process.env.EMBEDDING_MODEL || 'Xenova/paraphrase-multilingual-mpnet-base-v2';
    // Set embedding dimension based on model
    this.embeddingDimension = this.getEmbeddingDimension(this.embeddingModel);
    
    // Chunking settings
    this.maxChunkSize = options.maxChunkSize || 800;
    this.chunkOverlap = options.chunkOverlap || 100;
    


    // Legacy support (for gradual migration)
    this.documents = new Map();
    this.isInitialized = false;
    this.useChromaDB = options.useChromaDB !== false; // Default to true
    
    // Paths
    this.grammarDataPath = path.join(__dirname, '../data/grammar');
    this.migrationStatusPath = path.join(__dirname, '../data/migration-status.json');
    
    // Statistics
    this.stats = {
      totalDocuments: 0,
      totalChunks: 0,
      totalSearches: 0,
      avgSearchTime: 0,
      lastInitialized: null
    };
  }

  /**
   * Initialize the Enhanced RAG Service
   */
  async initialize() {
    try {
      
      console.log('🔄 Initializing Enhanced RAG Service with ChromaDB...');

      if (this.useChromaDB) {
        //only for development purposes, erases data from ChromaDB
        await this.deleteAndRecreateCollection();

        await this.setupCustomEmbedding();
        await this.initializeChromaDB();
      }

      // Load or create grammar data directory
      await fs.mkdir(this.grammarDataPath, { recursive: true });
      
      // Check migration status
      const migrationStatus = await this.checkMigrationStatus();
      
      if (!migrationStatus.completed) {
        console.log('📦 First time setup - loading sample data...');
        await this.loadSampleGrammarData();
        
        if (this.useChromaDB) {
          console.log('🔄 Migrating data to ChromaDB...');
          await this.migrateToChromaDB();
        }
      } else {
        console.log('✅ Using existing ChromaDB collection');
      }
      
      // Check if we already have data
      const existingCount = this.useChromaDB ? await this.collection.count() : this.documents.size;
      
      // Mark as initialized BEFORE loading grammar files
      this.isInitialized = true;
      this.stats.lastInitialized = new Date().toISOString();
      console.log(`✅ Enhanced RAG Service initialized with ${existingCount} documents`);
      
      // Load additional files from grammar directory in background (non-blocking)
      if (existingCount < 100) {
        console.log('📂 Loading additional grammar files in background...');
        this.loadGrammarFiles().then(() => {
          console.log('✅ Background file loading complete');
        }).catch(err => {
          console.error('⚠️  Background file loading error:', err.message);
        });
      } else {
        console.log('ℹ️  Skipping file loading (collection already populated)');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Enhanced RAG initialization error:', error);
      this.isInitialized = false;
      
      // Fallback to legacy mode
      if (this.useChromaDB) {
        console.log('⚠️  Falling back to legacy RAG mode');
        this.useChromaDB = false;
        await this.loadSampleGrammarData();
        this.isInitialized = true;
      }
      
      return false;
    }
  }


      async deleteAndRecreateCollection() {
        try {
            console.warn(`[DEV-MODE] Attempting to delete collection "${this.collectionName}" to ensure compatibility...`);
            const client = new ChromaClient({ path: this.chromaUrl });
            await client.deleteCollection({ name: this.collectionName });
            console.warn(`✅ Collection "${this.collectionName}" deleted successfully.`);
        } catch (error) {
            // Ignoră eroarea dacă colecția nu există, ceea ce este normal la prima rulare
            console.log(`ℹ️ Collection "${this.collectionName}" did not exist, skipping deletion.`);
        }
    }

  /**
   * Initialize ChromaDB client and collection
   */
  async initializeChromaDB() {
        try {
            console.log(`🔗 Connecting to ChromaDB at ${this.chromaUrl}...`);
            
            this.chromaClient = new ChromaClient({
                path: this.chromaUrl,
                // Authentication dacă e configurat
                auth: process.env.CHROMA_AUTH_TOKEN ? {
                    provider: 'token',
                    credentials: process.env.CHROMA_AUTH_TOKEN
                } : undefined
            });
            
            // Test connection
            const heartbeat = await this.chromaClient.heartbeat();
            console.log('💓 ChromaDB heartbeat:', heartbeat);
            
            // Configurare collection avansată
            let collectionExists = false;
            try {
                this.collection = await this.chromaClient.getCollection({
                    name: this.collectionName,
                    embeddingFunction: this.embeddingFunction
                });
                console.log(`📚 Connected to existing collection: ${this.collectionName}`);
                collectionExists = true;

                // Verifică compatibilitatea dimensiunilor embedding
                await this.checkEmbeddingDimensionCompatibility();

            } catch (error) {
                if (collectionExists) {
                    // Eroare la verificarea dimensiunilor - recreează collection-ul
                    console.warn('⚠️  Embedding dimension mismatch detected. Recreating collection...');
                    await this.chromaClient.deleteCollection({ name: this.collectionName });
                    collectionExists = false;
                }

                if (!collectionExists) {
                    console.log(`📚 Creating new collection with custom config: ${this.collectionName}`);

                    this.collection = await this.chromaClient.createCollection({
                        name: this.collectionName,
                        metadata: {
                            description: 'Japanese language learning content with semantic embeddings',
                            created_at: new Date().toISOString(),
                            embedding_model: this.embeddingModel,
                            embedding_dimension: this.embeddingDimension,

                            // Configurări custom
                            'hnsw:space': 'cosine',  // Metric de similaritate
                            'hnsw:construction_ef': 200,  // Calitate construcție index
                            'hnsw:search_ef': 100,  // Calitate căutare
                            'hnsw:M': 16,  // Număr conexiuni per nod

                            // Metadata pentru filtering
                            'schema_version': '2.0',
                            'language': 'japanese',
                            'domain': 'education'
                        },

                        // Embedding function
                        embeddingFunction: this.embeddingFunction
                    });

                    console.log('✅ Collection created with HNSW index configuration');
                    console.log(`   📊 Embedding dimension: ${this.embeddingDimension}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ ChromaDB initialization failed:', error);
            throw error;
        }
    }
    async setupCustomEmbedding() {
    try {
      console.log('🔄 Attempting to initialize Custom Japanese Embedding Service...');
      const CustomJapaneseEmbedding = require('./customEmbbedingsService');

      const embedder = new CustomJapaneseEmbedding();
      await embedder.initialize();

      // Update model configuration
      this.embeddingModel = embedder.modelName;
      this.embeddingDimension = this.getEmbeddingDimension(this.embeddingModel);

      // Wrap the custom embedder to match ChromaDB's expected interface
      this.embeddingFunction = {
        generate: async (texts) => {
          return await embedder.embed(texts);
        }
      };
      console.log('✅ Custom Japanese Embedding Service initialized successfully.');
      console.log(`   📊 Using model: ${this.embeddingModel}`);
      console.log(`   📏 Embedding dimension: ${this.embeddingDimension}`);
    } catch (error) {
      console.warn('⚠️  Custom Japanese embedder failed to initialize. Falling back to default model.');
      console.warn(`   > Error: ${error.message}`);

      // Fallback: Inițializează un model default cu pipeline
      // Resetează la modelul din constructor/environment
      this.embeddingModel = process.env.EMBEDDING_MODEL || 'Xenova/paraphrase-multilingual-mpnet-base-v2';
      this.embeddingDimension = this.getEmbeddingDimension(this.embeddingModel);

      console.log(`🔄 Loading fallback embedding model: ${this.embeddingModel}...`);
      const fallbackPipeline = await pipeline('feature-extraction', this.embeddingModel);

      this.embeddingFunction = {
        generate: async (texts) => {
          const result = await fallbackPipeline(texts, {
            pooling: 'mean',
            normalize: true
          });
          return result.tolist();
        }
      };
      console.log('✅ Fallback embedding function initialized successfully.');
      console.log(`   📊 Using model: ${this.embeddingModel}`);
      console.log(`   📏 Embedding dimension: ${this.embeddingDimension}`);
    }
  }

  /**
   * Check if embedding dimensions are compatible with the collection
   * Throws error if mismatch detected
   */
  async checkEmbeddingDimensionCompatibility() {
    try {
      // Generate a test embedding to check dimension
      const testEmbeddings = await this.embeddingFunction.generate(['test']);
      const actualDimension = testEmbeddings[0].length;

      console.log(`🔍 Checking embedding compatibility...`);
      console.log(`   Expected dimension: ${this.embeddingDimension}`);
      console.log(`   Actual dimension: ${actualDimension}`);

      if (actualDimension !== this.embeddingDimension) {
        throw new Error(
          `Embedding dimension mismatch: expected ${this.embeddingDimension}, got ${actualDimension}`
        );
      }

      console.log('✅ Embedding dimensions are compatible');
    } catch (error) {
      console.error('❌ Embedding compatibility check failed:', error.message);
      throw error;
    }
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus() {
    try {
      const statusData = await fs.readFile(this.migrationStatusPath, 'utf-8');
      return JSON.parse(statusData);
    } catch (error) {
      return {
        completed: false,
        lastMigration: null,
        documentsCount: 0
      };
    }
  }

  /**
   * Update migration status
   */
  async updateMigrationStatus(status) {
    await fs.writeFile(
      this.migrationStatusPath,
      JSON.stringify(status, null, 2),
      'utf-8'
    );
  }

  /**
   * Load sample grammar data (same as before)
   */
  async loadSampleGrammarData() {
    const sampleContent = [
      {
        title: "Particles は (wa) and が (ga)",
        content: `は (wa) - Topic Marker:
- Indicates what the sentence is about
- "As for X..." or "Speaking of X..."
- Example: 私は学生です (Watashi wa gakusei desu) - "As for me, I am a student"
- Used when introducing a topic or contrasting

が (ga) - Subject Marker:
- Marks the grammatical subject
- Emphasizes who/what performs the action
- Example: 私が行きます (Watashi ga ikimasu) - "I (will) go"
- Used for new information or emphasis

Key difference: は sets the topic, が identifies the subject.`,
        level: "beginner",
        tags: ["particles", "は", "が", "wa", "ga", "topic", "subject"],
        category: "grammar",
        source: "Basic Japanese Grammar Guide"
      },
      {
        title: "Japanese Verb Conjugation - Present Tense",
        content: `Japanese verbs conjugate based on their group:

Group 1 (う-verbs):
- 飲む (nomu) → 飲みます (nomimasu) - to drink
- 読む (yomu) → 読みます (yomimasu) - to read  
- 書く (kaku) → 書きます (kakimasu) - to write

Group 2 (る-verbs):
- 食べる (taberu) → 食べます (tabemasu) - to eat
- 見る (miru) → 見ます (mimasu) - to see

Irregular verbs:
- する (suru) → します (shimasu) - to do
- 来る (kuru) → 来ます (kimasu) - to come

Present tense expresses habitual actions or future actions.`,
        level: "beginner",
        tags: ["verbs", "conjugation", "present", "u-verbs", "ru-verbs", "irregular"],
        category: "grammar",
        source: "Japanese Verb Conjugation Manual"
      },
      {
        title: "Counting in Japanese",
        content: `Japanese has different counters for different objects:

Numbers 1-10:
1: 一 (いち/ichi), 2: 二 (に/ni), 3: 三 (さん/san), 4: 四 (よん/yon), 5: 五 (ご/go)
6: 六 (ろく/roku), 7: 七 (なな/nana), 8: 八 (はち/hachi), 9: 九 (きゅう/kyuu), 10: 十 (じゅう/juu)

Common Counters:
- つ (tsu): general counter for objects (1つ、2つ、3つ)
- 人 (nin/ri): people (一人/hitori, 二人/futari, 三人/sannin)
- 本 (hon/pon/bon): long objects (一本/ippon, 二本/nihon)
- 枚 (mai): flat objects (一枚/ichimai, 二枚/nimai)
- 匹/頭 (hiki/tou): animals

Age: 歳 (sai) - 20歳 (nijuusai) = 20 years old`,
        level: "beginner",
        tags: ["numbers", "counting", "counters", "age", "objects"],
        category: "vocabulary",
        source: "Japanese Numbers and Counting"
      },
      {
        title: "Keigo - Japanese Honorifics",
        content: `Keigo (敬語) is the honorific language system in Japanese:

Sonkeigo (尊敬語) - Respectful language about others:
- いらっしゃる (irassharu) instead of いる (iru) - to be/exist
- なさる (nasaru) instead of する (suru) - to do  
- 召し上がる (meshiagaru) instead of 食べる (taberu) - to eat

Kenjougo (謙譲語) - Humble language about yourself:
- おります (orimasu) instead of います (imasu) - to be
- いたします (itashimasu) instead of します (shimasu) - to do
- いただきます (itadakimasu) instead of 食べます (tabemasu) - to eat

Teineigo (丁寧語) - Polite language:
- です/である (desu/de aru) - copula
- ます (masu) - polite verb ending

Used in business, formal situations, and with people of higher status.`,
        level: "advanced",
        tags: ["keigo", "honorifics", "formal", "business", "respect", "humble"],
        category: "grammar",
        source: "Advanced Japanese Honorifics"
      },
      {
        title: "て-form (Te-form) Usage",
        content: `The て-form is one of the most versatile verb forms in Japanese:

Formation Rules:
う-verbs: 
- う、つ、る → って (kau → katte)
- む、ぶ、ぬ → んで (yomu → yonde)
- く → いて (kiku → kiite)
- ぐ → いで (oyogu → oyoide)
- す → して (hanasu → hanashite)

る-verbs: Drop る, add て (taberu → tabete)

Common Uses:
1. Connecting actions: 起きて、食べて、学校に行きます
2. Requesting: 待ってください (Please wait)
3. Giving/receiving permission: 写真を撮ってもいいですか
4. Progressive: 食べています (am eating)
5. Completed state: 窓が開いています (window is open)`,
        level: "elementary",
        tags: ["te-form", "verbs", "conjugation", "requests", "continuous"],
        category: "grammar",
        source: "Essential Japanese Grammar"
      },
      {
        title: "Common Japanese Greetings",
        content: `Essential greetings for daily conversation:

Time-based greetings:
- おはようございます (Ohayou gozaimasu) - Good morning (polite)
- おはよう (Ohayou) - Good morning (casual)
- こんにちは (Konnichiwa) - Good afternoon/Hello
- こんばんは (Konbanwa) - Good evening

Meeting/Parting:
- はじめまして (Hajimemashite) - Nice to meet you (first time)
- よろしくお願いします (Yoroshiku onegaishimasu) - Please treat me well
- さようなら (Sayounara) - Goodbye (formal)
- じゃあね/またね (Jaa ne/Mata ne) - See you (casual)
- また明日 (Mata ashita) - See you tomorrow

Daily expressions:
- いただきます (Itadakimasu) - Before eating
- ごちそうさまでした (Gochisousama deshita) - After eating
- いってきます (Ittekimasu) - I'm leaving (home)
- いってらっしゃい (Itterasshai) - Take care (to someone leaving)
- ただいま (Tadaima) - I'm home
- おかえりなさい (Okaerinasai) - Welcome home`,
        level: "beginner",
        tags: ["greetings", "phrases", "daily", "conversation", "basics"],
        category: "vocabulary",
        source: "Japanese Conversation Basics"
      }
    ];

    for (const item of sampleContent) {
      const docId = this.generateDocId(item.title);
      this.documents.set(docId, {
        id: docId,
        title: item.title,
        content: item.content,
        level: item.level,
        tags: item.tags,
        category: item.category || 'general',
        source: item.source,
        created: new Date().toISOString()
      });
    }
    
    console.log(`📚 Loaded ${sampleContent.length} sample documents`);
  }

  /**
   * Load grammar files from directory
   */
  async loadGrammarFiles() {
    try {
      const files = await fs.readdir(this.grammarDataPath);
      let loadedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.grammarDataPath, file);
        
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          await this.loadTextFile(filePath);
          loadedCount++;
        } else if (file.endsWith('.pdf')) {
          await this.loadPdfFile(filePath);
          loadedCount++;
        }
      }
      
      if (loadedCount > 0) {
        console.log(`📄 Loaded ${loadedCount} additional files from grammar directory`);
      }
    } catch (error) {
      console.log('ℹ️  No additional grammar files found');
    }
  }

  /**
   * Load text file
   */
  async loadTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath, path.extname(filePath));
      
      await this.addDocument(filename, content, {
        source: filename,
        level: 'general',
        category: 'imported'
      });
    } catch (error) {
      console.error(`Error loading text file ${filePath}:`, error);
    }
  }

  /**
   * Load PDF file
   */
  async loadPdfFile(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      const filename = path.basename(filePath, path.extname(filePath));
      
      await this.addDocument(filename, data.text, {
        source: filename,
        level: 'general',
        category: 'imported'
      });
    } catch (error) {
      console.error(`Error loading PDF file ${filePath}:`, error);
    }
  }

  /**
   * Migrate existing documents to ChromaDB
   */
  async migrateToChromaDB() {
    if (!this.useChromaDB || !this.collection) {
      console.log('⚠️  ChromaDB not available, skipping migration');
      return;
    }

    console.log('🔄 Starting migration to ChromaDB...');
    let migratedDocs = 0;
    let totalChunks = 0;

    for (const [docId, doc] of this.documents) {
      try {
        const chunks = this.chunkDocument(doc.content);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkId = `${docId}_chunk_${i}`;
          
          await this.collection.add({
            ids: [chunkId],
            documents: [chunks[i]],
            metadatas: [{
              doc_id: docId,
              title: doc.title,
              level: doc.level,
              category: doc.category || 'general',
              tags: JSON.stringify(doc.tags || []),
              source: doc.source,
              chunk_index: i,
              total_chunks: chunks.length,
              created_at: doc.created,
              japanese_density: this.calculateJapaneseDensity(chunks[i])
            }]
          });
          
          totalChunks++;
        }
        
        migratedDocs++;
        
        if (migratedDocs % 10 === 0) {
          console.log(`   Migrated ${migratedDocs} documents (${totalChunks} chunks)...`);
        }
      } catch (error) {
        console.error(`Error migrating document ${docId}:`, error);
      }
    }

    await this.updateMigrationStatus({
      completed: true,
      lastMigration: new Date().toISOString(),
      documentsCount: migratedDocs,
      chunksCount: totalChunks
    });

    this.stats.totalDocuments = migratedDocs;
    this.stats.totalChunks = totalChunks;

    console.log(`✅ Migration complete: ${migratedDocs} documents, ${totalChunks} chunks`);
  }

  /**
   * Intelligent document chunking
   */
  chunkDocument(content) {
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (!trimmedParagraph) continue;

      // If adding this paragraph exceeds max size, save current chunk
      if (currentChunk.length + trimmedParagraph.length > this.maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmedParagraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
      }
    }

    // Add remaining chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Handle case where content is smaller than chunk size
    if (chunks.length === 0) {
      chunks.push(content.trim());
    }

    return chunks;
  }

  /**
   * Calculate Japanese character density (for metadata)
   */
  calculateJapaneseDensity(text) {
    const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
    const totalChars = text.length;
    return totalChars > 0 ? (japaneseChars / totalChars) : 0;
  }

  /**
   * Search relevant content (main search method)
   */
  async searchRelevantContent(query, level = 'beginner', maxResults = 3) {
    const startTime = Date.now();
    
    try {
      // Don't try to initialize during request - just return empty if not ready
      if (!this.isInitialized) {
        console.warn('⚠️  RAG service not initialized yet, returning empty results');
        return [];
      }

      let results;
      
      if (this.useChromaDB && this.collection) {
        results = await this.chromaSearch(query, level, maxResults);
      } else {
        results = await this.legacySearch(query, level, maxResults);
      }

      const searchTime = Date.now() - startTime;
      this.updateSearchStats(searchTime);

      return results;
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to empty results instead of retry
      return [];
    }
  }

  /**
   * ChromaDB semantic search
   */
  async chromaSearch(query, level, maxResults) {
    try {
      // Build metadata filter
      const whereFilter = this.buildLevelFilter(level);

      // Query ChromaDB
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: maxResults * 3, // Get more results for filtering
        where: whereFilter
      });

      // Process and format results
      return this.formatChromaResults(results, maxResults);
    } catch (error) {
      console.error('ChromaDB search error:', error);
      throw error;
    }
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

    const allowedLevels = levelHierarchy[level] || ['beginner'];

    return {
      level: { $in: allowedLevels }
    };
  }

  /**
   * Format ChromaDB results
   */
  formatChromaResults(results, maxResults) {
    const formatted = [];
    
    if (!results || !results.ids || results.ids.length === 0) {
      return formatted;
    }

    const ids = results.ids[0];
    const documents = results.documents[0];
    const metadatas = results.metadatas[0];
    const distances = results.distances[0];

    for (let i = 0; i < ids.length && formatted.length < maxResults; i++) {
      const metadata = metadatas[i];
      
      formatted.push({
        content: documents[i],
        source: metadata.source,
        title: metadata.title,
        level: metadata.level,
        category: metadata.category,
        score: 1 - (distances[i] || 0), // Convert distance to similarity
        chunk_index: metadata.chunk_index,
        total_chunks: metadata.total_chunks
      });
    }

    return formatted;
  }

  /**
   * Legacy keyword-based search (fallback)
   */
  async legacySearch(query, level, maxResults) {
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const results = [];

    for (const [docId, doc] of this.documents) {
      // Level filtering
      if (level === 'beginner' && doc.level === 'advanced') continue;
      if (level === 'elementary' && doc.level === 'advanced') continue;

      const docKeywords = [
        ...doc.tags,
        ...this.extractKeywords(doc.content.toLowerCase()),
        ...this.extractKeywords(doc.title.toLowerCase())
      ];

      let score = 0;

      // Keyword matching
      for (const queryWord of queryKeywords) {
        for (const docWord of docKeywords) {
          if (docWord.includes(queryWord) || queryWord.includes(docWord)) {
            score += queryWord.length > 2 ? 2 : 1;
          }
        }
      }

      // Title boost
      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
      }

      if (score > 0) {
        results.push({
          ...doc,
          score,
          content: this.extractRelevantSections(doc.content, queryKeywords)
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => ({
        content: result.content || result.content.substring(0, 500),
        source: result.source,
        title: result.title,
        level: result.level,
        category: result.category,
        score: result.score
      }));
  }

  /**
   * Advanced search with options
   */
  async advancedSearch(query, level = 'beginner', options = {}) {
    const {
      maxResults = 5,
      categories = null,
      minScore = 0.3,
      includeMetadata = true
    } = options;

    const results = await this.searchRelevantContent(query, level, maxResults * 2);

    let filtered = results;

    // Category filtering
    if (categories && categories.length > 0) {
      filtered = filtered.filter(r => categories.includes(r.category));
    }

    // Score filtering
    filtered = filtered.filter(r => r.score >= minScore);

    // Limit results
    filtered = filtered.slice(0, maxResults);

    return filtered;
  }

  /**
   * Add new document
   */
  async addDocument(title, content, metadata = {}) {
    const docId = this.generateDocId(title + Date.now());
    
    const doc = {
      id: docId,
      title,
      content,
      level: metadata.level || 'general',
      tags: metadata.tags || this.extractKeywords(content),
      category: metadata.category || 'general',
      source: metadata.source || 'User Added',
      created: new Date().toISOString()
    };

    // Add to local map
    this.documents.set(docId, doc);

    // Add to ChromaDB if available
    if (this.useChromaDB && this.collection) {
      try {
        const chunks = this.chunkDocument(content);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkId = `${docId}_chunk_${i}`;
          
          await this.collection.add({
            ids: [chunkId],
            documents: [chunks[i]],
            metadatas: [{
              doc_id: docId,
              title: title,
              level: doc.level,
              category: doc.category,
              tags: JSON.stringify(doc.tags),
              source: doc.source,
              chunk_index: i,
              total_chunks: chunks.length,
              created_at: doc.created,
              japanese_density: this.calculateJapaneseDensity(chunks[i])
            }],
            //embeddingFunction: this.embeddingFunction
          });
        }
        
        console.log(`✅ Added document "${title}" to ChromaDB (${chunks.length} chunks)`);
      } catch (error) {
        console.error('Error adding to ChromaDB:', error);
        throw error;
      }
    }

    return docId;
  }

  /**
   * Extract keywords
   */
  extractKeywords(text) {
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g;
    const englishWords = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const japaneseChars = text.match(japaneseRegex) || [];
    
    return [...englishWords, ...japaneseChars].slice(0, 50);
  }

  /**
   * Extract relevant sections from content
   */
  extractRelevantSections(content, keywords) {
    const paragraphs = content.split('\n\n');
    const scoredParagraphs = [];

    for (const paragraph of paragraphs) {
      let score = 0;
      const lowerParagraph = paragraph.toLowerCase();
      
      for (const keyword of keywords) {
        if (lowerParagraph.includes(keyword.toLowerCase())) {
          score += keyword.length > 2 ? 2 : 1;
        }
      }

      if (score > 0) {
        scoredParagraphs.push({ paragraph, score });
      }
    }

    return scoredParagraphs
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(p => p.paragraph)
      .join('\n\n') || content.substring(0, 300);
  }

  /**
   * Get embedding dimension based on model name
   */
  getEmbeddingDimension(modelName) {
    // Known embedding dimensions for common models
    const dimensions = {
      'Xenova/paraphrase-multilingual-mpnet-base-v2': 768,
      'Xenova/multilingual-e5-base': 768,
      'Xenova/multilingual-e5-large': 1024,
      'Xenova/multilingual-e5-small': 384,
      'all-MiniLM-L6-v2': 384,
      'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 384,
      'cl-tohoku/bert-base-japanese-v3': 768,
      'intfloat/multilingual-e5-base': 768
    };

    return dimensions[modelName] || 768; // Default to 768 for unknown models
  }

  /**
   * Generate document ID
   */
  generateDocId(title) {
    return crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
  }

  /**
   * Update search statistics
   */
  updateSearchStats(searchTime) {
    this.stats.totalSearches++;
    this.stats.avgSearchTime = 
      ((this.stats.avgSearchTime * (this.stats.totalSearches - 1)) + searchTime) / this.stats.totalSearches;
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats() {
    if (this.useChromaDB && this.collection) {
      try {
        const count = await this.collection.count();
        return {
          mode: 'chromadb',
          total_chunks: count,
          collection_name: this.collectionName,
          embedding_model: this.embeddingModel
        };
      } catch (error) {
        console.error('Error getting ChromaDB stats:', error);
      }
    }

    return {
      mode: 'legacy',
      total_documents: this.documents.size
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      mode: this.useChromaDB ? 'chromadb' : 'legacy',
      status: this.isInitialized ? 'ready' : 'not initialized',
      total_documents: this.documents.size,
      total_chunks: this.stats.totalChunks,
      total_searches: this.stats.totalSearches,
      avg_search_time: Math.round(this.stats.avgSearchTime),
      last_initialized: this.stats.lastInitialized,
      chroma_url: this.chromaUrl,
      collection_name: this.collectionName
    };
  }
}

module.exports = EnhancedRAGService;