const { generateUUID, hashEmail, hashPassword, comparePassword } = require('../utils/hashing');
const redisService = require('../services/RedisService');

class UserRedis {
  /**
   * Create a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name
   * @returns {Promise<Object>} Created user
   */
  async createUser(email, password, name) {
    try {
      // Check if user already exists
      const emailHash = hashEmail(email);
      const existingUserId = await redisService.get(`email:${emailHash}`);
      if (existingUserId) {
        throw new Error('Email already registered');
      }

      // Generate user ID
      const userId = generateUUID();

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user object
      const user = {
        id: userId,
        email: email,
        emailHash: emailHash,
        passwordHash: passwordHash,
        name: name,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        role: 'user',
        settings: {
          theme: 'dark',
          jlptLevel: 'N5',
          language: 'en',
          notificationsEnabled: true
        }
      };

      // Save user to Redis (hash)
      await redisService.hset(`user:${userId}`, 'id', user.id);
      await redisService.hset(`user:${userId}`, 'email', user.email);
      await redisService.hset(`user:${userId}`, 'emailHash', user.emailHash);
      await redisService.hset(`user:${userId}`, 'passwordHash', user.passwordHash);
      await redisService.hset(`user:${userId}`, 'name', user.name);
      await redisService.hset(`user:${userId}`, 'emailVerified', user.emailVerified);
      await redisService.hset(`user:${userId}`, 'createdAt', user.createdAt);
      await redisService.hset(`user:${userId}`, 'lastLoginAt', user.lastLoginAt);
      await redisService.hset(`user:${userId}`, 'role', user.role);
      await redisService.hset(`user:${userId}`, 'settings', JSON.stringify(user.settings));

      // Save email to user ID mapping
      await redisService.set(`email:${emailHash}`, userId);

      console.log(`✅ User created: ${email} (${userId})`);
      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email hash
   * @param {string} emailHash - Hashed email
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByEmailHash(emailHash) {
    try {
      // Get user ID from email hash
      const userId = await redisService.get(`email:${emailHash}`);
      if (!userId) {
        return null;
      }

      // Get user from Redis
      return await this.findUserById(userId);
    } catch (error) {
      console.error('❌ Error finding user by email hash:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserById(userId) {
    try {
      const user = await redisService.hgetall(`user:${userId}`);
      
      if (!user || !user.id) {
        return null;
      }

      // Parse settings JSON
      if (user.settings && typeof user.settings === 'string') {
        user.settings = JSON.parse(user.settings);
      }

      return user;
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Verify user password
   * @param {string} emailHash - Hashed email
   * @param {string} password - Password to verify
   * @returns {Promise<Object|null>} User object if password matches, null otherwise
   */
  async verifyPassword(emailHash, password) {
    try {
      const user = await this.findUserByEmailHash(emailHash);
      
      if (!user) {
        return null;
      }

      const match = await comparePassword(password, user.passwordHash);
      
      if (!match) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Verify user email
   * @param {string} emailHash - Hashed email
   * @returns {Promise<boolean>} Success status
   */
  async verifyUserEmail(emailHash) {
    try {
      const user = await this.findUserByEmailHash(emailHash);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Update emailVerified flag
      await redisService.hset(`user:${user.id}`, 'emailVerified', true);
      
      console.log(`✅ User email verified: ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error verifying user email:', error);
      throw error;
    }
  }

  /**
   * Set password reset token
   * @param {string} emailHash - Hashed email
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} Success status
   */
  async setPasswordResetToken(emailHash, token) {
    try {
      const user = await this.findUserByEmailHash(emailHash);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Store password reset token (10 minutes TTL)
      await redisService.set(`reset:${emailHash}`, token, 600);
      
      console.log(`✅ Password reset token set for: ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error setting password reset token:', error);
      throw error;
    }
  }

  /**
   * Verify password reset token
   * @param {string} emailHash - Hashed email
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} Success status
   */
  async verifyPasswordResetToken(emailHash, token) {
    try {
      const storedToken = await redisService.get(`reset:${emailHash}`);
      
      if (!storedToken) {
        return false;
      }

      if (storedToken !== token) {
        return false;
      }

      // Delete token after verification
      await redisService.del(`reset:${emailHash}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error verifying password reset token:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {string} emailHash - Hashed email
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async updatePassword(emailHash, newPassword) {
    try {
      const user = await this.findUserByEmailHash(emailHash);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password in Redis
      await redisService.hset(`user:${user.id}`, 'passwordHash', newPasswordHash);
      
      console.log(`✅ Password updated for: ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating password:', error);
      throw error;
    }
  }

  /**
   * Update user last login time
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async updateLastLogin(userId) {
    try {
      const lastLoginAt = new Date().toISOString();
      await redisService.hset(`user:${userId}`, 'lastLoginAt', lastLoginAt);
      
      return true;
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updates) {
    try {
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields
      const allowedFields = ['name', 'settings'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          // Stringify settings if it's an object
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
          await redisService.hset(`user:${userId}`, key, stringValue);
        }
      }

      // Return updated user
      return await this.findUserById(userId);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    try {
      const user = await this.findUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user hash
      await redisService.hdelall(`user:${userId}`);

      // Delete email mapping
      await redisService.del(`email:${user.emailHash}`);

      console.log(`✅ User deleted: ${user.email} (${userId})`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user count
   * @returns {Promise<number>} Number of users
   */
  async getUserCount() {
    try {
      const keys = await redisService.keys('user:*');
      return keys.length;
    } catch (error) {
      console.error('❌ Error getting user count:', error);
      throw error;
    }
  }

  /**
   * Get all users (for admin purposes)
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers() {
    try {
      const keys = await redisService.keys('user:*');
      const users = [];

      for (const key of keys) {
        const userId = key.replace('user:', '');
        const user = await this.findUserById(userId);
        if (user) {
          // Remove sensitive data
          const { passwordHash, emailHash, ...safeUser } = user;
          users.push(safeUser);
        }
      }

      return users;
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      throw error;
    }
  }
}

// Singleton instance
const userRedis = new UserRedis();

module.exports = userRedis;
