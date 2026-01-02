const jwt = require('jsonwebtoken');
const redisService = require('../services/RedisService');
const AuthService = require('../services/AuthService');

const authService = new AuthService();

/**
 * Authentication middleware - verifies JWT token and checks Redis
 */
async function authenticate(req, res, next) {
  try {
    // Extract access token from cookie
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No access token provided'
      });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid access token'
      });
    }

    // Verify token exists in Redis
    const storedToken = await redisService.get(`token:access:${decoded.userId}`);
    if (!storedToken || storedToken !== accessToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked or is invalid'
      });
    }

    // Get user from Redis
    const user = await redisService.hgetall(`user:${decoded.userId}`);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication - doesn't require authentication but attaches user if available
 */
async function optionalAuth(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const storedToken = await redisService.get(`token:access:${decoded.userId}`);

        if (storedToken && storedToken === accessToken) {
          const user = await redisService.hgetall(`user:${decoded.userId}`);
          if (user) {
            req.user = user;
            req.userId = decoded.userId;
          }
        }
      } catch (error) {
        // Token invalid, but we don't block the request
        console.log('Optional auth: token invalid, continuing without user');
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next(); // Continue without user on error
  }
}

/**
 * Auto-refresh access token middleware
 * Refreshes access token if it's close to expiring
 */
async function refreshAccessToken(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken || !refreshToken) {
      return next();
    }

    try {
      // Check if access token is expired
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      
      // Check if token expires in less than 2 minutes
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;

      if (timeUntilExpiry < 120) { // Less than 2 minutes
        console.log('Access token expiring soon, refreshing...');
        
        // Verify refresh token
        const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Get user
        const user = await redisService.hgetall(`user:${refreshDecoded.userId}`);
        if (!user) {
          return next();
        }

        // Generate new tokens
        const newTokens = await authService.refreshTokens(refreshDecoded.userId, {
          userId: user.id,
          email: user.email
        });

        // Set new cookies
        const accessTTL = authService.parseExpiryToSeconds(authService.accessTokenExpiry);
        const refreshTTL = authService.parseExpiryToSeconds(authService.refreshTokenExpiry);

        res.cookie('accessToken', newTokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: accessTTL * 1000,
          domain: process.env.COOKIE_DOMAIN || undefined
        });

        res.cookie('refreshToken', newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: refreshTTL * 1000,
          domain: process.env.COOKIE_DOMAIN || undefined
        });

        res.cookie('csrfToken', newTokens.csrfToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: refreshTTL * 1000,
          domain: process.env.COOKIE_DOMAIN || undefined
        });

        console.log('✅ Tokens refreshed successfully');
      }
    } catch (error) {
      if (error.name !== 'TokenExpiredError') {
        console.log('Auto-refresh failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Auto-refresh middleware error:', error);
    next();
  }
}

/**
 * Check if user has specific role (for future role-based access)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  refreshAccessToken,
  requireRole
};
