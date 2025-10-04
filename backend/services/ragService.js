const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const pdf = require('pdf-parse');

class RAGService {
  constructor() {
    this.documents = new Map(); // document_id -> {content, metadata}
    this.embeddings = new Map(); // document_id -> simple keyword index
    this.isInitialized = false;
    this.grammarDataPath = path.join(__dirname, '../data/grammar');
  }

  async initialize() {
    try {
      await this.loadGrammarBooks();
      await this.buildSimpleIndex();
      this.isInitialized = true;
      console.log(`RAG Service initialized with ${this.documents.size} documents`);
    } catch (error) {
      console.error('RAG initialization error:', error);
      this.isInitialized = false;
    }
  }

  async loadGrammarBooks() {
    // Create grammar data directory if it doesn't exist
    try {
      await fs.mkdir(this.grammarDataPath, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    // Load sample grammar data (you'll replace this with real books)
    await this.loadSampleGrammarData();
    
    // Try to load any existing grammar files
    try {
      const files = await fs.readdir(this.grammarDataPath);
      for (const file of files) {
        const filePath = path.join(this.grammarDataPath, file);
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          await this.loadTextFile(filePath);
        } else if (file.endsWith('.pdf')) { 
          await this.loadPdfFile(filePath);
        }
      }
    } catch (error) {
      console.log('No additional grammar files found');
    }
  }

  async loadPdfFile(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      const filename = path.basename(filePath, path.extname(filePath));
      const docId = this.generateDocId(filename);
      
      // Folosim metoda addDocument pentru a evita duplicarea codului
      await this.addDocument(filename, data.text, {
        source: filename,
        level: "general" // Poți ajusta acest câmp sau îl poți extrage din metadatele PDF-ului dacă există
      });
      console.log(`Fișierul PDF "${filename}" a fost încărcat și indexat.`);

    } catch (error) {
      console.error(`Eroare la încărcarea fișierului PDF ${filePath}:`, error);
    }
  }


  async loadSampleGrammarData() {
    // Sample Japanese grammar content (you'll expand this)
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
        source: "Advanced Japanese Honorifics"
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
        source: item.source,
        created: new Date().toISOString()
      });
    }
  }

  async loadTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath, path.extname(filePath));
      const docId = this.generateDocId(filename);
      
      this.documents.set(docId, {
        id: docId,
        title: filename,
        content: content,
        level: "general",
        tags: this.extractKeywords(content),
        source: filename,
        created: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
    }
  }

  buildSimpleIndex() {
    // Build a simple keyword-based index (not true vector embeddings)
    for (const [docId, doc] of this.documents) {
      const keywords = new Set([
        ...doc.tags,
        ...this.extractKeywords(doc.content.toLowerCase()),
        ...this.extractKeywords(doc.title.toLowerCase())
      ]);
      
      this.embeddings.set(docId, Array.from(keywords));
    }
  }

  extractKeywords(text) {
    // Simple keyword extraction
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g;
    const englishWords = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const japaneseChars = text.match(japaneseRegex) || [];
    
    return [...englishWords, ...japaneseChars].slice(0, 50); // Limit keywords
  }

  generateDocId(title) {
    return crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
  }

  async searchRelevantContent(query, level = 'beginner', maxResults = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const results = [];

    for (const [docId, doc] of this.documents) {
      // Skip advanced content for beginners
      if (level === 'beginner' && doc.level === 'advanced') continue;
      if (level === 'elementary' && doc.level === 'advanced') continue;

      const docKeywords = this.embeddings.get(docId) || [];
      let score = 0;

      // Simple scoring based on keyword matches
      for (const queryWord of queryKeywords) {
        for (const docWord of docKeywords) {
          if (docWord.includes(queryWord) || queryWord.includes(docWord)) {
            score += queryWord.length > 2 ? 2 : 1;
          }
        }
      }

      // Boost score for exact title matches
      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
      }

      if (score > 0) {
        results.push({
          ...doc,
          score,
          relevantContent: this.extractRelevantSections(doc.content, queryKeywords)
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => ({
        content: result.relevantContent || result.content.substring(0, 500),
        source: result.source,
        title: result.title,
        level: result.level,
        score: result.score
      }));
  }

  extractRelevantSections(content, keywords) {
    // Extract the most relevant paragraphs
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

  async addDocument(title, content, metadata = {}) {
    const docId = this.generateDocId(title + Date.now());
    const doc = {
      id: docId,
      title,
      content,
      level: metadata.level || 'general',
      tags: metadata.tags || this.extractKeywords(content),
      source: metadata.source || 'User Added',
      created: new Date().toISOString()
    };

    this.documents.set(docId, doc);
    this.embeddings.set(docId, this.extractKeywords(content.toLowerCase() + ' ' + title.toLowerCase()));
    
    return docId;
  }

  getStats() {
    return {
      total_documents: this.documents.size,
      by_level: this.groupByLevel(),
      total_keywords: Array.from(this.embeddings.values()).flat().length,
      initialized: this.isInitialized
    };
  }

  groupByLevel() {
    const levels = {};
    for (const doc of this.documents.values()) {
      levels[doc.level] = (levels[doc.level] || 0) + 1;
    }
    return levels;
  }
   async addDocument(title, content, metadata = {}) {
    const docId = this.generateDocId(title + Date.now());
    const doc = {
      id: docId,
      title,
      content,
      level: metadata.level || 'general',
      tags: metadata.tags || this.extractKeywords(content),
      source: metadata.source || 'User Added',
      created: new Date().toISOString()
    };

    this.documents.set(docId, doc);
    
    // Asigură-te că indexul de embeddings este actualizat corect
    const keywords = new Set([
      ...(doc.tags || []),
      ...this.extractKeywords(content.toLowerCase()),
      ...this.extractKeywords(title.toLowerCase())
    ]);
    this.embeddings.set(docId, Array.from(keywords));
    
    return docId;
  }
}

module.exports = RAGService;