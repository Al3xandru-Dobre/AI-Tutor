*Deploy the Japanese AI Tutor as a full Docker Compose stack (app + ChromaDB + Ollama) with GPU or CPU.*

# Docker Deployment

## Prerequisites

- Docker and Docker Compose installed
- At least 8 GB RAM available
- NVIDIA GPU + `nvidia-docker2` (optional, for faster local inference)
- A `.env` file (`cp .env.example .env`) — the compose ChromaDB service reads `CHROMA_AUTH_TOKEN`

## Quick Start

```bash
# Recommended: auto-detects GPU and picks the right compose file
./deploy.sh
```

`deploy.sh` chooses `docker-compose.yml` (GPU) when `nvidia-smi` is present, otherwise `docker-compose.cpu.yml`, then builds, starts, and health-checks everything. Manual alternative:

```bash
docker-compose up -d

# First start only — watch the llama3:8b model download
docker-compose logs -f model-init
```

Then open:

- App: <http://localhost:3000>
- Health: <http://localhost:3000/api/health>

> **Note:** Redis is not part of the compose files — run it on the host (see [Redis guide](redis.md)) if you use the auth features.

## Services

| Service | Port | Purpose |
|---------|------|---------|
| `japanese-tutor` | 3000 | Node.js app serving the frontend and API (health: `/api/health`) |
| `chromadb` | 8000 | Vector database for the knowledge base (heartbeat: `/api/v1/heartbeat`) |
| `ollama` | 11434 | Local LLM inference; models persist in the `ollama-data` volume |
| `model-init` | — | One-shot service that pulls `llama3:8b`, then exits |

## Commands

```bash
docker-compose up -d              # start
docker-compose down               # stop
docker-compose logs -f            # all logs
docker-compose logs -f japanese-tutor
docker-compose ps                 # status
docker-compose build japanese-tutor && docker-compose up -d   # rebuild after code changes
docker-compose down -v            # stop and remove volumes (deletes models)
```

## GPU vs CPU

- **GPU:** `docker-compose.yml` reserves all NVIDIA GPUs for the `ollama` service by default. Requires NVIDIA drivers and nvidia-docker2.
- **CPU:** use `docker-compose.cpu.yml` (or let `deploy.sh` pick it). To hand-edit `docker-compose.yml`, remove the `deploy:` GPU section under `ollama` and use a memory limit instead.

## Volumes

- `ollama-data` — downloaded models and Ollama config
- `./logs` — application logs (host directory)
- `./chroma_data` — persistent ChromaDB storage

## Environment

Set inside the compose stack: `NODE_ENV=production`, `PORT=3000`, `OLLAMA_HOST=ollama`, `OLLAMA_PORT=11434`. Everything else (API keys, Redis, SMTP, secrets) comes from your `.env`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Services won't start | Check ports 3000/8000/11434 are free; ensure Docker has ≥ 8 GB RAM. |
| Model download fails | Check connectivity and `docker-compose logs ollama`. |
| App can't reach Ollama | Wait for `model-init` to finish; test with `curl http://localhost:11434/api/tags`. |
| Slow performance | Verify GPU is actually used; inspect with `docker stats`. |

## Production Notes

- Terminate SSL with a reverse proxy (nginx/Caddy) and only expose necessary ports.
- Back up the `ollama-data` and `chroma_data` volumes regularly.
- Rebuild images when dependencies change; monitor via the `/api/health` endpoint.
