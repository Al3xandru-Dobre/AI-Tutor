# Redis Guidelines — how Redis is used in this project

Distilled from the official Redis security/recommended-practices docs and Azure Cache for Redis development best practices, mapped onto this codebase. Redis here is an **operational store** (user directory, tokens, rate limits) running non-containerized on the same host as the app (see `docs/architecture.md`, `docs/guides/redis.md`).

## 1. Client access — always through the singleton

`backend/services/RedisService.js` exports a singleton:

| Method | Behavior |
|---|---|
| `initialize()` | Connects using `REDIS_HOST` (default localhost), `REDIS_PORT` (6379), `REDIS_PASSWORD`, `REDIS_DB` |
| `set(key, value, ttl = null)` | Auto-`JSON.stringify`s non-strings; `setEx` when `ttl` given (seconds) |
| `get(key)` | Auto-parses JSON; returns `null` if missing; **throws** if disconnected |
| `del(key)` | Delete |
| `healthCheck()` | `{ status, message }` used by `/api/health` |
| `disconnect()` | Graceful `quit()` |
| `.client` | Raw node-redis client — only for stores that need it (rate limiter does this) |

Rules:

- Never `redis.createClient()` in feature code — route through `RedisService` (or `backend/models/UserRedis.js` for user CRUD) so connection handling, logging, and error behavior stay in one place.
- `get`/`set` throw when disconnected — wrap call sites in try/catch that degrades gracefully; don't crash request handlers over a cache miss.

## 2. Key schema — extend it, don't invent parallel schemes

| Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `user:{userId}` | hash | none (persistent) | user record (id, email, emailHash, passwordHash, name, role, …) |
| `email:{emailHash}` | string → userId | none | login lookup (emails are HMAC-hashed, not stored in plaintext keys) |
| `token:access:{userId}` / `token:refresh:{userId}` / `token:csrf:{userId}` | string | matches JWT expiry (10m / 24h defaults) | server-side revocation |
| `ratelimit:{scope}:{ip}` | counter / JSON | window length | express-rate-limit store (`CustomRedisStore`) |
| `cache:{domain}:{hash}` *(new, for caching work)* | string | minutes | derived data caches (see §5) |

Naming rules: lowercase, colon namespaces, no spaces or user-controlled raw values in keys (hash/escape user input used in keys — an email goes in as `email:{hmac}`, never raw). New feature keys get a new namespace (`cache:`, `lock:`, …) rather than overloading existing ones.

## 3. TTL discipline

- Anything transient gets a TTL at write time (`set(key, value, ttl)`); "we'll clean it up later" always leaks.
- Token TTLs are env-driven (`JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`) — don't hardcode different values in new code.
- Rate-limit keys inherit the window TTL from `CustomRedisStore`.
- Persistent data (user hashes) has no TTL — that's intentional; don't add TTLs to `user:*`.

## 4. What may live in Redis — and what must not

**Allowed**: user directory fields (as today: bcrypt password hash, HMAC email hash, profile/settings), token identifiers, counters, rate-limit state, caches of *derived, non-sensitive* data.

**Not allowed**:

- Plaintext passwords or password-equivalents (the bcrypt-of-HMAC scheme in `utils/hashing.js` is the only password handling).
- API keys or any secrets from `.env`.
- **Unencrypted user content.** Conversations and notebooks are deliberately AES-256-GCM encrypted on disk (`backend/data/`, `utils/encryption.js`). Copying that content into Redis in the clear would downgrade the project's privacy posture. If a feature needs to cache user content in Redis, either cache only non-PII derivatives (IDs, counts, embeddings are borderline — prefer metadata) or encrypt values with `utils/encryption.js` first. For LLM answer caching, see §5.

## 5. Caching pattern (for the "smart caching" roadmap item)

Cache-aside, with content-hash keys and jittered TTLs:

