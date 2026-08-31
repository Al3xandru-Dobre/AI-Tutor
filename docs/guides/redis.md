*Install and configure Redis, the in-memory store used for auth sessions, tokens, and rate limiting.*

# Redis Guide

## What Redis Is Used For

- User account data (RAM-based, with persistence)
- Access and refresh tokens (TTL-based)
- Email verification and password-reset tokens
- Rate limiting for auth endpoints

## Installation

### Option 1: Docker

```bash
docker run -d \
  --name redis-auth \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:alpine \
  redis-server --appendonly yes

# Verify
docker exec -it redis-auth redis-cli ping   # -> PONG

# Stop / remove
docker stop redis-auth && docker rm redis-auth
```

### Option 2: Native packages

**Ubuntu/Debian**

```bash
sudo apt-get update && sudo apt-get install redis-server
sudo systemctl start redis && sudo systemctl enable redis
redis-cli ping   # -> PONG
```

**macOS (Homebrew)**

```bash
brew install redis
brew services start redis
redis-cli ping   # -> PONG
```

**Windows:** use the Microsoft-archived build (<https://github.com/microsoftarchive/redis/releases>) or Docker/WSL2; run `redis-server.exe`, then `redis-cli ping`.

### Option 3: Managed/cloud Redis (production)

Point `.env` at your instance, e.g. Redis Cloud or Scaleway:

```env
REDIS_HOST=your-instance.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

## Configuration

Persistence is recommended so accounts survive restarts:

```bash
redis-cli CONFIG SET save "900 1 300 10 60 10000"   # RDB snapshots
redis-cli CONFIG SET appendonly yes                  # AOF
redis-cli CONFIG SET appendfsync everysec
```

Optional memory cap:

```bash
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Quick Tests

```bash
redis-cli SET test "Hello Redis" EX 60
redis-cli GET test      # -> "Hello Redis"
redis-cli TTL test      # -> 60
redis-cli INFO memory   # server stats
```

GUI clients: RedisInsight, Another Redis Desktop Manager, Medis.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Redis not starting | Check `/var/log/redis/redis-server.log`; check port 6379 isn't taken (`ss -tlnp | grep 6379`). |
| Cannot connect | `systemctl status redis` or `ps aux | grep redis`; open the port in your firewall. |
| Out of memory | Raise `maxmemory` or flush: `redis-cli FLUSHDB` (destructive). |

After Redis is up, set the `REDIS_*` variables in `.env` and start the server with `npm start`. Reference: <https://redis.io/docs/latest/>.
