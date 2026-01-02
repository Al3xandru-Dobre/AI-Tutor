# 🔐 Authentication & User System Implementation Plan

## 📋 Overview

Comprehensive authentication and user account system for Japanese AI Tutor with:
- **Redis** - RAM-based storage for users and tokens (with persistence)
- **Scaleway** - Transactional email service
- **SHA-256** - Email and password hashing with separate keys
- **Cookie-based Auth** - All tokens in httpOnly cookies
- **CORS** - Enabled with `credentials: true` on frontend
- **Bcrypt Encryption** - Encrypted conversations, notebooks, vocabulary
- **Clean Start** - All existing data deleted for fresh testing

---

## 🎯 Key Decisions

| Decision | Value | Reason |
|----------|-------|--------|
| **Access Token Expiry** | 10 minutes | Balance security and UX |
| **Refresh Token Expiry** | 24 hours | Prevent frequent logouts |
| **Email Verification** | Required | Security first approach |
| **Email Provider** | Scaleway | Cost-effective, reliable |
| **Token Storage** | Redis (RAM) | Fast access, TTL-based |
| **Conversation Storage** | JSON (encrypted with Bcrypt) | Secure, per-user isolation |
| **Existing Data** | Delete all | Clean start for testing |

---

## 🏗️ Architecture Overview

### Redis Data Structure

```redis
# Users
user:{userId} -> {
  id, 
  emailHash, 
  passwordHash, 
  name, 
  emailVerified,
  createdAt, 
  lastLoginAt
}

# Email lookup (for quick user finding)
email:{emailHash} -> userId

# Tokens (with TTL)
token:access:{userId} -> jwtToken (TTL: 10m)
token:refresh:{userId} -> refreshToken (TTL: 24h)
token:verify:{emailHash} -> verificationToken (TTL: 10m)
token:reset:{emailHash} -> resetToken (TTL: 10m)

# Rate limiting
ratelimit:login:{ip} -> count (TTL: 15m)
ratelimit:register:{ip} -> count (TTL: 1h)
ratelimit:email:{email} -> count (TTL: 1h)
```

### JSON File Structure (Encrypted)

```json
// backend/data/conversations/conversations-{userId}.json
{
  "userId": "uuid",
  "data": "$2b$10$...encrypted_data...",
  "salt": "...",
  "metadata": {
    "conversationCount": 5,
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}

// backend/data/notebooks/notebook-{userId}.json
{
  "userId": "uuid",
  "data": "$2b$10$...encrypted_data...",
  "salt": "..."
}

// backend/data/vocabulary/vocabulary-{userId}.json
{
  "userId": "uuid",
  "data": "$2b$10$...encrypted_data...",
  "salt": "..."
}
```

---

## 🔒 Security Implementation

### Hashing Strategy

```javascript
// Email hashing (separate key)
const EMAIL_HASH_KEY = process.env.EMAIL_HASH_KEY;
const emailHash = crypto.createHmac('sha256', EMAIL_HASH_KEY)
  .update(email.toLowerCase())
  .digest('hex');

// Password hashing (bcrypt + SHA-256 with separate key)
const PASSWORD_HASH_KEY = process.env.PASSWORD_HASH_KEY;
const passwordHash = await bcrypt.hash(
  crypto.createHmac('sha256', PASSWORD_HASH_KEY)
    .update(password)
    .digest('hex'),
  10
);
```

### Encryption Strategy

```javascript
// Conversations encrypted with bcrypt
const CONVERSATION_SALT_KEY = process.env.CONVERSATION_SALT_KEY;
const salt = bcrypt.genSaltSync(10);
const encryptedData = await bcrypt.hash(JSON.stringify(conversations), salt);
```

### Cookie Configuration

```javascript
// Access token - httpOnly, 10 minutes
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 10 * 60 * 1000, // 10 min
  domain: process.env.COOKIE_DOMAIN || undefined
});

// Refresh token - httpOnly, 24 hours
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  domain: process.env.COOKIE_DOMAIN || undefined
});

// CSRF token - regular cookie (readable by JS), 24 hours
res.cookie('csrfToken', csrfToken, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  domain: process.env.COOKIE_DOMAIN || undefined
});
```

