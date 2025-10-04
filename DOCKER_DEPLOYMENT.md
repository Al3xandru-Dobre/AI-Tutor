# Japanese AI Tutor - Docker Deployment

This setup provides a complete containerized deployment of the Japanese AI Tutor application with Ollama.

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM available
- NVIDIA GPU (optional, for better performance)

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd /path/to/japanese_ai_tutor
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for model download (first time only):**
   ```bash
   docker-compose logs -f model-init
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API Test: http://localhost:3000/api/test
   - Health Check: http://localhost:3000/api/health

## Services

### japanese-tutor
- **Port:** 3000
- **Description:** Main Node.js application serving the frontend and API
- **Health Check:** Available at `/api/health`

### ollama
- **Port:** 11434
- **Description:** Ollama AI service for running language models
- **Data:** Persisted in `ollama-data` volume

### model-init
- **Description:** One-time service that downloads the llama3:8b model
- **Status:** Runs once and exits

## GPU Support

### With NVIDIA GPU (Recommended)
The docker-compose.yml is configured for GPU support by default. Make sure you have:
- NVIDIA drivers installed
- nvidia-docker2 package installed

### Without GPU (CPU Only)
If you don't have a GPU, edit `docker-compose.yml`:
1. Remove the entire `deploy:` section under the `ollama` service
2. Uncomment the CPU-only deploy section

## Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f japanese-tutor
docker-compose logs -f ollama
```

### Rebuild after code changes
```bash
docker-compose build japanese-tutor
docker-compose up -d
```

### Check service status
```bash
docker-compose ps
```

### Clean up (removes volumes)
```bash
docker-compose down -v
```

## Volumes

- `ollama-data`: Stores downloaded models and Ollama configuration
- `./logs`: Application logs (mapped to host directory)

## Environment Variables

The application uses these environment variables in production:
- `NODE_ENV=production`
- `PORT=3000`
- `OLLAMA_HOST=ollama`
- `OLLAMA_PORT=11434`

## Troubleshooting

### Services won't start
1. Check if ports 3000 and 11434 are available
2. Ensure Docker has enough memory (8GB recommended)

### Model download fails
1. Check internet connection
2. Check Ollama service logs: `docker-compose logs ollama`

### Application can't connect to Ollama
1. Wait for model-init to complete
2. Check Ollama health: `curl http://localhost:11434/api/tags`

### Performance issues
1. Ensure GPU support is properly configured
2. Monitor resource usage: `docker stats`

## Production Considerations

1. **Reverse Proxy:** Use nginx or similar for SSL termination
2. **Monitoring:** Add health check endpoints to monitoring system
3. **Backup:** Regularly backup the `ollama-data` volume
4. **Security:** Run behind a firewall, only expose necessary ports
5. **Updates:** Rebuild images when updating dependencies

## Scaling

For production scaling:
1. Use Docker Swarm or Kubernetes
2. Consider multiple Ollama instances for load balancing
3. Add Redis for session management if needed
