---
name: tutor-dev-guidelines
description: Development and security-hardening guidelines for the Japanese AI Tutor project (Express 4 monolith + Redis + ChromaDB + vanilla JS frontend). Use whenever working on ANY backend code — routes, controllers, services, backend/middlewear — adding or changing API endpoints, touching auth/CSRF/rate limiting, Redis or ChromaDB/RAG/embeddings/LLM providers, frontend API calls in frontend/js/api.js, or doing any security review, hardening, or production-readiness work in this repo. Also use for small fixes and refactors, not just new features.
---

# AI Tutor Development Guidelines

Security-first rules for this repo, distilled from OWASP / Node.js best practices / Redis and Chroma production guidance, and mapped onto the actual codebase. Follow them on every change, however small.

## The 30-second stack map

- **Entry**: `backend/server.js` — middleware order: helmet → cors (`FRONTEND_URL` origin, credentials) → `express.json()`/`urlencoded` → static `frontend/` → service-readiness 503 guard on `/api` → `backend/routes/index.js`.
- **Layering**: `routes/` (mount + middleware) → `controllers/` (HTTP shape only) → `services/` (all logic) → `utils/` (hashing, encryption). New business logic goes in a service, never a controller.
- **`backend/middlewear/`** (yes, misspelled — 5 files import from it; do NOT rename casually): `auth.js`, `csrf.js`, `rateLimiter.js`, `validation.js`, `initialise.js`.
- **Stores**:
  - **Redis** (via `backend/services/RedisService.js` singleton): user directory (`user:{id}` hashes), email lookup (`email:{hash}`), tokens (`token:access|refresh|csrf:{userId}`), rate limits (`ratelimit:*`).
  - **Encrypted JSON files** under `backend/data/` (AES-256-GCM via `backend/utils/encryption.js`): conversations, notebooks, vocabulary — the durable user content.
  - **ChromaDB** server on `:8000` (`CHROMA_DB_URL`), collection `japanese_tutor_knowledge`, accessed from RAG services (`enhancedRAGService.js` etc.). Rebuildable index, not a source of truth.
- **LLMs**: `backend/services/ModelProviderService.js` + `backend/config/modelProviders.js` — Ollama default, cloud providers via `openai` package. All LLM calls are proxied server-side; the browser never talks to providers directly.
- **Frontend**: 11 static HTML pages, no build step. **All** HTTP goes through `frontend/js/api.js` (adds `credentials: 'include'`, `X-CSRF-Token` header, auto-refresh-on-401). Styling tokens live only in `frontend/tokens.css` (Washi & Ink theme).
- **Docs**: `README.md` is the single hub. `docs/architecture.md` (system picture), `docs/guides/` (redis, chromadb, model-providers, deployment), `docs/plans/` (roadmaps). Do not duplicate `docs/history/` (archive).

## Always-apply rules

