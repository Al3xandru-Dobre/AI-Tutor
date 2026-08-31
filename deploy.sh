#!/bin/bash

# Japanese AI Tutor - Quick Deploy Script

set -e

echo "🚀 Japanese AI Tutor - Docker Deployment"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Function to detect GPU
check_gpu() {
    if command -v nvidia-smi &> /dev/null; then
        echo "✅ NVIDIA GPU detected"
        return 0
    else
        echo "ℹ️  No NVIDIA GPU detected, using CPU mode"
        return 1
    fi
}

# Choose compose file based on GPU availability
if check_gpu; then
    COMPOSE_FILE="docker-compose.yml"
    echo "📋 Using GPU-enabled configuration"
else
    COMPOSE_FILE="docker-compose.cpu.yml"
    echo "📋 Using CPU-only configuration"
fi

echo ""
echo "🔧 Starting deployment..."
echo "========================"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down > /dev/null 2>&1 || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f $COMPOSE_FILE up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are healthy
echo "🏥 Checking service health..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "Up (healthy)"; then
        echo "✅ Services are healthy!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️  Services are taking longer than expected to become healthy"
    echo "   Check logs with: docker-compose -f $COMPOSE_FILE logs"
fi

echo ""
echo "📦 Checking model download status..."
docker-compose -f $COMPOSE_FILE logs model-init | tail -5

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "🌐 Frontend:     http://localhost:3000"
echo "🔧 API Test:     http://localhost:3000/api/test"
echo "❤️  Health Check: http://localhost:3000/api/health"
echo "🤖 Ollama API:   http://localhost:11434"
echo ""
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop services:    docker-compose -f $COMPOSE_FILE down"
echo "   Restart:          docker-compose -f $COMPOSE_FILE restart"
echo "   Check model:      curl http://localhost:11434/api/tags"
echo ""
echo "🔍 For troubleshooting, see docs/guides/deployment-docker.md"
