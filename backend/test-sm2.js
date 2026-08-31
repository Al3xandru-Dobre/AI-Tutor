// test-sm2.js - Quick test for SM-2 Algorithm implementation
const VocabularyService = require('./services/vocabService');

async function testSM2() {
    console.log('🧪 Testing SM-2 Algorithm Implementation\n');

    const vocabService = new VocabularyService();
    await vocabService.initialize();

    // Test 1: Add vocabulary with new fields
    console.log('📝 Test 1: Adding vocabulary with SM-2 and AI fields');
    const vocab = await vocabService.addVocabulary({
        japanese: '勉強',
        romaji: 'benkyou',
        english: 'study',
        level: 'N5',
        type: 'noun',
        extractedBy: 'manual',
        confidence: 1.0
    });

    console.log('   ✅ Vocabulary added:');
    console.log(`      - ID: ${vocab.id}`);
    console.log(`      - Japanese: ${vocab.japanese}`);
    console.log(`      - Ease Factor: ${vocab.easeFactor}`);
    console.log(`      - Interval: ${vocab.interval}`);
    console.log(`      - Next Review: ${vocab.nextReviewDate}`);
    console.log(`      - Lapses: ${vocab.lapses}`);
    console.log(`      - Extracted By: ${vocab.extractedBy}`);
    console.log(`      - Confidence: ${vocab.confidence}\n`);

    // Test 2: First review with good score (5 - perfect)
    console.log('📝 Test 2: First review with score 5 (perfect)');
    const review1 = await vocabService.updateMastery(vocab.id, 5);
    console.log('   ✅ After first review:');
    console.log(`      - Interval: ${review1.interval} days`);
    console.log(`      - Ease Factor: ${review1.easeFactor}`);
    console.log(`      - Next Review: ${review1.nextReviewDate}`);
    console.log(`      - Lapses: ${review1.lapses}\n`);

    // Test 3: Second review with good score (4 - hesitation)
    console.log('📝 Test 3: Second review with score 4 (hesitation)');
    const review2 = await vocabService.updateMastery(vocab.id, 4);
    console.log('   ✅ After second review:');
    console.log(`      - Interval: ${review2.interval} days`);
    console.log(`      - Ease Factor: ${review2.easeFactor.toFixed(2)}`);
    console.log(`      - Next Review: ${review2.nextReviewDate}`);
    console.log(`      - Lapses: ${review2.lapses}\n`);

    // Test 4: Failed review (score 2 - incorrect)
    console.log('📝 Test 4: Failed review with score 2 (incorrect)');
    const review3 = await vocabService.updateMastery(vocab.id, 2);
    console.log('   ✅ After failed review:');
    console.log(`      - Interval: ${review3.interval} days (should reset to 1)`);
    console.log(`      - Ease Factor: ${review3.easeFactor.toFixed(2)} (should stay same)`);
    console.log(`      - Next Review: ${review3.nextReviewDate}`);
    console.log(`      - Lapses: ${review3.lapses} (should increment)\n`);

    // Test 5: Add AI-extracted vocabulary
    console.log('📝 Test 5: Adding AI-extracted vocabulary');
    const aiVocab = await vocabService.addVocabulary({
        japanese: '文法',
        romaji: 'bunpou',
        english: 'grammar',
        level: 'N4',
        type: 'noun',
        extractedBy: 'ai',
        confidence: 0.92,
        conversationId: 'conv-123'
    });
    console.log('   ✅ AI-extracted vocabulary added:');
    console.log(`      - Japanese: ${aiVocab.japanese}`);
    console.log(`      - Extracted By: ${aiVocab.extractedBy}`);
    console.log(`      - Confidence: ${aiVocab.confidence}`);
    console.log(`      - Conversation ID: ${aiVocab.conversationId}\n`);

    // Test 6: Get due for review
    console.log('📝 Test 6: Getting cards due for review');
    const dueCards = await vocabService.getDueForReview({
        maxNewCards: 20,
        maxReviews: 100,
        includeLeeches: true
    });
    console.log(`   ✅ Found ${dueCards.length} cards due for review\n`);

    // Test 7: Get statistics
    console.log('📝 Test 7: Getting vocabulary statistics');
    const stats = await vocabService.getVocabularyStats();
    console.log('   ✅ Statistics:');
    console.log(`      - Total: ${stats.total}`);
    console.log(`      - New Cards: ${stats.newCards}`);
    console.log(`      - Learning: ${stats.learning}`);
    console.log(`      - Mature: ${stats.mature}`);
    console.log(`      - Average Ease Factor: ${stats.averageEaseFactor}`);
    console.log(`      - Average Interval: ${stats.averageInterval} days`);
    console.log(`      - Total Lapses: ${stats.totalLapses}`);
    console.log(`      - Leech Count: ${stats.leechCount}`);
    console.log(`      - Retention Rate: ${stats.retentionRate}`);
    console.log('      - By Source:');
    console.log(`        * Manual: ${stats.bySource.manual}`);
    console.log(`        * AI: ${stats.bySource.ai}`);
    console.log(`        * Hybrid: ${stats.bySource.hybrid}`);
    console.log(`      - Average Confidence: ${stats.averageConfidence}\n`);

    // Test 8: Get vocabulary by source
    console.log('📝 Test 8: Getting AI-extracted vocabulary');
    const aiVocabs = await vocabService.getVocabularyBySource('ai');
    console.log(`   ✅ Found ${aiVocabs.length} AI-extracted vocabulary entries\n`);

    console.log('✅ All tests completed successfully!');
}

// Run tests
testSM2().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
