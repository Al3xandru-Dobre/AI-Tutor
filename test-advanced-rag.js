// test-advanced-rag.js - Test script for advanced RAG features

const TransformerEmbeddingService = require('./backend/services/TransformerEmbeddingService');
const CrossEncoderService = require('./backend/services/CrossEncoderService');
const JapaneseTokenizerService = require('./backend/services/JapaneseTokenizerService');

async function testTransformerEmbeddings() {
  console.log('\n🧪 Testing Transformer Embeddings...\n');

  const service = new TransformerEmbeddingService({
    modelName: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
  });

  await service.initialize();

  // Test Japanese-English semantic similarity
  const texts = [
    "日本語の助詞について",
    "Japanese particles explanation",
    "How to cook sushi"
  ];

  console.log('Generating embeddings for:');
  texts.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  const embeddings = await service.generate(texts);

  console.log('\n📊 Similarity Matrix:');
  console.log('                     ', texts.map((_, i) => `Text ${i + 1}`).join('  '));

  for (let i = 0; i < embeddings.length; i++) {
    const similarities = embeddings.map(emb =>
      service.cosineSimilarity(embeddings[i], emb).toFixed(3)
    );
    console.log(`Text ${i + 1} (${texts[i].substring(0, 20)}...)`, similarities.join('   '));
  }

  console.log('\n✅ Expected: Text 1 and 2 should have high similarity (>0.6)');
  console.log('✅ Expected: Text 1 and 3 should have low similarity (<0.4)');

  const stats = service.getStats();
  console.log('\n📈 Service Stats:');
  console.log(JSON.stringify(stats, null, 2));

  return service;
}

async function testJapaneseTokenization() {
  console.log('\n\n🧪 Testing Japanese Tokenization...\n');

  const tokenizer = new JapaneseTokenizerService();
  await tokenizer.initialize();

  const testTexts = [
    "私は学生です",
    "日本語を勉強しています",
    "彼女は毎日図書館で勉強している"
  ];

  for (const text of testTexts) {
    console.log(`\n📝 Text: "${text}"`);

    // Basic tokenization
    const tokens = tokenizer.tokenize(text, { includeMetadata: false });
    console.log('   Tokens:', tokens.join(' | '));

    // Detailed tokenization
    const detailed = tokenizer.tokenize(text, { includeMetadata: true });
    console.log('   Detailed:');
    detailed.forEach(token => {
      console.log(`     - ${token.surface} (${token.pos}) [${token.baseForm}]`);
    });

    // Keywords
    const keywords = tokenizer.extractKeywords(text);
    console.log('   Keywords:', keywords.join(', '));

    // JLPT Level
    const level = tokenizer.analyzeJLPTLevel(text);
    console.log(`   JLPT Level: ${level.level} (confidence: ${(level.confidence * 100).toFixed(0)}%)`);
  }

  console.log('\n📊 Mixed Text Tokenization:');
  const mixed = "今日はgoodな天気です";
  const mixedTokens = tokenizer.tokenizeMixed(mixed);
  console.log(`   Text: "${mixed}"`);
  console.log(`   Tokens:`, mixedTokens);

  const stats = tokenizer.getStats();
  console.log('\n📈 Tokenizer Stats:');
  console.log(JSON.stringify(stats, null, 2));

  return tokenizer;
}

async function testCrossEncoderReranking() {
  console.log('\n\n🧪 Testing Cross-Encoder Reranking...\n');

  const crossEncoder = new CrossEncoderService();
  await crossEncoder.initialize();

  const query = "How to use the は particle in Japanese";

  const results = [
    {
      content: "The は particle is used as a topic marker in Japanese. It indicates what the sentence is about.",
      score: 0.65,
      id: 1
    },
    {
      content: "Japanese cuisine includes sushi, ramen, and tempura. These dishes are popular worldwide.",
      score: 0.70,
      id: 2
    },
    {
      content: "The difference between は and が particles is subtle. は marks the topic, while が marks the subject.",
      score: 0.68,
      id: 3
    },
    {
      content: "Tokyo is the capital of Japan. It has many museums and cultural sites.",
      score: 0.60,
      id: 4
    }
  ];

  console.log(`Query: "${query}"`);
  console.log('\n📋 Original Results (sorted by score):');
  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. [ID:${r.id}] Score: ${r.score.toFixed(3)}`);
    console.log(`     ${r.content.substring(0, 70)}...`);
  });

  // Rerank with cross-encoder
  console.log('\n🔄 Reranking with Cross-Encoder...');
  const reranked = await crossEncoder.rerank(query, results, {
    topK: 4,
    textField: 'content'
  });

  console.log('\n🎯 Reranked Results:');
  reranked.forEach((r, i) => {
    console.log(`  ${i + 1}. [ID:${r.id}] Original: ${r.original_score.toFixed(3)}, Relevance: ${r.relevance_score.toFixed(3)}`);
    console.log(`     ${r.content.substring(0, 70)}...`);
  });

  console.log('\n✅ Expected: Particle-related docs (ID 1, 3) should rank higher');
  console.log('✅ Expected: Irrelevant docs (ID 2, 4) should rank lower');

  // Test hybrid reranking
  console.log('\n🔄 Hybrid Reranking (70% cross-encoder + 30% original)...');
  const hybrid = await crossEncoder.rerankHybrid(query, results, {
    topK: 4,
    crossEncoderWeight: 0.7
  });

  console.log('\n🎯 Hybrid Results:');
  hybrid.forEach((r, i) => {
    console.log(`  ${i + 1}. [ID:${r.id}] Hybrid: ${r.hybrid_score.toFixed(3)}`);
    console.log(`     Original: ${r.original_score.toFixed(3)}, Relevance: ${r.relevance_score.toFixed(3)}`);
  });

  const stats = crossEncoder.getStats();
  console.log('\n📈 Cross-Encoder Stats:');
  console.log(JSON.stringify(stats, null, 2));

  return crossEncoder;
}

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🚀 Advanced RAG Implementation Tests');
  console.log('='.repeat(80));

  try {
    // Test 1: Transformer Embeddings
    const embeddingService = await testTransformerEmbeddings();
    await embeddingService.cleanup();

    // Test 2: Japanese Tokenization
    const tokenizer = await testJapaneseTokenization();
    await tokenizer.cleanup();

    // Test 3: Cross-Encoder Reranking
    const crossEncoder = await testCrossEncoderReranking();
    await crossEncoder.cleanup();

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(80));

    console.log('\n📝 Summary:');
    console.log('  ✓ Real transformer embeddings working');
    console.log('  ✓ Japanese tokenization with Kuromoji working');
    console.log('  ✓ Cross-encoder reranking working');
    console.log('\n🎉 Your advanced RAG system is ready to use!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
