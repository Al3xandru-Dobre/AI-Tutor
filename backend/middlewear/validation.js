const { validateEmail, validatePassword, hashEmail } = require('../utils/hashing');
const redisService = require('../services/RedisService');

/**
 * Validate email format and check availability
 */
async function validateEmailInput(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Hash email for Redis lookup
    const emailHash = hashEmail(email);

    // Check if user already exists
    const userId = await redisService.get(`email:${emailHash}`);
    if (userId) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Attach email hash to request for later use
    req.emailHash = emailHash;
    next();
  } catch (error) {
    console.error('Email validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed'
    });
  }
}

/**
 * Validate password complexity
 */
function validatePasswordInput(req, res, next) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required'
      });
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password does not meet requirements',
        errors: validation.errors
      });
    }

    next();
  } catch (error) {
    console.error('Password validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed'
    });
  }
}

/**
 * Validate registration input
 */
async function validateRegistration(req, res, next) {
  try {
    const { email, password, name } = req.body;

    // Check required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'All fields are required (email, password, name)'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Validate email length
    if (email.length > 255) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email is too long (max 255 characters)'
      });
    }

    // Validate name length
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name is required'
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name is too long (max 100 characters)'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Check if email already exists
    const emailHash = hashEmail(email);
    const existingUserId = await redisService.get(`email:${emailHash}`);
    if (existingUserId) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Attach email hash to request
    req.emailHash = emailHash;
    next();
  } catch (error) {
    console.error('Registration validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed'
    });
  }
}

/**
 * Validate login input
 */
function validateLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Hash email for later use
    req.emailHash = hashEmail(email);
    next();
  } catch (error) {
    console.error('Login validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed'
    });
  }
}

/**
 * Validate password reset input
 */
function validatePasswordReset(req, res, next) {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Reset token is required'
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password and confirm password are required'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Passwords do not match'
      });
    }

    next();
  } catch (error) {
    console.error('Password reset validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed'
    });
  }
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(req, res, next) {
  try {
    // Sanitize request body
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          // Remove potentially dangerous characters
          req.body[key] = req.body[key]
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        }
      }
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Input sanitization failed'
    });
  }
}

/**
 * Validate profile update input
 */
function validateProfileUpdate(req, res, next) {
  try {
    const { name, email } = req.body;

    // Name validation (if provided)
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Name cannot be empty'
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Name is too long (max 100 characters)'
        });
      }
    }

    // Email validation (if provided)
    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid email format'
        });
      }

      if (email.length > 255) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email is too long (max 255 characters)'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Profile update validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Validation failed'
    });
  }
}

module.exports = {
  validateEmailInput,
  validatePasswordInput,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  sanitizeInput,
  validateProfileUpdate
};