1. **Validate every input at the boundary.** Add middleware in `backend/middlewear/validation.js` following its existing pattern (check required fields, formats, lengths; return `400 { error, message }`). Whitelist the exact fields you accept from `req.body` — never spread `req.body` into anything. *Why: several routes (chat, notebook, conversations) currently take raw `req.body`; don't add to that debt.*
2. **Never send `error.message` or stack traces to clients.** Return a generic `{ error, message }`; log the detail server-side with `console.error`. *Why: raw messages leak file paths, Redis/Chroma internals — see landmine #5.*
3. **Secrets only via dotenv.** Read `process.env.*`, never hardcode keys, never log them, never echo them into responses or frontend code, and never reproduce `.env` values anywhere. New env vars must be added to `.env.example` with a placeholder.
4. **Auth tokens stay in httpOnly cookies.** The app sets access/refresh JWTs via `res.cookie()` with `httpOnly: true`, `sameSite: 'strict'`, `secure` in production. Never move tokens to `localStorage`, never add cookie-setting code without those flags. Protected routes use the `authenticate` middleware from `middlewear/auth.js`.
5. **State-changing endpoints require CSRF.** The custom double-submit middleware (`middlewear/csrf.js`) applies to POST/PUT/PATCH/DELETE; the frontend side works only if calls go through `api.js` helpers (`post`/`put`/`del`), which attach `X-CSRF-Token`. New frontend code must use those helpers, not raw `fetch`. Caveat: `frontend/js/api.js` is CommonJS (`module.exports`) and currently included by **no page** — when you use it, wire it in as a dual-environment export (`window.API = {...}` plus a guarded `module.exports`) in the pages that need it; don't assume `API.post` already works in the browser.
6. **Rate-limit new public endpoints.** Build limiters with `express-rate-limit` + `CustomRedisStore` from `middlewear/rateLimiter.js` (see the reference file for the recipe). Auth-style endpoints set `skipSuccessfulRequests: true`.
7. **Redis discipline.** Use the `RedisService` singleton (never your own client), colon-namespaced keys that extend the existing schema (`user:`, `token:`, `email:`, `ratelimit:`), and a TTL on anything transient.
8. **ChromaDB discipline.** Never delete/recreate a collection outside an env-guarded dev path; the same embedding model must be used for writing and querying; the index is rebuildable — source files under `backend/data/` are the truth.
9. **CORS stays strict.** One origin from `FRONTEND_URL`, `credentials: true`. Never `origin: '*'` alongside credentials.
10. **This is NOT a git repo.** Never delete files — move superseded docs to `docs/history/` (that's the established archive convention) and be explicit in the final report about what you replaced.

## Known landmines (verified 2026-08-31 — check before building on top)

These are known, unfixed issues. Don't replicate their patterns; don't be surprised by them; fixing them is a separate task the user prioritizes.

1. ~~**`cookie-parser` is not installed or registered**~~ **FIXED 2026-08-31**: `cookie-parser@^1.4.7` is installed and registered in `server.js` (after `express.json()`), so `req.cookies` works in auth/csrf/authController. (Same session also added the long-missing `jsonwebtoken` dependency — it was required by `AuthService.js`/`middlewear/auth.js` but absent from package.json, which crashed every startup — and replaced `apiLimiter`'s raw-IP keyGenerator fallback with the express-rate-limit v8 `ipKeyGenerator` helper.)
2. **Chroma collection wiped on every boot**: `backend/services/enhancedRAGService.js:68` calls `deleteAndRecreateCollection()` unconditionally ("only for development purposes", no env guard). All embeddings are lost on restart.
3. **`globalLimiter` and `apiLimiter` are defined in `middlewear/rateLimiter.js` but never mounted** in `server.js` — only the per-auth-route limiters are active.
4. **`csurf` is in `package.json` but unused (and deprecated upstream).** The real CSRF mechanism is the custom `middlewear/csrf.js`. Don't use `csurf`; don't copy its patterns.
5. **`controllers/conversationController.js:13`** returns `res.status(500).json({ error: error.message })` — the exact anti-pattern rule 2 forbids.
6. **Chat, notebook, and conversation routes have no validation middleware** — they read `req.body` directly. Worse, the notebook route family (`backend/routes/notebookRoute.js`) mounts no `authenticate` or CSRF middleware at all, even though its service layer is per-user (encrypted `notebook-{userId}.json` files). Don't copy that mounting pattern into new routes.
7. **CSP is only enabled when `NODE_ENV=production`** (helmet config in `server.js:32-35`). Test with `NODE_ENV=production` before shipping frontend-affecting changes; helmet's default CSP can break pages with inline scripts.
8. **`.env` contains live provider API keys** (Groq/Cerebras/OpenRouter/Google). Treat the file as sensitive; rotation is the user's call. Never print its values.
9. ~~**`CustomRedisStore` used the legacy callback store API**~~ **FIXED 2026-08-31**: the store's promise-based `incr` matched express-rate-limit v8's *legacy* store detection (`incr` without `increment`), so v8 waited on a callback that was never invoked — every rate-limited request hung forever (and the pre-fix null-client snapshot also broke counting). The store now implements the native v8 interface (`increment(key)` returning `{totalHits, resetTime}`, `decrement`, `resetKey`, `init(options)` for `windowMs`, lazy `client` getter, self-healing TTL).

## What to read for which task

Read the matching reference **before** writing code:

| Task involves | Read |
|---|---|
| New/changed API endpoints, auth, error handling, helmet/CSP, validation, rate limiting, deploy hardening | `references/nodejs-express-security.md` |
| RedisService, UserRedis, tokens/sessions, rate-limit store, caching, Redis server config | `references/redis-guidelines.md` |
| ChromaDB, embedding services, RAG pipeline, vector search, notebook semantic search | `references/chroma-vector-guidelines.md` |

Also consult, rather than re-deriving: `docs/architecture.md`, `docs/guides/redis.md`, `docs/guides/chromadb.md`, `docs/guides/model-providers.md`, `CONTRIBUTING.md` (code style: ES6+, 2-space, CommonJS).

## House conventions

- CommonJS everywhere, 2-space indent, `async/await`; emoji `console.log` banners are the established init-log style in services.
- Romanian comments appear in places — fine to keep; write new comments in English.
- Frontend styling: use tokens from `frontend/tokens.css`; do not add competing theme blocks.
- Data split: Redis = operational data (users, tokens, counters); `backend/data/*.json` = durable encrypted user content; Chroma = retrieval index. Respect the split when adding features.
- Testing: no framework yet; smoke-test endpoints with curl per `CONTRIBUTING.md`, and use the visual-QA recipe (static server + `/api` stubs) for frontend work.

## Definition of done — any `/api` change

- [ ] Input validated (middleware or explicit controller checks) before use; only whitelisted fields consumed
- [ ] Errors return generic `{ error, message }`; details only in server logs
- [ ] Public/unauthenticated endpoint has a rate limiter
- [ ] Writes go through `authenticate` + CSRF; frontend calls via `api.js` helpers
- [ ] Redis keys namespaced per schema, TTLs set; no new PII in Redis
- [ ] No secrets in code; new env vars documented in `.env.example`
- [ ] Smoke-tested, including once with `NODE_ENV=production` if headers/CSP/static serving could be affected
