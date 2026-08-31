const crypto = require('crypto');
const bycrypt = require('bcrypt');

/**
 * Hash an email using SHA-256 with a separate key
 * @param {string} email - Email to hash
 * @returns {string} SHA-256 hash
 */
function hashEmail(email) {
  const EMAIL_HASH_KEY = process.env.EMAIL_HASH_KEY || 'default-email-hash-key';
  
  if (!email) {
    throw new Error('Email is required');
  }

  return crypto
    .createHmac('sha256', EMAIL_HASH_KEY)
    .update(email.toLowerCase().trim())
    .digest('hex');
}

/**
 * Hash a password using bcrypt + SHA-256 with a separate key
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Bcrypt hash
 */
async function hashPassword(password) {
  const PASSWORD_HASH_KEY = process.env.PASSWORD_HASH_KEY || 'default-password-hash-key';
  
  if (!password) {
    throw new Error('Password is required');
  }

  // First hash with SHA-256 using separate key
  const sha256Hash = crypto
    .createHmac('sha256', PASSWORD_HASH_KEY)
    .update(password)
    .digest('hex');

  // Then hash with bcrypt
  const bcryptHash = await bycrypt.hash(sha256Hash, 10);
  
  return bcryptHash;
}

/**
 * Compare a password with its hash
 * @param {string} password - Password to compare
 * @param {string} hash - Bcrypt hash to compare against
 * @returns {Promise<boolean>} True if password matches
 */
async function comparePassword(password, hash) {
  const PASSWORD_HASH_KEY = process.env.PASSWORD_HASH_KEY || 'default-password-hash-key';
  
  if (!password || !hash) {
    return false;
  }

  try {
    // First hash the password with SHA-256 using the same key
    const sha256Hash = crypto
      .createHmac('sha256', PASSWORD_HASH_KEY)
      .update(password)
      .digest('hex');

    // Then compare with bcrypt
    const match = await bycrypt.compare(sha256Hash, hash);
    
    return match;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} SHA-256 hash
 */
function hashToken(token) {
  const TOKEN_HASH_KEY = process.env.TOKEN_HASH_KEY || 'default-token-hash-key';
  
  if (!token) {
    throw new Error('Token is required');
  }

  return crypto
    .createHmac('sha256', TOKEN_HASH_KEY)
    .update(token)
    .digest('hex');
}

/**
 * Generate a random token
 * @param {number} length - Length of token (default: 32)
 * @returns {string} Random token
 */
function generateRandomToken(length = 32) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validatePassword(password) {
  const errors = [];

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required']
    };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a salt for encryption
 * @param {number} rounds - Bcrypt salt rounds (default: 10)
 * @returns {string} Salt
 */
function generateSalt(rounds = 10) {
  return bycrypt.genSaltSync(rounds);
}

module.exports = {
  hashEmail,
  hashPassword,
  comparePassword,
  hashToken,
  generateRandomToken,
  generateUUID,
  validateEmail,
  validatePassword,
  generateSalt
};