---

## 📡 API Endpoints

### Public Routes (No Authentication Required)

```
POST /api/auth/register
  - Register new user
  - Sends verification email
  - Returns: { message: "Check your email to verify" }

POST /api/auth/login
  - Login user
  - Requires verified email
  - Sets cookies (access, refresh, CSRF)
  - Returns: { user: { id, name, email } }

GET /api/auth/verify/:token
  - Verify email address
  - Returns: { message: "Email verified, you can login now" }

POST /api/auth/forgot
  - Request password reset
  - Sends reset email
  - Returns: { message: "Check your email" }

POST /api/auth/reset/:token
  - Reset password with token
  - Returns: { message: "Password reset successful" }

GET /api/auth/csrf-token
  - Get CSRF token for forms
  - Returns: { csrfToken: "..." }
```

### Protected Routes (Authentication Required + CSRF Token)

```
POST /api/auth/refresh
  - Refresh access token
  - Returns: { user: {...} }

POST /api/auth/logout
  - Logout user
  - Deletes cookies
  - Returns: { message: "Logged out successfully" }

GET /api/users/me
  - Get user profile
  - Returns: { user: {...} }

PUT /api/users/me
  - Update user profile
  - Returns: { user: {...} }

DELETE /api/users/me
  - Delete user account
  - Returns: { message: "Account deleted" }

GET /api/users/me/settings
  - Get user settings
  - Returns: { settings: {...} }

PUT /api/users/me/settings
  - Update user settings
  - Returns: { settings: {...} }

GET /api/users/me/stats
  - Get user learning statistics
  - Returns: { stats: {...} }
```

### Existing Routes (Now User-Protected)

```
GET  /api/conversations          - Get user's conversations
POST /api/conversations          - Create new conversation
GET  /api/conversations/:id      - Get specific conversation (ownership check)
PUT  /api/conversations/:id      - Update conversation (ownership check)
DELETE /api/conversations/:id    - Delete conversation (ownership check)

GET  /api/notebooks               - Get user's notebooks
POST /api/notebooks               - Create notebook
GET  /api/notebooks/:id           - Get notebook (ownership check)
PUT  /api/notebooks/:id           - Update notebook (ownership check)
DELETE /api/notebooks/:id         - Delete notebook (ownership check)

GET  /api/vocabulary              - Get user's vocabulary
POST /api/vocabulary              - Add vocabulary word
PUT  /api/vocabulary/:id          - Update vocabulary (ownership check)
DELETE /api/vocabulary/:id        - Delete vocabulary (ownership check)

POST /api/chat                    - Send chat message
POST /api/chat/rag                - RAG-enhanced chat
```

---

## 🛠️ Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Redis Setup
- [ ] Install `redis` and `connect-redis` packages
- [ ] Create `backend/services/RedisService.js`
- [ ] Configure Redis connection with persistence
- [ ] Implement Redis wrapper methods (set, get, del, expire)
- [ ] Add Redis health check
- [ ] Test Redis connection

#### 1.2 Hashing & Encryption
- [ ] Create `backend/utils/hashing.js`
- [ ] Implement `hashEmail(email)` - SHA-256 with EMAIL_HASH_KEY
- [ ] Implement `hashPassword(password)` - bcrypt + SHA-256 with PASSWORD_HASH_KEY
- [ ] Implement `comparePassword(password, hash)`
- [ ] Create `backend/utils/encryption.js`
- [ ] Implement `encryptData(data, salt)` - bcrypt
- [ ] Implement `decryptData(encryptedData, salt)` - bcrypt
- [ ] Test hashing and encryption functions

#### 1.3 Email Service (Scaleway)
- [ ] Install `nodemailer` package
- [ ] Create `backend/services/EmailService.js`
- [ ] Configure Scaleway SMTP
- [ ] Create email templates (HTML):
  - Verification email template
  - Password reset email template
  - Welcome email template (optional)
- [ ] Implement `sendVerificationEmail(email, token, name)`
- [ ] Implement `sendPasswordResetEmail(email, token, name)`
- [ ] Test email sending functionality

