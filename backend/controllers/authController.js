const userRedis = require('../models/UserRedis');
const AuthService = require('../services/AuthService');
const EmailService = require('../services/EmailService');
const { hashEmail } = require('../utils/hashing');
const redisService = require('../services/RedisService');

const authService = new AuthService();

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    // Create user
    const user = await userRedis.createUser(email, password, name);

    // Generate verification token
    const verificationToken = authService.generateVerificationToken();
    await authService.saveVerificationToken(req.emailHash, verificationToken);

    // Send verification email
    const emailSent = await EmailService.sendVerificationEmail(email, verificationToken, name);

    if (!emailSent) {
      console.warn('⚠️  Email service not configured, verification email not sent');
    }

    res.status(201).json({
      message: 'Registration successful',
      emailSent: emailSent,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      instructions: emailSent
        ? 'Please check your email to verify your account. The verification link will expire in 10 minutes.'
        : 'Email service not configured. In development, you can bypass email verification.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const emailHash = hashEmail(email);

    // Verify password
    const user = await userRedis.verifyPassword(emailHash, password);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Email not verified. Please check your email and verify your account.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Generate tokens
    const accessToken = authService.generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = authService.generateRefreshToken({ userId: user.id, email: user.email });
    const csrfToken = authService.generateCsrfToken();

    // Save tokens to Redis
    await authService.saveTokens(user.id, accessToken, refreshToken, csrfToken);

    // Update last login
    await userRedis.updateLastLogin(user.id);

    // Set cookies
    const accessTTL = authService.parseExpiryToSeconds(authService.accessTokenExpiry);
    const refreshTTL = authService.parseExpiryToSeconds(authService.refreshTokenExpiry);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTTL * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTTL * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTTL * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    console.log(`✅ User logged in: ${email} (${user.id})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        settings: user.settings
      },
      csrfToken: csrfToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
}

/**
 * Logout user
 */
async function logout(req, res) {
  try {
    // Revoke all tokens
    await authService.revokeTokens(req.userId);

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

    console.log(`✅ User logged out: ${req.userId}`);

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
}

/**
 * Refresh access token
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = authService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token'
      });
    }

    // Verify token exists in Redis
    const storedToken = await redisService.get(`token:refresh:${decoded.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token has been revoked'
      });
    }

    // Get user
    const user = await userRedis.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Generate new tokens
    const newAccessToken = authService.generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = authService.generateRefreshToken({ userId: user.id, email: user.email });
    const newCsrfToken = authService.generateCsrfToken();

    // Save new tokens
    await authService.saveTokens(user.id, newAccessToken, newRefreshToken, newCsrfToken);

    // Set new cookies
    const accessTTL = authService.parseExpiryToSeconds(authService.accessTokenExpiry);
    const refreshTTL = authService.parseExpiryToSeconds(authService.refreshTokenExpiry);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTTL * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTTL * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.cookie('csrfToken', newCsrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTTL * 1000,
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    console.log(`✅ Tokens refreshed for user: ${user.id}`);

    res.json({
      message: 'Tokens refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      csrfToken: newCsrfToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
}

/**
 * Verify email
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Verification token is required'
      });
    }

    // Find user by verification token
    const keys = await redisService.keys('token:verify:*');
    let emailHash = null;

    for (const key of keys) {
      const storedToken = await redisService.get(key);
      if (storedToken === token) {
        emailHash = key.replace('token:verify:', '');
        break;
      }
    }

    if (!emailHash) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or expired verification token'
      });
    }

    // Verify and consume token
    const tokenValid = await authService.verifyAndConsumeVerificationToken(emailHash, token);

    if (!tokenValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or expired verification token'
      });
    }

    // Verify user email
    await userRedis.verifyUserEmail(emailHash);

    // Send welcome email (optional)
    const user = await userRedis.findUserByEmailHash(emailHash);
    if (user) {
      await EmailService.sendWelcomeEmail(user.email, user.name);
    }

    res.json({
      message: 'Email verified successfully',
      instructions: 'You can now login to your account.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Email verification failed'
    });
  }
}

/**
 * Request password reset
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const emailHash = hashEmail(email);

    // Check if user exists
    const user = await userRedis.findUserByEmailHash(emailHash);

    if (!user) {
      // Don't reveal if user exists (security)
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate password reset token
    const resetToken = authService.generatePasswordResetToken();
    await authService.savePasswordResetToken(emailHash, resetToken);

    // Send password reset email
    const emailSent = await EmailService.sendPasswordResetEmail(email, resetToken, user.name);

    if (!emailSent) {
      console.warn('⚠️  Email service not configured, password reset email not sent');
    }

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      emailSent: emailSent,
      instructions: emailSent
        ? 'The password reset link will expire in 10 minutes.'
        : 'Email service not configured.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Password reset request failed'
    });
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Reset token is required'
      });
    }

    // Find user by reset token
    const keys = await redisService.keys('reset:*');
    let emailHash = null;

    for (const key of keys) {
      const storedToken = await redisService.get(key);
      if (storedToken === token) {
        emailHash = key.replace('reset:', '');
        break;
      }
    }

    if (!emailHash) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or expired reset token'
      });
    }

    // Verify and consume token
    const tokenValid = await authService.verifyAndConsumePasswordResetToken(emailHash, token);

    if (!tokenValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    await userRedis.updatePassword(emailHash, password);

    res.json({
      message: 'Password reset successful',
      instructions: 'You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Password reset failed'
    });
  }
}

/**
 * Get user profile
 */
async function getProfile(req, res) {
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
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile'
    });
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    const { name, settings } = req.body;
    const updates = {};

    if (name) {
      updates.name = name;
    }

    if (settings) {
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
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
};
