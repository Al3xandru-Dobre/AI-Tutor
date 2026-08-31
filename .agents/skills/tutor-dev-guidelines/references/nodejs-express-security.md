# Node.js / Express Security Hardening — project-specific recipes

Distilled from the OWASP Node.js Security Cheat Sheet, the Node.js Best Practices list (goldbergyoni), and the Express production security guide — applied to this codebase's patterns. CommonJS, 2-space, `{ error, message }` responses.

## 1. Middleware order (and where new middleware goes)

Current stack in `backend/server.js`: helmet → cors → `express.json()`/`urlencoded` → static → (init) → readiness guard on `/api` → routes.

When adding middleware:

- Request-shaping middleware (body limits, compression) goes **before** routes, right after `express.json()`.
- Route-level guards (`validate*`, limiters, `authenticate`, CSRF) go on the route in `backend/routes/*.js`, in the order **limiter → validate → authenticate → CSRF → controller**. Cheapest checks first; auth before CSRF only if the CSRF check itself needs `req.user`.
- A centralized error handler, if/when added, goes **last**, after all routes (see §3).

## 2. Input validation — extend `backend/middlewear/validation.js`

The project pattern: a middleware per input shape, whitelisting exact fields, returning the standard error envelope. Example for a hypothetical notebook entry:

```js
/**
 * Validate notebook entry input (POST/PUT)
 */
function validateNotebookEntry(req, res, next) {
  try {
    const { word, reading, meaning, tags } = req.body;

    if (!word || typeof word !== 'string' || word.trim().length === 0 || word.length > 200) {
      return res.status(400).json({ error: 'Bad Request', message: 'word is required (string, max 200 chars)' });
    }
    if (meaning && (typeof meaning !== 'string' || meaning.length > 2000)) {
      return res.status(400).json({ error: 'Bad Request', message: 'meaning must be a string, max 2000 chars' });
    }
    if (tags && (!Array.isArray(tags) || tags.length > 20 || tags.some(t => typeof t !== 'string' || t.length > 50))) {
      return res.status(400).json({ error: 'Bad Request', message: 'tags must be an array of strings (max 20, 50 chars each)' });
    }

    // Whitelist: build a clean object; never pass req.body downstream
    req.validatedBody = { word: word.trim(), reading, meaning, tags };
    next();
  } catch (error) {
    console.error('Notebook entry validation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Validation failed' });
  }
}
```

Rules:

- **Whitelist fields** — consume `req.validatedBody` (or destructure explicitly), never `req.body` spread into objects, Redis calls, or Chroma metadata.
- **Check types, not just presence.** `typeof x === 'number' && Number.isFinite(x)`, bound ranges (pagination: `parseInt, default 20, clamp 1–100`), cap array lengths and string sizes. This is the DoS defense for unbounded payloads.
- The existing `sanitizeInput` (HTML-entity escaping) is *output encoding* defense for stored content — keep it on user text that gets rendered, but it does **not** validate shape; don't treat it as your validator.
- IDs from URL params: verify format (e.g., `/^[a-zA-Z0-9_-]{1,64}$/`) before using them in Redis keys or file paths under `backend/data/` — never concatenate unvalidated params into filesystem paths.

## 3. Error handling — never leak internals

The bug to avoid (currently at `controllers/conversationController.js:13`):

```js
// ❌ leaks internals: file paths, Redis/Chroma errors, stack fragments
catch (error) {
  return res.status(500).json({ error: error.message });
}
```

The pattern every new controller uses:

```js
// ✅ generic to the client, detail stays in server logs
catch (error) {
  console.error('notebookController.deleteEntry failed:', error);
  return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete entry' });
}
```

When touching a controller that still leaks `error.message`, fix that line in passing — it's a one-line change consistent with this rule.

Recommended (optional, as an improvement task): one centralized handler at the end of `server.js` plus an `asyncHandler(fn)` wrapper so thrown errors from async controllers reach it:

```js
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// after all routes:
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
});
```

## 4. Rate limiting — the project recipe

Limiters live in `backend/middlewear/rateLimiter.js`, built on `express-rate-limit` v8 + the `CustomRedisStore` class (keys `ratelimit:<scope>:<ip>`). Recipe for a new endpoint group:

```js
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // LLM calls are expensive — count successes too
  message: { error: 'Too Many Requests', message: 'Too many chat requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGeneratorIpFallback,
  store: new CustomRedisStore({ prefix: 'ratelimit:chat:' })
});
```