#### 1.4 Auth Service Refactor
- [ ] Refactor `backend/services/AuthService.js`
- [ ] Implement `generateAccessToken(payload)` - JWT (10min expiry)
- [ ] Implement `generateRefreshToken(payload)` - JWT (24h expiry)
- [ ] Implement `generateCsrfToken()` - random string
- [ ] Implement `saveTokens(userId, accessToken, refreshToken, csrfToken)` - Redis
- [ ] Implement `verifyTokens(userId, accessToken, refreshToken)` - Redis
- [ ] Implement `revokeTokens(userId)` - Redis delete
- [ ] Implement `generateVerificationToken()` - TTL 10min
- [ ] Implement `generatePasswordResetToken()` - TTL 10min
- [ ] Test all token generation and verification functions

#### 1.5 Middleware
- [ ] Create `backend/middlewear/auth.js`
  - [] Implement `authenticate()` - verify JWT and Redis
  - [ ] Implement `optionalAuth()` - optional auth
  - [ ] Implement `refreshAccessToken()` - auto-refresh logic
- [ ] Implement CSRF protection middleware (custom or csurf)
- [ ] Implement rate limiting middleware:
  - [ ] Login limiter (5 attempts / 15 min)
  - [ ] Register limiter (3 attempts / 1 hour)
  - [ ] Email limiter (3 attempts / 1 hour)
- [ ] Configure CORS with credentials: true
- [ ] Add security headers (helmet.js)
- [ ] Test all middleware

---

### Phase 2: Backend Core (Week 2)

#### 2.1 User Redis Model
- [ ] Create `backend/models/UserRedis.js`
- [ ] Implement `createUser(email, password, name)`
- [ ] Implement `findUserByEmailHash(emailHash)`
- [ ] Implement `findUserById(userId)`
- [ ] Implement `verifyUserEmail(emailHash)`
- [ ] Implement `setPasswordResetToken(emailHash, token)`
- [ ] Implement `updatePassword(emailHash, password)`
- [ ] Implement `updateLastLogin(userId)`
- [ ] Implement `deleteUser(userId)`
- [ ] Implement `getUserCount()`
- [ ] Test all user operations with Redis

#### 2.2 Auth Controller
- [ ] Refactor `backend/controllers/authController.js`
- [ ] Implement `register(req, res)`:
  - Input validation
  - Email and password hashing
  - Check if user exists
  - Create user in Redis
  - Generate verification token
  - Send verification email
  - Return success message
- [ ] Implement `login(req, res)`:
  - Hash email from request
  - Find user in Redis
  - Compare password
  - Check email verified
  - Generate tokens
  - Save tokens in Redis
  - Set cookies
  - Update last login
  - Return user data
- [ ] Implement `logout(req, res)`:
  - Revoke tokens from Redis
  - Delete cookies
  - Return success message
- [ ] Implement `refreshToken(req, res)`:
  - Verify refresh token
  - Generate new tokens
  - Save in Redis
  - Set new cookies
  - Return user data
- [ ] Implement `verifyEmail(req, res)`:
  - Verify token in Redis
  - Update user emailVerified
  - Delete verification token
  - Return success message
- [ ] Implement `forgotPassword(req, res)`:
  - Hash email
  - Check if user exists
  - Generate reset token
  - Save in Redis
  - Send email
  - Return success message
- [ ] Implement `resetPassword(req, res)`:
  - Verify token in Redis
  - Hash new password
  - Update password in Redis
  - Delete reset token
  - Return success message
- [ ] Implement `getProfile(req, res)`
- [ ] Implement `updateProfile(req, res)`
- [ ] Test all auth endpoints with Postman/curl

#### 2.3 Routes
- [ ] Update `backend/routes/authRoute.js`
- [ ] Add all auth routes with proper middleware
- [ ] Create `backend/routes/userRoute.js`
- [ ] Add user management routes
- [ ] Test all routes

#### 2.4 Integration with Existing Services
- [ ] Refactor `ConversationService.js`:
  - Add userId parameter to all methods
  - Implement encryption/decryption
  - Filter conversations by user
  - Add ownership checks
- [ ] Refactor `NotebookService.js`:
  - Similar changes as ConversationService
