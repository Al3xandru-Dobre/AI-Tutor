const crypto = require('crypto');
const redisService = require('../services/RedisService');

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF Protection middleware
 * Validates CSRF token on state-changing requests
 */
async function csrfProtection(req, res, next) {
  try {
    // Allow GET, HEAD, OPTIONS methods (no CSRF check)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Extract CSRF token from cookie
    const cookieCsrfToken = req.cookies?.csrfToken;

    // Extract CSRF token from header or body
    const headerCsrfToken = req.headers['x-csrf-token'];
    const bodyCsrfToken = req.body?._csrf || req.body?.csrfToken;
    const requestCsrfToken = headerCsrfToken || bodyCsrfToken;

    if (!cookieCsrfToken) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF token not found'
      });
    }

    if (!requestCsrfToken) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'CSRF token is required'
      });
    }

    // Use timing-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(cookieCsrfToken, 'hex'),
      Buffer.from(requestCsrfToken, 'hex')
    )) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid CSRF token'
      });
    }

    next();
  } catch (error) {
    console.error('CSRF protection middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'CSRF validation failed'
    });
  }
}

/**
 * Generate and set CSRF token cookie
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {string} userId - User ID (optional, for Redis storage)
 */
async function setCsrfCookie(req, res, userId = null) {
  try {
    const csrfToken = generateCsrfToken();

    // Set CSRF token cookie
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // Must be accessible by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    // Also store in Redis if userId is provided
    if (userId) {
      await redisService.set(`token:csrf:${userId}`, csrfToken, 86400); // 24 hours
    }

    return csrfToken;
  } catch (error) {
    console.error('Error setting CSRF cookie:', error);
    throw new Error('Failed to set CSRF token');
  }
}

/**
 * Get CSRF token endpoint middleware
 */
async function getCsrfToken(req, res) {
  try {
    // Generate new CSRF token
    const csrfToken = generateCsrfToken();

    // If user is authenticated, store token in Redis
    if (req.userId) {
      await redisService.set(`token:csrf:${req.userId}`, csrfToken, 86400);
    }

    // Set CSRF token cookie
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.json({
      csrfToken: csrfToken
    });
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate CSRF token'
    });
  }
}

module.exports = {
  csrfProtection,
  setCsrfCookie,
  getCsrfToken
};
