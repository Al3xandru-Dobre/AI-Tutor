const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateRandomToken, generateUUID } = require('../utils/hashing');
const redisService = require('./RedisService');

class AuthService {
  constructor() {
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRATION || '10m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRATION || '24h';
    this.verificationTokenTTL = 600; // 10 minutes in seconds
    this.passwordResetTokenTTL = 600; // 10 minutes in seconds
  }

  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: this.accessTokenExpiry
      });
    } catch (error) {
      throw new Error('Error generating access token: ' + error.message);
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Token payload
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: this.refreshTokenExpiry
      });
    } catch (error) {
      throw new Error('Error generating refresh token: ' + error.message);
    }
  }

  /**
   * Generate CSRF token
   * @returns {string} CSRF token
   */
  generateCsrfToken() {
    return generateRandomToken(32);
  }

  /**
   * Generate verification token
   * @returns {string} Verification token
   */
  generateVerificationToken() {
    return generateRandomToken(32);
  }

  /**
   * Generate password reset token
   * @returns {string} Password reset token
   */
  generatePasswordResetToken() {
    return generateRandomToken(32);
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Object} Decoded token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Error verifying access token: ' + error.message);
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Error verifying refresh token: ' + error.message);
    }
  }

  /**
   * Save tokens to Redis
   * @param {string} userId - User ID
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {string} csrfToken - CSRF token
   * @returns {Promise<boolean>} Success status
   */
  async saveTokens(userId, accessToken, refreshToken, csrfToken) {
    try {
      // Calculate TTL in seconds
      const accessTTL = this.parseExpiryToSeconds(this.accessTokenExpiry);
      const refreshTTL = this.parseExpiryToSeconds(this.refreshTokenExpiry);

      // Save access token
      await redisService.set(`token:access:${userId}`, accessToken, accessTTL);

      // Save refresh token
      await redisService.set(`token:refresh:${userId}`, refreshToken, refreshTTL);

      // Save CSRF token
      await redisService.set(`token:csrf:${userId}`, csrfToken, refreshTTL);

      console.log(`✅ Tokens saved for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving tokens to Redis:', error);
      throw new Error('Failed to save tokens');
    }
  }

  /**
   * Verify tokens exist in Redis
   * @param {string} userId - User ID
   * @param {string} accessToken - JWT access token (optional)
   * @param {string} refreshToken - JWT refresh token (optional)
   * @param {string} csrfToken - CSRF token (optional)
   * @returns {Promise<boolean>} Success status
   */
  async verifyTokens(userId, accessToken = null, refreshToken = null, csrfToken = null) {
    try {
      // Check access token if provided
      if (accessToken) {
        const storedAccessToken = await redisService.get(`token:access:${userId}`);
        if (storedAccessToken !== accessToken) {
          console.log('⚠️  Invalid access token for user', userId);
          return false;
        }
      }

      // Check refresh token if provided
      if (refreshToken) {
        const storedRefreshToken = await redisService.get(`token:refresh:${userId}`);
        if (storedRefreshToken !== refreshToken) {
          console.log('⚠️  Invalid refresh token for user', userId);
          return false;
        }
      }

      // Check CSRF token if provided
      if (csrfToken) {
        const storedCsrfToken = await redisService.get(`token:csrf:${userId}`);
        if (storedCsrfToken !== csrfToken) {
          console.log('⚠️  Invalid CSRF token for user', userId);
          return false;
        }
      }

      console.log(`✅ Tokens verified for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error verifying tokens:', error);
      return false;
    }
  }

  /**
   * Revoke all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async revokeTokens(userId) {
    try {
      // Delete all tokens for user
      await redisService.delMultiple(
        `token:access:${userId}`,
        `token:refresh:${userId}`,
        `token:csrf:${userId}`
      );

      console.log(`✅ Tokens revoked for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error revoking tokens:', error);
      throw new Error('Failed to revoke tokens');
    }
  }

  /**
   * Save verification token
   * @param {string} emailHash - Hashed email
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} Success status
   */
  async saveVerificationToken(emailHash, token) {
    try {
      await redisService.set(`token:verify:${emailHash}`, token, this.verificationTokenTTL);
      console.log(`✅ Verification token saved for ${emailHash}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving verification token:', error);
      throw new Error('Failed to save verification token');
    }
  }

  /**
   * Verify and consume verification token
   * @param {string} emailHash - Hashed email
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} Success status
   */
  async verifyAndConsumeVerificationToken(emailHash, token) {
    try {
      const storedToken = await redisService.get(`token:verify:${emailHash}`);
      
      if (!storedToken) {
        console.log('⚠️  Verification token expired or not found');
        return false;
      }

      if (storedToken !== token) {
        console.log('⚠️  Invalid verification token');
        return false;
      }

      // Delete token after verification
      await redisService.del(`token:verify:${emailHash}`);
      
      console.log(`✅ Verification token verified and consumed for ${emailHash}`);
      return true;
    } catch (error) {
      console.error('❌ Error verifying verification token:', error);
      return false;
    }
  }

  /**
   * Save password reset token
   * @param {string} emailHash - Hashed email
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} Success status
   */
  async savePasswordResetToken(emailHash, token) {
    try {
      await redisService.set(`token:reset:${emailHash}`, token, this.passwordResetTokenTTL);
      console.log(`✅ Password reset token saved for ${emailHash}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving password reset token:', error);
      throw new Error('Failed to save password reset token');
    }
  }

  /**
   * Verify and consume password reset token
   * @param {string} emailHash - Hashed email
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} Success status
   */
  async verifyAndConsumePasswordResetToken(emailHash, token) {
    try {
      const storedToken = await redisService.get(`token:reset:${emailHash}`);
      
      if (!storedToken) {
        console.log('⚠️  Password reset token expired or not found');
        return false;
      }

      if (storedToken !== token) {
        console.log('⚠️  Invalid password reset token');
        return false;
      }

      // Delete token after verification
      await redisService.del(`token:reset:${emailHash}`);
      
      console.log(`✅ Password reset token verified and consumed for ${emailHash}`);
      return true;
    } catch (error) {
      console.error('❌ Error verifying password reset token:', error);
      return false;
    }
  }

  /**
   * Parse expiry time to seconds
   * @param {string} expiry - Expiry time (e.g., '10m', '24h', '7d')
   * @returns {number} TTL in seconds
   */
  parseExpiryToSeconds(expiry) {
    const value = parseInt(expiry);
    const unit = expiry.slice(-1);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 600; // Default: 10 minutes
    }
  }

  /**
   * Get CSRF token for user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} CSRF token
   */
  async getCsrfToken(userId) {
    try {
      const csrfToken = await redisService.get(`token:csrf:${userId}`);
      return csrfToken;
    } catch (error) {
      console.error('❌ Error getting CSRF token:', error);
      return null;
    }
  }

  /**
   * Refresh tokens for user
   * @param {string} userId - User ID
   * @param {Object} userPayload - User payload for tokens
   * @returns {Promise<Object>} New tokens
   */
  async refreshTokens(userId, userPayload) {
    try {
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(userPayload);
      const newRefreshToken = this.generateRefreshToken(userPayload);
      const newCsrfToken = this.generateCsrfToken();

      // Save new tokens (revoke old ones)
      await this.saveTokens(userId, newAccessToken, newRefreshToken, newCsrfToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        csrfToken: newCsrfToken
      };
    } catch (error) {
      console.error('❌ Error refreshing tokens:', error);
      throw new Error('Failed to refresh tokens');
    }
  }
}

module.exports = AuthService;
