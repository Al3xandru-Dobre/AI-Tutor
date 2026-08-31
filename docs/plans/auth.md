*Design plan for the authentication and user-account system (Redis-backed users, JWT cookies, CSRF, email verification). See the status note for what has shipped.*

# Authentication System Plan

## Status

**Implemented** (running code; see [CHANGELOG](../../CHANGELOG.md)):

- Registration, login, logout with email verification required before login
- JWT access (10 min) + refresh (24 h) tokens in httpOnly cookies; `/api/auth/refresh` rotation
- CSRF token endpoint and header check on state-changing requests
- Password reset (forgot/reset via emailed token) via nodemailer + Scaleway SMTP
- Redis-backed user model (`backend/models/UserRedis.js`), token storage, and rate limiting (login/register/email)
- Hashing/encryption utilities (`backend/utils/hashing.js`, `encryption.js`; bcrypt + HMAC SHA-256)
- Auth middleware in `backend/middlewear/`; per-user isolation of conversations, notebooks, vocabulary
- Frontend pages: login, register, forgot-password, reset-password, verify-email, profile, settings

**Not yet done / open per this plan:**

- Automated end-to-end and security test suites (the `npm test` script is still a placeholder)
- Production deployment hardening from Phase 5 (SSL certificates, DNS, monitoring, backups)
- Spot-check items from the Phase 4 checklists (cookie attributes under HTTPS, concurrent-session behavior)

Everything below is the original design, kept for reference.

## Key Decisions

| Decision | Value | Reason |
|----------|-------|--------|
| Access token expiry | 10 minutes | Security/UX balance |
| Refresh token expiry | 24 hours | Avoid frequent logouts |
| Email verification | Required | Security-first |
| Email provider | Scaleway SMTP (nodemailer) | Cost-effective, reliable |
| Token storage | Redis with TTL | Fast, auto-expiring |
| User data storage | JSON files, encrypted, per-user | Local-first, isolated |
| Login before verification | Blocked | Security-first |

## Architecture

Redis keys:

```text
user:{userId}                    # id, emailHash, passwordHash, name, emailVerified, timestamps
email:{emailHash} -> userId      # lookup index
token:access:{userId}            # TTL 10m
token:refresh:{userId}           # TTL 24h
token:verify:{emailHash}         # TTL 10m
token:reset:{emailHash}          # TTL 10m
ratelimit:login:{ip}             # TTL 15m
ratelimit:register:{ip}          # TTL 1h
ratelimit:email:{email}          # TTL 1h
```

Hashing strategy — separate keys for email and password hashing:

```javascript
const emailHash = crypto.createHmac('sha256', process.env.EMAIL_HASH_KEY)
  .update(email.toLowerCase()).digest('hex');

const passwordHash = await bcrypt.hash(
  crypto.createHmac('sha256', process.env.PASSWORD_HASH_KEY).update(password).digest('hex'),
  10
);
```

Cookies: `accessToken` and `refreshToken` are `httpOnly`, `sameSite: strict`, `secure` in production; `csrfToken` is JS-readable so the frontend can echo it in a header.

## API Endpoints

**Public:** `POST /api/auth/register` (sends verification email), `POST /api/auth/login` (sets access/refresh/CSRF cookies), `GET /api/auth/verify/:token`, `POST /api/auth/forgot`, `POST /api/auth/reset/:token`, `GET /api/auth/csrf-token`.

**Authenticated:** `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET/PUT/DELETE /api/users/me`, `GET/PUT /api/users/me/settings`, `GET /api/users/me/stats`.

**User-scoped (ownership checked):** `/api/conversations`, `/api/notebooks`, `/api/vocabulary`, `/api/chat`.

## Phases

1. **Core infrastructure** — Redis service, hashing/encryption utils, EmailService (Scaleway templates), AuthService token generation/verification, auth + CSRF + rate-limit middleware, CORS with credentials, helmet.
2. **Backend core** — `UserRedis` model, auth controller (register/login/logout/refresh/verify/forgot/reset/profile), routes, per-user refactoring of conversation/notebook/vocabulary services, optional data-cleanup script (`backend/scripts/cleanup-existing-data.js`).
3. **Frontend** — API client with `credentials: 'include'` and auto-refresh on 401, auth pages, verify-email/reset-password/profile/settings pages, protected routes, navigation updates.
4. **Integration & testing** — end-to-end flows, security testing (CSRF, rate limits, cookie attributes, data isolation), email delivery, Redis persistence/performance.
5. **Documentation & deployment** — production env, managed Redis, SSL/DNS, monitoring.

## Environment Variables

```env
PORT=3000
FRONTEND_URL=http://localhost:3000
COOKIE_DOMAIN=localhost

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_SECRET=...min-32-chars
REFRESH_TOKEN_SECRET=...min-32-chars
JWT_ACCESS_EXPIRATION=10m
JWT_REFRESH_EXPIRATION=24h

EMAIL_HASH_KEY=...min-32-chars
PASSWORD_HASH_KEY=...min-32-chars
CONVERSATION_SALT_KEY=...min-32-chars
TOKEN_HASH_KEY=...min-32-chars
ENCRYPTION_KEY_DERIVATION_SECRET=...min-32-chars

SMTP_HOST=smtp.scaleway.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=Japanese AI Tutor <noreply@yourdomain.com>
EMAIL_VERIFICATION_URL=http://localhost:3000/verify-email.html
PASSWORD_RESET_URL=http://localhost:3000/reset-password.html

CSRF_SECRET=...min-32-chars
COOKIE_SECRET=...min-32-chars
```

## Setup

`./setup-auth.sh` automates: dependency install, `.env` creation from `.env.example`, Redis check, optional data cleanup, and secret-default warnings. Manual equivalent:

```bash
npm install
cp .env.example .env        # then fill secrets and SMTP credentials
redis-cli ping              # Redis must be running: docs/guides/redis.md
npm start
```

Then register at `http://localhost:3000/register.html`, verify via email, and log in. Full backend layout: [Architecture](../architecture.md).
