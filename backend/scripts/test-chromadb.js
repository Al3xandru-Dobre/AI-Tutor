// backend/scripts/test-chromadb.js
// Test script for ChromaDB integration

const { ChromaClient } = require('chromadb');
const EnhancedRAGService = require('../services/enhancedRAGService');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testChromaDBConnection() {
  log('\n==========================================================', 'cyan');
  log('TEST 1: ChromaDB Connection', 'cyan');
  log('==========================================================', 'cyan');

  try {
    const client = new ChromaClient({
      path: process.env.CHROMA_DB_URL || 'http://localhost:8000'
    });

    const heartbeat = await client.heartbeat();
    log(`✅ Heartbeat: ${heartbeat}`, 'green');

    const version = await client.version();
    log(`✅ Version: ${version}`, 'green');

    return true;
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, 'red');
    log('💡 Make sure ChromaDB is running: docker-compose up -d chromadb', 'yellow');
    return false;
  }
}

async function testRAGServiceInitialization() {
  log('\n==========================================================', 'cyan');
  log('TEST 2: RAG Service Initialization', 'cyan');
  log('==========================================================', 'cyan');

  try {
    const ragService = new EnhancedRAGService({
      chromaPath: process.env.CHROMA_DB_URL || 'http://localhost:8000',
      collectionName: 'japanese_tutor_knowledge',
      useChromaDB: true
    });

    const initialized = await ragService.initialize();

    if (initialized) {
      log('✅ RAG Service initialized successfully', 'green');

      const stats = ragService.getStats();
      log(`📊 Mode: ${stats.mode}`, 'blue');
      log(`📊 Status: ${stats.status}`, 'blue');
      log(`📊 Total documents: ${stats.total_documents}`, 'blue');
      log(`📊 Collection: ${stats.collection_name}`, 'blue');

      return ragService;
    } else {
      log('❌ RAG Service initialization failed', 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function testSemanticSearch(ragService) {
  log('\n==========================================================', 'cyan');
  log('TEST 3: Semantic Search', 'cyan');
  log('==========================================================', 'cyan');

  if (!ragService) {
    log('⚠️  Skipping: RAG Service not available', 'yellow');
    return;
  }

  const testQueries = [
    { query: 'How do I use particles は and が?', level: 'beginner' },
    { query: 'Explain verb conjugation', level: 'elementary' },
    { query: 'What are Japanese honorifics?', level: 'advanced' },
    { query: 'How to count in Japanese', level: 'beginner' }
  ];

  for (const test of testQueries) {
    log(`\n🔍 Query: "${test.query}" (${test.level})`, 'yellow');

    try {
      const startTime = Date.now();
      const results = await ragService.searchRelevantContent(test.query, test.level, 2);
      const duration = Date.now() - startTime;

      if (results.length > 0) {
        log(`✅ Found ${results.length} results in ${duration}ms`, 'green');

        results.forEach((result, idx) => {
          log(`\n  Result ${idx + 1}:`, 'blue');
          log(`  Title: ${result.title}`, 'blue');
          log(`  Score: ${result.score?.toFixed(3)}`, 'blue');
          log(`  Level: ${result.level}`, 'blue');
          log(`  Preview: ${result.content.substring(0, 100)}...`, 'blue');
        });
      } else {
        log('⚠️  No results found', 'yellow');
      }
    } catch (error) {
      log(`❌ Search failed: ${error.message}`, 'red');
    }
  }
}

async function testCollectionStats(ragService) {
  log('\n==========================================================', 'cyan');
  log('TEST 4: Collection Statistics', 'cyan');
  log('==========================================================', 'cyan');

  if (!ragService) {
    log('⚠️  Skipping: RAG Service not available', 'yellow');
    return;
  }

  try {
    const collectionStats = await ragService.getCollectionStats();
    log('📊 Collection Statistics:', 'green');
    log(JSON.stringify(collectionStats, null, 2), 'blue');

    const serviceStats = ragService.getStats();
    log('\n📊 Service Statistics:', 'green');
    log(JSON.stringify(serviceStats, null, 2), 'blue');
  } catch (error) {
    log(`❌ Failed to get stats: ${error.message}`, 'red');
  }
}

async function testCustomEmbeddings() {
  log('\n==========================================================', 'cyan');
  log('TEST 5: Custom Embeddings (Optional)', 'cyan');
  log('==========================================================', 'cyan');

  try {
    const CustomJapaneseEmbedding = require('../services/customEmbbedingsService');
    const modelPath = path.join(__dirname, '../../chromaDB-development_and_AI_stuff/models/japanese_embedder');

    const fs = require('fs');
    if (!fs.existsSync(modelPath)) {
      log('⚠️  Custom model not found. Train it first:', 'yellow');
      log('   cd chromaDB-development_and_AI_stuff', 'yellow');
      log('   python scripts/run_training_pipeline.py', 'yellow');
      return;
    }

    const embedder = new CustomJapaneseEmbedding(modelPath);
    await embedder.initialize();

    const testTexts = ['こんにちは', 'Hello', 'Japanese learning'];
    const embeddings = await embedder.embed(testTexts);

    log('✅ Custom embeddings generated', 'green');
    log(`📊 Embeddings shape: ${embeddings.length} x ${embeddings[0].length}`, 'blue');
  } catch (error) {
    log(`⚠️  Custom embeddings not available: ${error.message}`, 'yellow');
    log('💡 This is optional. The system uses default embeddings.', 'yellow');
  }
}

async function testAddDocument(ragService) {
  log('\n==========================================================', 'cyan');
  log('TEST 6: Add New Document', 'cyan');
  log('==========================================================', 'cyan');

  if (!ragService) {
    log('⚠️  Skipping: RAG Service not available', 'yellow');
    return;
  }

  try {
    const testDoc = {
      title: 'Test Document - Japanese Greetings Extended',
      content: `Advanced Japanese greetings and their cultural context:

お疲れ様です (Otsukaresama desu) - Used to acknowledge someone's hard work
お世話になります (Osewa ni narimasu) - Thank you for your help/support
失礼します (Shitsurei shimasu) - Excuse me (when entering/leaving)

These phrases are essential in business and formal contexts.`,
      level: 'intermediate',
      tags: ['greetings', 'business', 'formal', 'culture'],
      category: 'vocabulary'
    };

    const docId = await ragService.addDocument(
      testDoc.title,
      testDoc.content,
      {
        level: testDoc.level,
        tags: testDoc.tags,
        category: testDoc.category,
        source: 'Test Script'
      }
    );

    log(`✅ Document added with ID: ${docId}`, 'green');

    // Try to search for it
    log('\n🔍 Searching for the new document...', 'yellow');
    const results = await ragService.searchRelevantContent('business greetings', 'intermediate', 3);

    if (results.some(r => r.title.includes('Test Document'))) {
      log('✅ Successfully found the newly added document!', 'green');
    } else {
      log('⚠️  Document added but not found in search', 'yellow');
    }
  } catch (error) {
    log(`❌ Failed to add document: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║      ChromaDB Integration Test Suite                    ║', 'cyan');
  log('║      Japanese AI Tutor                                  ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');

  const connectionOk = await testChromaDBConnection();

  if (!connectionOk) {
    log('\n❌ Cannot proceed without ChromaDB connection', 'red');
    process.exit(1);
  }

  const ragService = await testRAGServiceInitialization();
  await testSemanticSearch(ragService);
  await testCollectionStats(ragService);
  await testAddDocument(ragService);
  await testCustomEmbeddings();

  log('\n==========================================================', 'cyan');
  log('🎉 TEST SUITE COMPLETE!', 'green');
  log('==========================================================', 'cyan');

  if (ragService) {
    log('\n✅ ChromaDB is ready for use!', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Start your backend server', 'yellow');
    log('2. The RAG service will automatically use ChromaDB', 'yellow');
    log('3. Monitor performance with the maintenance script', 'yellow');
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  testChromaDBConnection,
  testRAGServiceInitialization,
  testSemanticSearch,
  testCollectionStats,
  testCustomEmbeddings,
  testAddDocument
};
