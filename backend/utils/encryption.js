const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Encrypt data using bcrypt
 * @param {*} data - Data to encrypt (will be stringified)
 * @param {string} salt - Salt to use for encryption
 * @returns {Promise<string>} Encrypted data
 */
async function encryptData(data, salt) {
  if (!data) {
    throw new Error('Data is required');
  }

  if (!salt) {
    throw new Error('Salt is required');
  }

  try {
    // Convert data to string if it's an object
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt using bcrypt (hashing with salt)
    const encryptedData = await bcrypt.hash(stringData, salt);
    
    return encryptedData;
  } catch (error) {
    console.error('Data encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using bcrypt
 * Note: bcrypt is a one-way hash function, so "decryption" is actually verification
 * We use bcrypt.compare() to verify the data
 * @param {string} encryptedData - Encrypted data
 * @param {string} salt - Salt used for encryption
 * @returns {Promise<any>} Decrypted data
 */
async function decryptData(encryptedData, salt) {
  if (!encryptedData) {
    throw new Error('Encrypted data is required');
  }

  if (!salt) {
    throw new Error('Salt is required');
  }

  try {
    // Note: This is a simplified approach
    // In production, consider using a proper encryption library like AES
    // For now, we'll use bcrypt.compare() which will verify if the data matches
    
    // Since bcrypt is one-way, we need a different approach
    // We'll use AES encryption for actual encryption/decryption
    
    throw new Error('Bcrypt is one-way, use AES encryption instead');
  } catch (error) {
    console.error('Data decryption error:', error);
    throw error;
  }
}

/**
 * Encrypt data using AES-256-GCM (proper encryption)
 * @param {*} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {Object} Encrypted data with IV and authTag
 */
function encryptAES(data, key) {
  if (!data) {
    throw new Error('Data is required');
  }

  if (!key) {
    throw new Error('Encryption key is required');
  }

  try {
    // Convert data to string
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    
    // Encrypt
    let encrypted = cipher.update(stringData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('AES encryption error:', error);
    throw new Error('Failed to encrypt data with AES');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} encryptedData - Encrypted data object { encrypted, iv, authTag }
 * @param {string} key - Decryption key
 * @returns {any} Decrypted data
 */
function decryptAES(encryptedData, key) {
  if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
    throw new Error('Invalid encrypted data format');
  }

  if (!key) {
    throw new Error('Decryption key is required');
  }

  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Decrypt
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Try to parse as JSON
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('AES decryption error:', error);
    throw new Error('Failed to decrypt data with AES');
  }
}

/**
 * Generate encryption key
 * @returns {string} 32-byte encryption key (hex)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derive encryption key from user ID and a secret
 * @param {string} userId - User ID
 * @param {string} secret - Secret key
 * @returns {string} Derived encryption key (hex)
 */
function deriveEncryptionKey(userId, secret) {
  const ENCRYPTION_KEY_DERIVATION_SECRET = process.env.ENCRYPTION_KEY_DERIVATION_SECRET || secret;
  
  // Use PBKDF2 to derive key
  const key = crypto.pbkdf2Sync(
    userId,
    ENCRYPTION_KEY_DERIVATION_SECRET,
    100000, // iterations
    32, // key length
    'sha256'
  );
  
  return key.toString('hex');
}

/**
 * Encrypt user data (conversations, notebooks, vocabulary)
 * @param {*} data - Data to encrypt
 * @param {string} userId - User ID (used for key derivation)
 * @returns {Object} Encrypted data package
 */
function encryptUserData(data, userId) {
  try {
    // Derive encryption key from user ID
    const ENCRYPTION_SECRET = process.env.CONVERSATION_SALT_KEY || 'default-encryption-secret';
    const key = deriveEncryptionKey(userId, ENCRYPTION_SECRET);
    
    // Encrypt using AES
    const encrypted = encryptAES(data, key);
    
    return {
      encrypted,
      userId,
      algorithm: 'aes-256-gcm',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('User data encryption error:', error);
    throw new Error('Failed to encrypt user data');
  }
}

/**
 * Decrypt user data
 * @param {Object} encryptedPackage - Encrypted data package
 * @param {string} userId - User ID (must match encryption)
 * @returns {any} Decrypted data
 */
function decryptUserData(encryptedPackage, userId) {
  try {
    if (encryptedPackage.userId !== userId) {
      throw new Error('User ID mismatch');
    }
    
    // Derive encryption key from user ID
    const ENCRYPTION_SECRET = process.env.CONVERSATION_SALT_KEY || 'default-encryption-secret';
    const key = deriveEncryptionKey(userId, ENCRYPTION_SECRET);
    
    // Decrypt using AES
    const decrypted = decryptAES(encryptedPackage.encrypted, key);
    
    return decrypted;
  } catch (error) {
    console.error('User data decryption error:', error);
    throw new Error('Failed to decrypt user data');
  }
}

/**
 * Encrypt conversations for a user
 * @param {Object} conversations - Conversations object
 * @param {string} userId - User ID
 * @returns {Object} Encrypted conversations package
 */
function encryptConversations(conversations, userId) {
  return encryptUserData(conversations, userId);
}

/**
 * Decrypt conversations for a user
 * @param {Object} encryptedPackage - Encrypted conversations package
 * @param {string} userId - User ID
 * @returns {Object} Decrypted conversations
 */
function decryptConversations(encryptedPackage, userId) {
  return decryptUserData(encryptedPackage, userId);
}

/**
 * Encrypt notebook for a user
 * @param {Object} notebook - Notebook data
 * @param {string} userId - User ID
 * @returns {Object} Encrypted notebook package
 */
function encryptNotebook(notebook, userId) {
  return encryptUserData(notebook, userId);
}

/**
 * Decrypt notebook for a user
 * @param {Object} encryptedPackage - Encrypted notebook package
 * @param {string} userId - User ID
 * @returns {Object} Decrypted notebook
 */
function decryptNotebook(encryptedPackage, userId) {
  return decryptUserData(encryptedPackage, userId);
}

/**
 * Encrypt vocabulary for a user
 * @param {Object} vocabulary - Vocabulary data
 * @param {string} userId - User ID
 * @returns {Object} Encrypted vocabulary package
 */
function encryptVocabulary(vocabulary, userId) {
  return encryptUserData(vocabulary, userId);
}

/**
 * Decrypt vocabulary for a user
 * @param {Object} encryptedPackage - Encrypted vocabulary package
 * @param {string} userId - User ID
 * @returns {Object} Decrypted vocabulary
 */
function decryptVocabulary(encryptedPackage, userId) {
  return decryptUserData(encryptedPackage, userId);
}

module.exports = {
  encryptData,
  decryptData,
  encryptAES,
  decryptAES,
  generateEncryptionKey,
  deriveEncryptionKey,
  encryptUserData,
  decryptUserData,
  encryptConversations,
  decryptConversations,
  encryptNotebook,
  decryptNotebook,
  encryptVocabulary,
  decryptVocabulary
};
