const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.fromAddress = process.env.EMAIL_FROM || 'Japanese AI Tutor <noreply@localhost>';
  }

  async initialize() {
    try {
      // Check if email provider is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  Email Service: SMTP credentials not configured');
        this.isConfigured = false;
        return false;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email Service Configured (Scaleway SMTP)');
      this.isConfigured = true;
      
      return true;
    } catch (error) {
      console.error('❌ Email Service Initialization Failed:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Send verification email
   * @param {string} email - User email
   * @param {string} token - Verification token
   * @param {string} name - User name
   * @returns {Promise<boolean>} Success status
   */
  async sendVerificationEmail(email, token, name) {
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️  Email Service: Cannot send email - not configured');
      return false;
    }

    try {
      const verificationUrl = `${process.env.EMAIL_VERIFICATION_URL || 'http://localhost:3000/verify-email.html'}?token=${token}`;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: 'Verify Your Email Address - Japanese AI Tutor',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #c1272d 0%, #d94d52 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                padding: 40px 30px;
              }
              .content p {
                color: #333;
                line-height: 1.6;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                padding: 15px 40px;
                background: linear-gradient(135deg, #c1272d 0%, #d94d52 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .button:hover {
                opacity: 0.9;
              }
              .footer {
                background-color: #f5f5f5;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
              .footer a {
                color: #c1272d;
                text-decoration: none;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🇯🇵 Japanese AI Tutor</h1>
              </div>
              <div class="content">
                <p>Hi ${name || 'there'},</p>
                <p>Thank you for registering with Japanese AI Tutor! We're excited to help you on your Japanese learning journey.</p>
                <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #c1272d;">${verificationUrl}</p>
                <div class="warning">
                  <strong>⚠️ Important:</strong> This verification link will expire in 10 minutes for security reasons.
                </div>
                <p>If you didn't create an account with Japanese AI Tutor, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Japanese AI Tutor. All rights reserved.</p>
                <p>
                  <a href="${frontendUrl}">Visit our website</a> | 
                  <a href="${frontendUrl}/privacy.html">Privacy Policy</a> | 
                  <a href="${frontendUrl}/terms.html">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}:`, info.messageId);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} token - Password reset token
   * @param {string} name - User name
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(email, token, name) {
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️  Email Service: Cannot send email - not configured');
      return false;
    }

    try {
      const resetUrl = `${process.env.PASSWORD_RESET_URL || 'http://localhost:3000/reset-password.html'}?token=${token}`;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: 'Reset Your Password - Japanese AI Tutor',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #c1272d 0%, #d94d52 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                padding: 40px 30px;
              }
              .content p {
                color: #333;
                line-height: 1.6;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                padding: 15px 40px;
                background: linear-gradient(135deg, #c1272d 0%, #d94d52 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .button:hover {
                opacity: 0.9;
              }
              .footer {
                background-color: #f5f5f5;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
              .footer a {
                color: #c1272d;
                text-decoration: none;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
              }
              .alert {
                background-color: #f8d7da;
                border-left: 4px solid #dc3545;
                padding: 15px;
                margin: 20px 0;
                color: #721c24;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🇯🇵 Japanese AI Tutor</h1>
              </div>
              <div class="content">
                <p>Hi ${name || 'there'},</p>
                <p>We received a request to reset your password for your Japanese AI Tutor account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #c1272d;">${resetUrl}</p>
                <div class="warning">
                  <strong>⚠️ Important:</strong> This password reset link will expire in 10 minutes for security reasons.
                </div>
                <div class="alert">
                  <strong>🔒 Security Notice:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
                <p>If you have any questions or need further assistance, please contact our support team.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Japanese AI Tutor. All rights reserved.</p>
                <p>
                  <a href="${frontendUrl}">Visit our website</a> | 
                  <a href="${frontendUrl}/privacy.html">Privacy Policy</a> | 
                  <a href="${frontendUrl}/terms.html">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}:`, info.messageId);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to send password reset email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send welcome email
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<boolean>} Success status
   */
  async sendWelcomeEmail(email, name) {
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️  Email Service: Cannot send email - not configured');
      return false;
    }

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const mailOptions = {
        from: this.fromAddress,
        to: email,
        subject: 'Welcome to Japanese AI Tutor! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Japanese AI Tutor</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #c1272d 0%, #d94d52 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                padding: 40px 30px;
              }
              .content p {
                color: #333;
                line-height: 1.6;
                margin-bottom: 20px;
              }
              .features {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .features h3 {
                margin-top: 0;
                color: #c1272d;
              }
              .features ul {
                margin: 0;
                padding-left: 20px;
              }
              .features li {
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                padding: 15px 40px;
                background: linear-gradient(135deg, #c1272d 0%, #d94d52 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .button:hover {
                opacity: 0.9;
              }
              .footer {
                background-color: #f5f5f5;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
              .footer a {
                color: #c1272d;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to Japanese AI Tutor!</h1>
              </div>
              <div class="content">
                <p>Hi ${name || 'there'},</p>
                <p>Welcome to Japanese AI Tutor! Your account has been successfully verified and you're now ready to start your Japanese learning journey.</p>
                
                <div class="features">
                  <h3>✨ What's Available:</h3>
                  <ul>
                    <li><strong>AI-Powered Conversations:</strong> Practice Japanese with an intelligent tutor</li>
                    <li><strong>RAG System:</strong> Access curated learning materials</li>
                    <li><strong>Notebook:</strong> Keep track of vocabulary and grammar</li>
                    <li><strong>Personalized Learning:</strong> Adapt to your JLPT level</li>
                    <li><strong>Privacy-First:</strong> Your data is encrypted and secure</li>
                  </ul>
                </div>
                
                <p>Ready to start learning? Click the button below:</p>
                <p style="text-align: center;">
                  <a href="${frontendUrl}" class="button">Start Learning</a>
                </p>
                
                <p>If you have any questions or need help, feel free to reach out to our support team.</p>
                <p>Happy learning! 🇯🇵</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Japanese AI Tutor. All rights reserved.</p>
                <p>
                  <a href="${frontendUrl}">Visit our website</a> | 
                  <a href="${frontendUrl}/privacy.html">Privacy Policy</a> | 
                  <a href="${frontendUrl}/terms.html">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}:`, info.messageId);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Check if email service is configured
   * @returns {boolean} Configuration status
   */
  isEmailConfigured() {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Get email service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      fromAddress: this.fromAddress,
      smtpHost: process.env.SMTP_HOST
    };
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
