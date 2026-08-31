const EnhancedRAGService = require('./enhancedRAGService');

console.log('🧪 Testing Enhanced RAG Service with search...');

async function testRAGService() {
  try {
    const ragService = new EnhancedRAGService();
    
    console.log('🔄 Initializing service...');
    await ragService.initialize();
    console.log('✅ Service initialized successfully');
    
    // Test search functionality
    console.log('🔍 Testing search functionality...');
    const results = await ragService.searchRelevantContent('Japanese particles wa ga', 'beginner', 3);
    console.log('🔍 Search results:', results.length, 'items found');
    
    results.forEach((result, i) => {
      console.log(`Result ${i+1}: ${result.title} (score: ${result.score})`);
    });
    
    // Test service stats
    console.log('📊 Service stats:', ragService.getStats());
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testRAGService();