- [ ] Refactor `VocabularyService.js`:
  - Similar changes as ConversationService
- [ ] Update controllers to use refactored services
- [ ] Test user data isolation

#### 2.5 Cleanup Existing Data
- [ ] Create `backend/scripts/cleanup-existing-data.js`
- [ ] Delete all existing conversations
- [ ] Delete all existing notebooks
- [ ] Delete all existing vocabulary
- [ ] Test clean start
- [ ] Verify user data isolation works

---

### Phase 3: Frontend (Week 3)

#### 3.1 API Client
- [ ] Create `frontend/js/api.js`
- [ ] Implement `apiRequest(url, options)` with:
  - `credentials: 'include'` for cookies
  - CSRF token injection
  - Auto refresh token on 401
  - Error handling
- [ ] Implement `refreshToken()` helper
- [ ] Implement `getCookie(name)` helper
- [ ] Test API client with different endpoints

#### 3.2 Auth API
- [ ] Create `frontend/js/auth.js`
- [ ] Implement `login(email, password)`
- [ ] Implement `register(email, password, name)`
- [ ] Implement `logout()`
- [ ] Implement `getProfile()`
- [ ] Implement `updateProfile(data)`
- [ ] Implement `verifyEmail(token)`
- [ ] Implement `resetPassword(token, newPassword)`
- [ ] Test all auth functions

#### 3.3 Login Page
- [ ] Refactor `frontend/login.html`:
  - Connect to `/api/auth/login`
  - Handle cookies automatically
  - Display errors from server
  - Redirect to chat on success
  - Add "Remember me" option (already in UI)
  - Add "Forgot password" link
- [ ] Test login flow

#### 3.4 Register Page
- [ ] Refactor `frontend/register.html`:
  - Connect to `/api/auth/register`
  - Validate password strength (already in UI)
  - Handle registration success
  - Redirect to login after success
  - Display "Check your email" message
- [ ] Test registration flow

#### 3.5 New Pages
- [ ] Create `frontend/verify-email.html`:
  - Extract token from URL
  - Call `/api/auth/verify/:token`
  - Display success/error message
  - Redirect to login after 3 seconds
- [ ] Create `frontend/reset-password.html`:
  - Extract token from URL
  - Form for new password
  - Validate and confirm password
  - Submit to `/api/auth/reset/:token`
  - Redirect to login on success
- [ ] Create `frontend/profile.html`:
  - Fetch user profile
  - Display user information
  - Display learning stats
  - Update profile form
  - Change password link
  - Delete account button
- [ ] Create `frontend/settings.html`:
  - Fetch user settings
  - Theme toggle (light/dark)
  - JLPT level selector
  - Language selector
  - Privacy settings
- [ ] Test all new pages

#### 3.6 Protected Routes
- [ ] Update `frontend/chat.html`:
  - Check auth on load
  - Redirect to login if not authenticated
  - Save redirect URL
- [ ] Update `frontend/notebook.html`:
  - Similar protection
- [ ] Update other protected pages
- [ ] Test route protection

#### 3.7 Navigation
- [ ] Update navigation menu:
  - Add profile link
  - Add logout button
  - Display user name
- [ ] Test navigation

---

### Phase 4: Integration & Testing (Week 4)

#### 4.1 End-to-End Testing
- [ ] Test full registration flow
- [ ] Test email verification
- [ ] Test login
- [ ] Test logout
- [ ] Test password reset
- [ ] Test profile update
- [ ] Test settings update
- [ ] Test account deletion
- [ ] Test token refresh
- [ ] Test session expiration

#### 4.2 Security Testing
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test unauthorized access attempts
- [ ] Test SQL injection prevention (if applicable)
- [ ] Test XSS prevention
- [ ] Test session hijacking prevention
- [ ] Test cookie security attributes
- [ ] Test encryption/decryption

#### 4.3 CORS & Cookies Testing
- [ ] Test cross-origin requests
- [ ] Test credentials inclusion
- [ ] Test cookie attributes (httpOnly, secure, sameSite)
- [ ] Test CORS preflight
- [ ] Test with different origins

