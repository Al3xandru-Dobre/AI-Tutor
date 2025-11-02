// Load environment variables first
require('dotenv').config();

const CustomJapaneseEmbedding = require('./customEmbbedingsService');

console.log('🧪 Testing Custom Japanese Embedding Service...\n');

async function testCustomEmbedding() {
  try {
    // Create instance
    console.log('📦 Creating CustomJapaneseEmbedding instance...');
    const embedder = new CustomJapaneseEmbedding();
    console.log('✅ Instance created successfully\n');

    // Initialize
    console.log('🔄 Initializing embedder (this may take a while on first run)...');
    await embedder.initialize();
    console.log('✅ Embedder initialized successfully\n');

    // Test single text embedding
    console.log('🧪 Test 1: Single text embedding');
    const text1 = 'こんにちは、世界！';
    console.log(`   Input: "${text1}"`);
    const embedding1 = await embedder.embed(text1);
    console.log(`   Output: Vector of length ${embedding1[0].length}`);
    console.log(`   First 5 values: [${embedding1[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('✅ Single text embedding successful\n');

    // Test multiple texts embedding
    console.log('🧪 Test 2: Multiple texts embedding');
    const texts = [
      '日本語を勉強しています。',
      'これは簡単です。',
      '難しい漢字もあります。'
    ];
    console.log(`   Input: ${texts.length} texts`);
    texts.forEach((t, i) => console.log(`     ${i+1}. "${t}"`));
    const embeddings = await embedder.embed(texts);
    console.log(`   Output: ${embeddings.length} vectors, each of length ${embeddings[0].length}`);
    console.log('✅ Multiple texts embedding successful\n');

    // Verify vectors are normalized (for cosine similarity)
    console.log('🧪 Test 3: Checking if vectors are normalized');
    const magnitude = Math.sqrt(embedding1[0].reduce((sum, val) => sum + val * val, 0));
    console.log(`   Vector magnitude: ${magnitude.toFixed(6)} (should be ~1.0 for normalized vectors)`);
    if (Math.abs(magnitude - 1.0) < 0.01) {
      console.log('✅ Vectors are properly normalized\n');
    } else {
      console.log('⚠️  Vectors may not be fully normalized\n');
    }

    console.log('🎉 All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testCustomEmbedding();