- Auth-style brute-force targets set `skipSuccessfulRequests: true` (login/register already do).
- Expensive endpoints (chat, document generation, anything hitting a paid LLM API) should count **all** requests and have low `max` — they're a cost/DoS vector, not just auth.
- Behind a reverse proxy, set `app.set('trust proxy', 1)` once in `server.js`, otherwise every client shares the proxy's IP and you'll lock everyone out together.
- Known gap: `globalLimiter`/`apiLimiter` exist but aren't mounted. If asked to harden, mounting them is the intended fix — don't invent a parallel mechanism.

## 5. Helmet / CSP for this frontend

Current: helmet with CSP **off in development**, helmet defaults in production. Because the frontend is same-origin vanilla JS with no external scripts/styles/fonts (LLM + search calls are proxied by the backend), an explicit strict CSP is safe *if pages contain no inline scripts*. Before tightening anything, grep the 11 HTML files for `<script>` without `src` and `style=` attributes; inline code must move to files first.

Safe target config for this app:

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
```

Always verify with `NODE_ENV=production` — dev-mode CSP-off hides breakage until deployment.

## 6. Cookies & auth rules (established — keep, don't fork)

- Access/refresh JWTs: `httpOnly: true`, `sameSite: 'strict'`, `secure: process.env.NODE_ENV === 'production'`, short path lifetimes driven by `JWT_ACCESS_EXPIRATION` (default 10m) / `JWT_REFRESH_EXPIRATION` (default 24h).
- The CSRF token cookie is intentionally **not** httpOnly (frontend must read it into `X-CSRF-Token`); everything else should be.
- Client code never touches tokens — `frontend/js/api.js` handles credentials + refresh. New pages must import its helpers (`get/post/put/del`), not call `fetch` directly.
- Refresh rotation already exists in `AuthService`; don't add parallel token mechanisms.
- CORS: single origin from `FRONTEND_URL`, `credentials: true`. Never `origin: '*'` with credentials — browsers reject it and any workaround is a vulnerability.

## 7. Secrets & dependencies

- All secrets via `.env` (dotenv, loaded first in `server.js`); add every new var to `.env.example` with an empty placeholder. Never log `process.env` objects wholesale.
- `.env` currently holds live provider keys — do not copy, echo, or "clean up" values; rotation is the user's call.
- Run `npm audit` before finishing dependency changes; don't add packages with known advisories when an alternative exists.
- Remove unused deps when touched: `csurf` (deprecated, unused) is the known candidate.
- Node engines say `>=16`; target Node 20+ LTS for anything new (structured `fetch`, better timeouts).

## 8. Body limits & transport DoS

- Express defaults JSON bodies to 100kb — fine for chat/notebook. If an endpoint legitimately needs more (document upload), set an explicit per-route parser: `express.json({ limit: '2mb' })` on that route only, plus validation and a rate limiter. Never raise the global limit.
- The 503 service-readiness guard on `/api` already sheds traffic during startup — keep health endpoints exempt as it does.
- Production should terminate TLS at a reverse proxy (Caddy/nginx) in front of Express; helmet's HSTS then becomes meaningful. There is no TLS today — don't pretend `secure` cookies work over plain HTTP in local dev.

## 9. Logging

Today: `console.log/error/warn` with emoji banners. Acceptable for this project's stage; when formalizing, pick `pino` (low overhead) with redaction for `password`, `token`, `authorization`, `cookie` fields, and keep request logging behind a flag so chat transcripts don't land in logs. Never log: passwords (even hashed), full JWTs, CSRF tokens, API keys, or full user conversation content.

## 10. Docker / deployment (matches OWASP Node.js Docker sheet)

The `Dockerfile` already runs as non-root `nodejs` — preserve that. Additional directions when deploy work happens: pin a specific base image tag (not `latest`), multi-stage build so build tools stay out of the runtime image, add `HEALTHCHECK` hitting `/api/health`, and let docker-compose keep Redis + Chroma on an internal network only (never publish 6379/8000 to the host's public interface).

## Sources

- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP Node.js Docker Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NodeJS_Docker_Cheat_Sheet.html)
- [Node.js Best Practices (goldbergyoni)](https://github.com/goldbergyoni/nodebestpractices)
- [Node.js official security best practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [Express — Production Best Practices: Security](https://expressjs.com/en/advanced/best-practice-security.html)
