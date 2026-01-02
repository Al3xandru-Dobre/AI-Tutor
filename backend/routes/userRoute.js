const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewear/auth');
const { sanitizeInput, validateProfileUpdate } = require('../middlewear/validation');
const userRedis = require('../models/UserRedis');

/**
 * Get current user profile
 * GET /api/users/me
 */
router.get(
  '/me',
  authenticate,
  async (req, res) => {
    try {
      const user = await userRedis.findUserById(req.userId);

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // Remove sensitive data
      const { passwordHash, emailHash, ...safeUser } = user;

      res.json({
        user: safeUser
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user'
      });
    }
  }
);

/**
 * Update current user profile
 * PUT /api/users/me
 */
router.put(
  '/me',
  authenticate,
  sanitizeInput,
  validateProfileUpdate,
  async (req, res) => {
    try {
      const { name, email, settings } = req.body;
      const updates = {};

      if (name !== undefined) {
        updates.name = name;
      }

      // Email update not yet implemented (would require re-verification)
      if (email !== undefined) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email update not yet implemented'
        });
      }

      if (settings !== undefined) {
        updates.settings = settings;
      }

      // Update user
      const updatedUser = await userRedis.updateUser(req.userId, updates);

      // Remove sensitive data
      const { passwordHash, emailHash, ...safeUser } = updatedUser;

      res.json({
        message: 'Profile updated successfully',
        user: safeUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update profile'
      });
    }
  }
);

/**
 * Delete current user account
 * DELETE /api/users/me
 */
router.delete(
  '/me',
  authenticate,
  async (req, res) => {
    try {
      // Delete user from Redis
      await userRedis.deleteUser(req.userId);

      // Clear cookies
      res.clearCookie('accessToken', {
        domain: process.env.COOKIE_DOMAIN || undefined
      });
      res.clearCookie('refreshToken', {
        domain: process.env.COOKIE_DOMAIN || undefined
      });
      res.clearCookie('csrfToken', {
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete account'
      });
    }
  }
);

/**
 * Get user settings
 * GET /api/users/me/settings
 */
router.get(
  '/me/settings',
  authenticate,
  async (req, res) => {
    try {
      const user = await userRedis.findUserById(req.userId);

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      res.json({
        settings: user.settings || {}
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get settings'
      });
    }
  }
);

/**
 * Update user settings
 * PUT /api/users/me/settings
 */
router.put(
  '/me/settings',
  authenticate,
  sanitizeInput,
  async (req, res) => {
    try {
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Settings are required'
        });
      }

      // Update user settings
      const updatedUser = await userRedis.updateUser(req.userId, { settings });

      res.json({
        message: 'Settings updated successfully',
        settings: updatedUser.settings
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update settings'
      });
    }
  }
);

/**
 * Get user statistics
 * GET /api/users/me/stats
 */
router.get(
  '/me/stats',
  authenticate,
  async (req, res) => {
    try {
      // For now, return basic stats
      // Later, this will include conversations, vocabulary, notebook counts
      const user = await userRedis.findUserById(req.userId);

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // TODO: Get actual stats from encrypted data files
      const stats = {
        userId: user.id,
        memberSince: user.createdAt,
        lastLogin: user.lastLoginAt,
        conversationCount: 0,
        notebookCount: 0,
        vocabularyCount: 0,
        jlptLevel: user.settings?.jlptLevel || 'N5'
      };

      res.json({
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get stats'
      });
    }
  }
);

module.exports = router;
