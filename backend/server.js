// server.js - Complete Integration with ChromaDB Enhanced RAG

// ========================================
// CRITICAL: Configure transformers FIRST
// Must be imported before ANY other modules
// ========================================
require('./config/transformers.config');

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

// ========================================
// CENTRALIZED INITIALIZATION
// ========================================
const { initializeAllServices, getServices, ensureServicesInitialized } = require('./middlewear/initialise');
const redisService = require('./services/RedisService');
const emailService = require('./services/EmailService');

// ========================================
// CENTRALIZED ROUTES
// ========================================
const apiRoutes = require('./routes/index');


const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration (with credentials for cookies)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // ESSENTIAL for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ========================================
// INITIALIZE SERVICES ON STARTUP
// ========================================
(async () => {
  try {
    // Initialize Redis first
    console.log('\n🔧 Initializing Redis...');
    await redisService.initialize();
    const redisHealth = await redisService.healthCheck();
    console.log(`   ${redisHealth.status === 'healthy' ? '✅' : '❌'} Redis: ${redisHealth.message}\n`);

    // Initialize Email Service
    console.log('🔧 Initializing Email Service...');
    await emailService.initialize();
    console.log(`   ${emailService.isEmailConfigured() ? '✅' : '⚠️ '} Email Service: ${emailService.isEmailConfigured() ? 'Configured' : 'Not configured (email verification disabled)'}\n`);

    // Initialize all other services (RAG, Ollama, etc.)
    await initializeAllServices();

    // NOW start the server
    startServer();
  } catch (error) {
    console.error('❌ Fatal: Server initialization failed:', error);
    process.exit(1);
  }
})();


// ========================================
// SERVICE READINESS MIDDLEWARE
// ========================================
app.use('/api', (req, res, next) => {
  // Skip health check endpoints
  if (req.path.includes('/health')) {
    return next();
  }
  
  try {
    ensureServicesInitialized(req, res, next);
  } catch (error) {
    return res.status(503).json({
      error: 'Services not fully initialized',
      message: 'Please try again in a moment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


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
    console.log('║     🚀 Japanese Tutor v4.0 - Authentication Enabled     ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('📍 Server Information:');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

    console.log('🔗 Key Endpoints:');
    console.log(`   📖 Frontend:        http://localhost:${PORT}`);
    console.log(`   🔐 Auth:           http://localhost:${PORT}/api/auth/*`);
    console.log(`   👤 User:           http://localhost:${PORT}/api/users/*`);
    console.log(`   🔧 API Test:        http://localhost:${PORT}/api/test`);
    console.log(`   ❤️  Health Check:    http://localhost:${PORT}/api/health`);
    console.log(`   🔍 ChromaDB Health: http://localhost:${PORT}/api/chromadb/health`);
    console.log(`   💾 ChromaDB Stats:  http://localhost:${PORT}/api/rag/chroma-stats`);

    console.log('\n🔒 Authentication Configuration:');
    console.log(`   Redis:              ${redisService.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   Email Service:      ${emailService.isEmailConfigured() ? '✅ Configured (Scaleway)' : '⚠️  Not configured'}`);
    console.log(`   Access Token TTL:   ${process.env.JWT_ACCESS_EXPIRATION || '10m'}`);
    console.log(`   Refresh Token TTL:  ${process.env.JWT_REFRESH_EXPIRATION || '24h'}`);
    console.log(`   CSRF Protection:    ✅ Enabled`);
    console.log(`   Rate Limiting:      ✅ Enabled (Redis-based)\n`);

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