#### 4.4 User Data Isolation Testing
- [ ] Test user A cannot see user B's conversations
- [ ] Test user A cannot modify user B's notebooks
- [ ] Test user A cannot delete user B's vocabulary
- [ ] Test ownership checks on all operations
- [ ] Test encrypted data storage

#### 4.5 Email Testing
- [ ] Test verification email delivery
- [ ] Test password reset email delivery
- [ ] Test email templates rendering
- [ ] Test email links
- [ ] Test email token expiration

#### 4.6 Redis Testing
- [ ] Test Redis connection
- [ ] Test Redis persistence
- [ ] Test Redis TTL
- [ ] Test Redis data recovery
- [ ] Test Redis backup (if implemented)

#### 4.7 Performance Testing
- [ ] Test authentication response times
- [ ] Test encryption/decryption performance
- [ ] Test Redis performance
- [ ] Test rate limiting impact
- [ ] Test concurrent user sessions

#### 4.8 Bug Fixes
- [ ] Fix any bugs found during testing
- [ ] Address edge cases
- [ ] Improve error messages
- [ ] Optimize performance
- [ ] Enhance UX

---

### Phase 5: Documentation & Deployment

#### 5.1 Documentation
- [ ] Update `README.md` with authentication section
- [ ] Document all API endpoints
- [ ] Document environment variables
- [ ] Document Redis setup
- [ ] Document Scaleway email setup
- [ ] Document testing procedures
- [ ] Document deployment steps
- [ ] Create troubleshooting guide

#### 5.2 Deployment Preparation
- [ ] Configure production environment variables
- [ ] Set up Redis cloud instance (or local persistence)
- [ ] Configure Scaleway email account
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up Redis persistence (RDB + AOF)
- [ ] Configure backup strategy for encrypted data
- [ ] Set up monitoring and logging

#### 5.3 Deployment
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Configure DNS
- [ ] Test production deployment
- [ ] Monitor initial traffic
- [ ] Address any production issues

---

## 🔧 Environment Variables

Update `.env.example` with:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
COOKIE_DOMAIN=localhost

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-access-key-change-in-production-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production-min-32-chars
JWT_ACCESS_EXPIRATION=10m
JWT_REFRESH_EXPIRATION=24h

# Hashing Keys (separate keys for security)
EMAIL_HASH_KEY=email-hashing-secret-key-change-in-production-min-32-chars
PASSWORD_HASH_KEY=password-hashing-secret-key-change-in-production-min-32-chars
CONVERSATION_SALT_KEY=conversation-encryption-salt-key-change-in-production-min-32-chars

# Email Configuration (Scaleway)
SMTP_HOST=smtp.scaleway.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user@scaleway.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=Japanese AI Tutor <noreply@yourdomain.com>
EMAIL_VERIFICATION_URL=http://localhost:3000/verify-email.html
PASSWORD_RESET_URL=http://localhost:3000/reset-password.html

# CSRF Configuration
CSRF_SECRET=csrf-secret-key-change-in-production-min-32-chars

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📦 Required Packages

Add to `package.json`:

```json
{
  "dependencies": {
    "redis": "^4.6.0",
    "connect-redis": "^7.1.0",
    "nodemailer": "^6.9.0",
    "csurf": "^1.11.0",
    "express-rate-limit": "^7.1.0",
    "rate-limit-redis": "^4.2.0",
    "helmet": "^7.1.0"
  }
}
```

---

## 🗂️ File Structure

