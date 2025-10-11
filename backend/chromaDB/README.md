# ChromaDB Setup for Japanese AI Tutor

This directory contains the ChromaDB configuration and utilities for the Japanese AI Tutor application.

## Quick Start

### 1. Start ChromaDB

```bash
# From the backend/chromaDB directory
docker-compose up -d

# Check if it's running
docker-compose ps
```

### 2. Verify Connection

```bash
curl http://localhost:8000/api/v1/heartbeat
```

You should see a timestamp response.

### 3. Test Integration

```bash
# From project root
node backend/scripts/test-chromadb.js
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key settings:
- `CHROMA_DB_URL`: ChromaDB server URL (default: http://localhost:8000)
- `CHROMA_AUTH_TOKEN`: Authentication token (optional but recommended)

### Docker Compose

The `docker-compose.yml` includes:
- **Persistence**: Data stored in `./chroma_data`
- **Logs**: Stored in `./chroma_logs`
- **Port**: 8000 (HTTP) and 8001 (gRPC)
- **Health checks**: Automatic monitoring

## Maintenance

### Health Check

```bash
node -e "
const { ChromaClient } = require('chromadb');
(async () => {
  const client = new ChromaClient({ path: 'http://localhost:8000' });
  console.log('Heartbeat:', await client.heartbeat());
  console.log('Version:', await client.version());
})()
"
```

### Backup Collection

```bash
node backend/chromaDB/chromadb-maintenance.js backup
```

### Performance Analysis

```bash
node backend/chromaDB/chromadb-maintenance.js analyze
```

### Reset Database

```bash
# Stop ChromaDB
docker-compose down

# Remove data (CAUTION: This deletes all data!)
rm -rf chroma_data/*

# Restart
docker-compose up -d
```

## Directory Structure

```
backend/chromaDB/
├── docker-compose.yml       # Docker configuration
├── .env                     # Environment variables
├── chromadb-maintenance.js  # Maintenance utilities
├── chroma_data/            # Persistent data (gitignored)
├── chroma_logs/            # Log files (gitignored)
└── chroma_config/          # Configuration files
    └── log_config.yml      # Logging configuration
```

## Troubleshooting

### ChromaDB won't start

1. Check if port 8000 is already in use:
   ```bash
   lsof -i :8000
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs chromadb
   ```

3. Verify Docker is running:
   ```bash
   docker ps
   ```

### Connection refused

1. Ensure ChromaDB is running:
   ```bash
   docker-compose ps
   ```

2. Check firewall settings

3. Verify the URL in your application matches `CHROMA_DB_URL`

### Slow queries

1. Check collection size:
   ```bash
   node backend/scripts/test-chromadb.js stats
   ```

2. Optimize HNSW parameters in `enhancedRAGService.js`:
   - Increase `hnsw:search_ef` for better accuracy
   - Decrease for faster queries

3. Monitor with performance analysis:
   ```bash
   node backend/chromaDB/chromadb-maintenance.js analyze
   ```

## Advanced Configuration

### Custom Embeddings

To use your trained Japanese embedding model:

1. Train the model:
   ```bash
   cd chromaDB-development_and_AI_stuff
   python scripts/run_training_pipeline.py
   ```

2. Update `enhancedRAGService.js`:
   ```javascript
   await ragService.setupCustomEmbedding();
   ```

3. Restart your backend

### Scaling

For production deployments:

1. Use external ChromaDB server
2. Configure authentication (CHROMA_AUTH_TOKEN)
3. Set up regular backups
4. Monitor with health checks
5. Consider using ChromaDB Cloud for managed hosting

## Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Main README](../../README.md)
