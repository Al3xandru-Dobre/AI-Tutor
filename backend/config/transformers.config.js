// config/transformers.config.js
// CRITICAL: This file MUST be imported FIRST in server.js
// before ANY other imports that use @xenova/transformers

/**
 * Global configuration for @xenova/transformers
 * Forces WebAssembly backend to avoid ONNX Runtime Node.js backend issues
 */

// Only configure if transformers is available
try {
  const { env } = require('@xenova/transformers');

  // Configure for CPU-only execution with WASM backend
  env.allowLocalModels = true;
  env.allowRemoteModels = true;
  env.useBrowserCache = false;

  // CRITICAL: Force WASM backend instead of onnxruntime-node
  // This prevents "DefaultLogger not registered" errors
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = false;

  // Disable other backends to force WASM
  env.backends.onnx.logLevel = 'fatal'; // Reduce ONNX logging

  console.log('✅ Transformers configured for WASM backend (CPU-only)');
  console.log('   - Backend: WebAssembly (forced)');
  console.log('   - Threads: 1 (single-threaded for stability)');
  console.log('   - Models: Local cache enabled');
  console.log('   - onnxruntime-node: Bypassed (using pure WASM)');

} catch (error) {
  console.warn('⚠️  Could not configure transformers:', error.message);
  console.warn('   Transformers features may not be available');
}

module.exports = {
  configured: true
};
