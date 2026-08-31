const rateLimit = require('express-rate-limit');
const { keyGeneratorIpFallback, ipKeyGenerator } = rateLimit;
const redisService = require('../services/RedisService');

/**
 * Custom Redis Store implementation for rate limiting
 */
class CustomRedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'ratelimit:';
    this.windowMs = options.windowMs || 60000;
  }

  // Resolve the shared client lazily: RedisService connects after this module
  // is required, so snapshotting it in the constructor captures null.
  get client() {
    return redisService.client;
  }

  // express-rate-limit v8 calls init(options) with the owning limiter's options
  init(options) {
    this.windowMs = options.windowMs;
  }

  // Native v8 store interface. Do NOT rename these back to the legacy callback
  // API (`incr`) — a promise-based `incr` makes v8 wait on a callback that is
  // never invoked, hanging every rate-limited request.
  async increment(key) {
    try {
      const redisKey = `${this.prefix}${key}`;
      const totalHits = await this.client.incr(redisKey);
      let ttl = await this.client.ttl(redisKey);
      if (ttl < 0) {
        // -1 = no expiry (e.g. keys written by the broken store) — (re)apply the window
        const windowSeconds = Math.ceil(this.windowMs / 1000);
        await this.client.expire(redisKey, windowSeconds);
        ttl = windowSeconds;
      }
      const resetTime = new Date(Date.now() + ttl * 1000);
      return { totalHits, resetTime };
    } catch (error) {
      console.error('RedisStore increment error:', error);
      return { totalHits: 1, resetTime: undefined };
    }
  }

  async decrement(key) {
    try {
      await this.client.decr(`${this.prefix}${key}`);
    } catch (error) {
      console.error('RedisStore decrement error:', error);
    }
  }

  async resetKey(key) {
    try {
      await this.client.del(`${this.prefix}${key}`);
    } catch (error) {
      console.error('RedisStore resetKey error:', error);
    }
  }
}

/**
 * Login rate limiter - 5 attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGeneratorIpFallback,
  store: new CustomRedisStore({ prefix: 'ratelimit:login:' }),
  skipSuccessfulRequests: true, // Don't count successful attempts
  skipFailedRequests: false
});

/**
 * Register rate limiter - 3 attempts per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too Many Requests',
    message: 'Too many registration attempts. Please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGeneratorIpFallback,
  store: new CustomRedisStore({ prefix: 'ratelimit:register:' }),
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

/**
 * Email rate limiter - 3 attempts per hour per email
 */
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too Many Requests',
    message: 'Too many email requests. Please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email address as key (from request body)
    const email = req.body?.email || 'unknown';
    return email.toLowerCase().trim();
  },
  store: new CustomRedisStore({ prefix: 'ratelimit:email:' }),
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

/**
 * Password reset rate limiter - 3 attempts per hour per email
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too Many Requests',
    message: 'Too many password reset attempts. Please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email address as key
    const email = req.body?.email || 'unknown';
    return email.toLowerCase().trim();
  },
  store: new CustomRedisStore({ prefix: 'ratelimit:password-reset:' }),
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

/**
 * Global rate limiter - 100 requests per minute per IP
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGeneratorIpFallback,
  store: new CustomRedisStore({ prefix: 'ratelimit:global:' }),
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * API rate limiter - 200 requests per minute per authenticated user
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: {
    error: 'Too Many Requests',
    message: 'API rate limit exceeded. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP (ipKeyGenerator handles IPv6 correctly)
    return req.userId || ipKeyGenerator(req.ip);
  },
  store: new CustomRedisStore({ prefix: 'ratelimit:api:' }),
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Verify email rate limiter - 10 attempts per hour per IP
 */
const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too Many Requests',
    message: 'Too many email verification attempts. Please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGeneratorIpFallback,
  store: new CustomRedisStore({ prefix: 'ratelimit:verify-email:' }),
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

module.exports = {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  passwordResetLimiter,
  globalLimiter,
  apiLimiter,
  verifyEmailLimiter
};
