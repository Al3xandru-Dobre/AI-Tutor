const fs = require('fs').promises;
const path = require('path');

/**
 * Clean up existing data for fresh authentication start
 * Deletes all existing conversations, notebooks, and vocabulary
 */

async function cleanup() {
  console.log('\n🧹 Starting data cleanup for authentication system...\n');

  try {
    // Define data directories
    const baseDataDir = path.join(__dirname, '../data');
    const conversationsDir = path.join(baseDataDir, 'history');
    const notebooksDir = path.join(baseDataDir, 'notebooks');
    const vocabularyDir = path.join(baseDataDir, 'vocabulary');

    // Cleanup conversations
    console.log('📁 Cleaning conversations...');
    const conversationFiles = await fs.readdir(conversationsDir);
    let deletedConversations = 0;
    
    for (const file of conversationFiles) {
      const filePath = path.join(conversationsDir, file);
      await fs.unlink(filePath);
      console.log(`   ✓ Deleted: ${file}`);
      deletedConversations++;
    }
    
    console.log(`   ✅ Deleted ${deletedConversations} conversation files\n`);

    // Cleanup notebooks
    console.log('📁 Cleaning notebooks...');
    const notebookFiles = await fs.readdir(notebooksDir);
    let deletedNotebooks = 0;
    
    for (const file of notebookFiles) {
      const filePath = path.join(notebooksDir, file);
      await fs.unlink(filePath);
      console.log(`   ✓ Deleted: ${file}`);
      deletedNotebooks++;
    }
    
    console.log(`   ✅ Deleted ${deletedNotebooks} notebook files\n`);

    // Cleanup vocabulary
    console.log('📁 Cleaning vocabulary...');
    const vocabularyFiles = await fs.readdir(vocabularyDir);
    let deletedVocabulary = 0;
    
    for (const file of vocabularyFiles) {
      const filePath = path.join(vocabularyDir, file);
      await fs.unlink(filePath);
      console.log(`   ✓ Deleted: ${file}`);
      deletedVocabulary++;
    }
    
    console.log(`   ✅ Deleted ${deletedVocabulary} vocabulary files\n`);

    // Create fresh files structure
    console.log('📝 Creating fresh data structure...');
    
    // Create empty conversations file
    await fs.writeFile(
      path.join(conversationsDir, '.gitkeep'),
      '',
      'utf-8'
    );
    console.log('   ✓ Created: conversations/.gitkeep');

    // Create empty notebooks file
    await fs.writeFile(
      path.join(notebooksDir, '.gitkeep'),
      '',
      'utf-8'
    );
    console.log('   ✓ Created: notebooks/.gitkeep');

    // Create empty vocabulary file
    await fs.writeFile(
      path.join(vocabularyDir, '.gitkeep'),
      '',
      'utf-8'
    );
    console.log('   ✓ Created: vocabulary/.gitkeep\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║  ✅ CLEANUP COMPLETE!                                          ║');
    console.log('║                                                              ║');
    console.log('║  All existing data has been deleted.                             ║');
    console.log('║  Ready for fresh authentication system test.                      ║');
    console.log('║                                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   Conversations deleted: ${deletedConversations}`);
    console.log(`   Notebooks deleted:     ${deletedNotebooks}`);
    console.log(`   Vocabulary deleted:    ${deletedVocabulary}\n`);

    console.log('🚀 Next steps:');
    console.log('   1. Start Redis server (if not running)');
    console.log('   2. Configure environment variables (.env)');
    console.log('   3. Start the application: npm start');
    console.log('   4. Register a new account');
    console.log('   5. Verify email (if email service configured)');
    console.log('   6. Login and test the system\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanup();
