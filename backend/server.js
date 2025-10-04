// server.js - Complete Integration with ChromaDB Enhanced RAG
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ========================================
// CENTRALIZED INITIALIZATION
// ========================================
const { initializeAllServices, getServices, ensureServicesInitialized } = require('./middlewear/initialise');

// ========================================
// CENTRALIZED ROUTES
// ========================================
const apiRoutes = require('./routes/index');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ========================================
// INITIALIZE SERVICES ON STARTUP
// ========================================
(async () => {
  try {
    await initializeAllServices();
    
    // NOW start the server
    startServer();
  } catch (error) {
    console.error('❌ Fatal: Server initialization failed:', error);
    process.exit(1);
  }
})();


// ========================================
// MOUNT ALL API ROUTES
// ========================================
app.use('/api', apiRoutes);

// ========================================
// SERVE FRONTEND
// ========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========================================
// START SERVER (Called only after initialization)
// ========================================
function startServer() {
  app.listen(PORT, () => {
    const { rag } = getServices();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║     🚀 Japanese Tutor v3.0 - ChromaDB Enhanced Edition      ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('📍 Server Information:');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

    console.log('🔗 Key Endpoints:');
    console.log(`   📖 Frontend:        http://localhost:${PORT}`);
    console.log(`   🔧 API Test:        http://localhost:${PORT}/api/test`);
    console.log(`   ❤️  Health Check:    http://localhost:${PORT}/api/health`);
    console.log(`   🔍 ChromaDB Health: http://localhost:${PORT}/api/chromadb/health`);
    console.log(`   💾 ChromaDB Stats:  http://localhost:${PORT}/api/rag/chroma-stats`);
    console.log(`   👤 User Profile:    http://localhost:${PORT}/api/rag/user/profile`);
    console.log(`   📊 History Stats:   http://localhost:${PORT}/api/rag/history-rag/stats\n`);

    if (rag.useChromaDB) {
      console.log('🎯 ChromaDB Configuration:');
      console.log(`   Status: ✅ ENABLED`);
      console.log(`   URL: ${rag.chromaUrl}`);
      console.log(`   Collection: ${rag.collectionName}`);
      console.log(`   Embedding Model: ${rag.embeddingModel}`);
    } else {
      console.log('⚠️  ChromaDB: DISABLED');
      console.log('   Using legacy keyword search');
      console.log('   Set USE_CHROMADB=true in .env to enable');
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ SERVER READY! Now accepting requests.                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  });
}

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM signal. Shutting down gracefully...');
  process.exit(0);
});