```js
const crypto = require('crypto');

function llmCacheKey(prompt, model, params = {}) {
  const material = JSON.stringify({ prompt: prompt.trim().toLowerCase(), model, params });
  return `cache:llm:${model}:${crypto.createHash('sha256').update(material).digest('hex').slice(0, 32)}`;
}

// read side
const cached = await redisService.get(llmCacheKey(prompt, model));
if (cached) return cached;

// write side — TTL 5–15 min plus jitter so keys don't expire in a herd
const ttl = 300 + Math.floor(Math.random() * 300);
await redisService.set(llmCacheKey(prompt, model), answer, ttl);
```

- Key the cache on the *normalized* prompt + model + temperature; raw prompt casing/punctuation differences will tank hit rates.
- TTLs of minutes, not hours — LLM answers go stale and user-specific context must **not** be cached under a shared key. If the answer depends on the user (their notebook, their history), include `userId` in the key material — or don't cache it.
- Assume the cache can vanish at any moment (restart, eviction): every code path must work correctly on a miss. This is also why Redis caches are safe to lose while `backend/data/` files are not.
- Cost control (per `docs/plans/notebook-roadmap.md`): caching LLM extractions is the documented plan — follow that intent rather than inventing new storage.

## 6. Rate-limit store behavior — know the failure mode

`CustomRedisStore` swallows Redis errors (`get` → `null`, `incr` → `1`): if Redis is down, **rate limiting effectively stops counting** (fail-open) rather than blocking all traffic. That's a deliberate availability trade-off — keep it, but be aware of it when reasoning about outage behavior. On outage, `RedisService.get/set` still throw, so normal data paths fail loudly; only the limiter degrades silently.

## 7. Server hardening (Redis runs on the host, not in Docker)

- **Bind loopback**: Redis must listen on `127.0.0.1` only (`bind 127.0.0.1` in redis.conf; `protected-mode yes`). Never expose 6379 to a network — Redis has no TLS by default and AUTH is fast-brute-forceable.
- **Set a password** (`requirepass`) and mirror it in `REDIS_PASSWORD` — `RedisService` already supports it. Long random value, stored in `.env`.
- ACLs are optional here; a single app user + loopback is proportionate for a licenta deployment.
- Application code should never issue admin/keyspace commands (`FLUSHALL`, `KEYS *`, `CONFIG ...`). If you need to enumerate keys, use `SCAN` with a count — and prefer known key patterns over scanning in request paths.
- TLS is unnecessary on loopback; it becomes mandatory only if Redis ever moves off-host.

## 8. Memory & eviction — one critical warning

Redis here is a **primary store** (user accounts), not a pure cache. Therefore:

- **Never** set `maxmemory-policy` to `allkeys-lru`/`allkeys-*` — under memory pressure Redis would evict user records and rate-limit state. Keep `noeviction` (default) and size memory to the dataset, or at most `volatile-lru` (only evicts keys that have TTLs, i.e., tokens/limits/caches).
- Monitor with `INFO memory` / `redis-cli --stat`; the durable-content growth lives on disk (`backend/data/`), so Redis growth is dominated by tokens, limits, and whatever caches you add — all TTL'd if you follow §3.

## 9. Health & shutdown

- `/api/health` already reports Redis status via `healthCheck()` — new infrastructure checks should follow that pattern rather than adding parallel endpoints.
- `server.js` SIGTERM handler currently calls `process.exit(0)` immediately. If touching shutdown logic, drain first: `await redisService.disconnect()` (graceful `quit()`) before exiting, and close in-flight LLM/Chroma work where feasible.

## Sources

- [Redis official security documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)
- [Redis recommended security practices](https://redis.io/docs/latest/operate/rs/security/recommended-security-practices/)
- [Azure Cache for Redis — development best practices](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-best-practices-development)
- [Redis caching solutions overview](https://redis.io/solutions/caching/)
- Project docs: `docs/guides/redis.md`, `docs/architecture.md`
