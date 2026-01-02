# 🔴 Redis Installation Guide

## What is Redis?

Redis is an in-memory data store used by the authentication system to:
- Store user data (RAM-based for fast access)
- Store access and refresh tokens
- Implement rate limiting
- Store verification and password reset tokens

## Installation Options

### Option 1: Docker (Recommended)

#### Install Docker
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# macOS (with Homebrew)
brew install docker

# Windows
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### Run Redis with Docker
```bash
# Run Redis with persistence
docker run -d \
  --name redis-auth \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:alpine \
  redis-server --appendonly yes

# Or with docker-compose
cd backend/chromaDB
# Add to docker-compose.yml:
#   redis:
#     image: redis:alpine
#     ports:
#       - "6379:6379"
#     volumes:
#       - redis-data:/data
#     command: redis-server --appendonly yes
# docker-compose up -d redis
```

#### Verify Redis is running
```bash
docker ps | grep redis
```

#### Test Redis connection
```bash
docker exec -it redis-auth redis-cli ping
# Should return: PONG
```

#### Stop Redis
```bash
docker stop redis-auth
docker rm redis-auth
```

### Option 2: Local Installation

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test Redis
redis-cli ping
# Should return: PONG
```

#### macOS (with Homebrew)
```bash
brew install redis

# Start Redis
brew services start redis

# Test Redis
redis-cli ping
# Should return: PONG
```

#### Windows
```bash
# Download Redis for Windows from:
# https://github.com/microsoftarchive/redis/releases

# Extract and run:
redis-server.exe

# In another terminal, test:
redis-cli ping
```

### Option 3: Cloud Redis (Production)

#### Redis Cloud (Redis Labs)
1. Sign up at https://redis.com/try-free/
2. Create a free Redis database
3. Get connection string (e.g., `redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345`)
4. Update .env:
```env
REDIS_HOST=redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

#### Scaleway Managed Database
1. Create Scaleway account
2. Create Redis instance
3. Get connection details
4. Update .env:
```env
REDIS_HOST=your-redis-instance.scaleway.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

---

## Configuration

### Redis Persistence

Redis persistence is configured to prevent data loss on restart:

```bash
# RDB (snapshot-based)
redis-cli CONFIG SET save "900 1 300 10 60 10000"

# AOF (append-only file)
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG SET appendfsync everysec
```

### Redis Memory

```bash
# Set maximum memory (optional)
redis-cli CONFIG SET maxmemory 256mb

# Eviction policy (optional)
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Testing Redis

### Test Connection
```bash
redis-cli ping
# Should return: PONG
```

### Test Set/Get
```bash
redis-cli SET test "Hello Redis"
redis-cli GET test
# Should return: "Hello Redis"
```

### Test with TTL
```bash
redis-cli SET test "Hello Redis" EX 60
redis-cli TTL test
# Should return: (integer) 60
```

### Test Hash
```bash
redis-cli HSET user:123 name "John Doe" email "john@example.com"
redis-cli HGETALL user:123
# Should return: 1) "name" 2) "John Doe" 3) "email" 4) "john@example.com"
```

---

## Monitoring Redis

### Redis CLI
```bash
# Monitor commands in real-time
redis-cli MONITOR

# Get server info
redis-cli INFO

# Get specific info
redis-cli INFO memory
redis-cli INFO stats

# List all keys
redis-cli KEYS "*"
```

### Redis GUI Clients

- **RedisInsight** (Official, free): https://redis.com/redis-enterprise/redis-insight/
- **Another Redis Desktop Manager** (Free, open source): https://github.com/qishibo/AnotherRedisDesktopManager
- **Medis** (macOS only, free): https://github.com/luin/medis

---

## Troubleshooting

### Redis is not starting

```bash
# Check logs
sudo tail -f /var/log/redis/redis-server.log

# Check if port is in use
sudo netstat -tlnp | grep 6379

# Kill existing Redis process
sudo killall redis-server
```

### Cannot connect to Redis

```bash
# Check if Redis is running
sudo systemctl status redis
# or
ps aux | grep redis

# Check firewall
sudo ufw allow 6379
```

### Redis out of memory

```bash
# Increase maxmemory
redis-cli CONFIG SET maxmemory 512mb

# Or free up memory
redis-cli FLUSHDB
```

---

## Production Recommendations

1. **Use Redis Cloud or managed database** for production
2. **Enable persistence** (RDB + AOF)
3. **Set memory limits** to prevent OOM
4. **Monitor Redis** with RedisInsight or similar
5. **Use Redis Sentinel** for high availability
6. **Use Redis Cluster** for scalability

---

## Next Steps

After installing Redis:

1. **Configure .env**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password
REDIS_DB=0
```

2. **Test connection**:
```bash
redis-cli ping
```

3. **Start the server**:
```bash
npm start
```

---

**For more information**: https://redis.io/documentation