```
AI-Tutor-development/
├── backend/
│   ├── config/
│   │   ├── redis.config.js          # Redis configuration
│   │   └── email.config.js          # Email configuration
│   ├── middlewear/
│   │   ├── auth.js                  # Authentication middleware
│   │   ├── validation.js            # Input validation
│   │   └── rateLimiter.js           # Rate limiting
│   ├── models/
│   │   └── UserRedis.js             # User model (Redis-based)
│   ├── services/
│   │   ├── RedisService.js          # Redis wrapper
│   │   ├── EmailService.js          # Email service (Scaleway)
│   │   └── AuthService.js           # Auth service (refactored)
│   ├── utils/
│   │   ├── hashing.js               # SHA-256 hashing utilities
│   │   └── encryption.js            # Bcrypt encryption utilities
│   ├── controllers/
│   │   ├── authController.js       # Auth endpoints
│   │   └── userController.js       # User management
│   ├── routes/
│   │   ├── authRoute.js            # Auth routes
│   │   └── userRoute.js            # User routes
│   ├── scripts/
│   │   └── cleanup-existing-data.js # Clean existing data
│   └── data/
│       ├── conversations/           # Per-user encrypted conversations
│       ├── notebooks/               # Per-user encrypted notebooks
│       └── vocabulary/             # Per-user encrypted vocabulary
├── frontend/
│   ├── verify-email.html           # Email verification page
│   ├── reset-password.html         # Password reset page
│   ├── profile.html               # User profile page
│   ├── settings.html             # User settings page
│   └── js/
│       ├── api.js                 # API client with cookies
│       └── auth.js                # Auth API functions
└── AUTH_IMPLEMENTATION_PLAN.md   # This file
```

---

## 🎯 Success Criteria

- ✅ Users can register with email verification
- ✅ Users can login with verified email only
- ✅ Sessions managed via secure cookies
- ✅ Automatic token refresh on expiration
- ✅ CSRF protection on all state-changing requests
- ✅ Rate limiting on all auth endpoints
- ✅ User data isolated and encrypted
- ✅ Existing users' conversations/deleted (clean start)
- ✅ All services (conversations, notebooks, vocabulary) separated per user
- ✅ Email delivery via Scaleway working
- ✅ Redis persistence configured
- ✅ CORS properly configured with credentials
- ✅ Frontend uses cookies for authentication
- ✅ Protected routes require authentication
- ✅ User profile and settings pages functional
- ✅ Password reset flow working
- ✅ Account deletion with data cleanup
- ✅ Security best practices followed (helmet, secure cookies, etc.)

---

## 📅 Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| **Week 1** | Core Infrastructure | Redis, Hashing, Email, Auth Service, Middleware |
| **Week 2** | Backend Core | User Model, Auth Controller, Routes, Integration, Cleanup |
| **Week 3** | Frontend | API Client, Auth API, Pages, Route Protection, Navigation |
| **Week 4** | Integration & Testing | E2E Tests, Security Tests, Bug Fixes, Polish |
| **Week 5** | Documentation & Deployment | Docs, Deployment Config, Production Deployment |

---

## ⚠️ Important Notes

1. **Email Verification Blocking**: Login is blocked until email is verified for security
2. **Redis Persistence**: Configure RDB + AOF for data durability
3. **TTL Strategy**: 10min for verification/reset, 24h for refresh token
4. **Encryption**: All user data (conversations, notebooks, vocabulary) encrypted with bcrypt
5. **Clean Start**: All existing data will be deleted for testing
6. **CORS**: Frontend must use `credentials: 'include'`, backend must allow it
7. **HTTPS**: Required in production for secure cookies
8. **Rate Limiting**: Redis-based, consider fallback if Redis is down
9. **CSRF**: Tokens in regular cookie, checked in header on state-changing requests
10. **Cookie Domain**: Set appropriately for production (e.g., `.yourdomain.com`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install redis connect-redis nodemailer csurf express-rate-limit rate-limit-redis helmet
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine redis-server --appendonly yes

# Or local Redis
redis-server --appendonly yes
```

### 4. Configure Scaleway Email
1. Create Scaleway account
2. Create SMTP credentials
3. Update .env with SMTP credentials
4. Test email sending

### 5. Run Cleanup Script
```bash
node backend/scripts/cleanup-existing-data.js
```

### 6. Start Server
```bash
npm run dev
```

### 7. Test Registration
1. Open http://localhost:3000/register.html
2. Register with test email
3. Check email (use Mailtrap or similar for testing)
4. Verify email
5. Login
6. Test all features

---

## 📞 Support

For issues or questions during implementation:
- Check Redis connection: `redis-cli ping`
- Check email logs in console
- Verify environment variables
- Check browser console for errors
- Review Redis data: `redis-cli KEYS "*"`

---

**Last Updated**: 2024-01-01
**Status**: Ready for Implementation 🚀
