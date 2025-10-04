#!/bin/bash

# Japanese AI Tutor - Quick Development Setup
# This script helps new developers get started quickly

set -e

echo "🇯🇵 Japanese AI Tutor - Development Setup"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in project directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking system prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker found: $DOCKER_VERSION"
else
    print_warning "Docker not found. Docker is optional but recommended for deployment"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose found: $COMPOSE_VERSION"
else
    print_warning "Docker Compose not found. Required for Docker deployment"
fi

# Check Ollama
if command -v ollama &> /dev/null; then
    print_success "Ollama found"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_success "Ollama service is running"
        
        # Check for llama3:8b model
        if ollama list | grep -q "llama3:8b"; then
            print_success "llama3:8b model is available"
        else
            print_warning "llama3:8b model not found. Attempting to pull..."
            ollama pull llama3:8b
            if [ $? -eq 0 ]; then
                print_success "llama3:8b model pulled successfully"
            else
                print_error "Failed to pull llama3:8b model"
            fi
        fi
    else
        print_warning "Ollama service is not running. Please start with: ollama serve"
    fi
else
    print_warning "Ollama not found. Please install from https://ollama.ai/"
    print_warning "After installation, run: ollama serve && ollama pull llama3:8b"
fi

print_status "Installing project dependencies..."

# Install npm dependencies
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Setting up environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please edit .env file with your Google API credentials (optional)"
    else
        print_warning ".env.example not found, creating basic .env file"
        cat > .env << EOF
# Japanese AI Tutor Environment Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
PORT=3000
NODE_ENV=development

# Google Custom Search API (Optional)
# GOOGLE_API_KEY=your_api_key_here
# GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
EOF
        print_success "Created basic .env file"
    fi
else
    print_success ".env file already exists"
fi

# Check if grammar data directory exists
if [ ! -d "backend/data/grammar" ]; then
    mkdir -p backend/data/grammar
    print_success "Created grammar data directory"
fi

print_status "Running basic tests..."

# Test if server can start (quick check)
timeout 10s npm start &> /dev/null &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    print_success "Server starts successfully"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    print_warning "Server startup test inconclusive"
fi

echo ""
print_success "Development setup complete! 🎉"
echo ""
echo "📋 Next steps:"
echo "   1. Start Ollama (if not running): ollama serve"
echo "   2. Start the development server: npm start"
echo "   3. Open your browser: http://localhost:3000"
echo "   4. Optional: Configure Google API in .env for enhanced search"
echo ""
echo "📚 Useful commands:"
echo "   npm start                    - Start development server"
echo "   ./deploy.sh                  - Docker deployment"
echo "   docker-compose up -d         - Start with Docker"
echo "   curl http://localhost:3000/api/test  - Test API"
echo ""
echo "📖 Documentation:"
echo "   README.md                    - Project overview"
echo "   CONTRIBUTING.md              - Contribution guidelines"
echo "   DOCKER_DEPLOYMENT.md         - Docker setup guide"
echo "   DEVELOPMENT_STATUS.md        - Current development status"
echo ""
print_success "Happy coding! 🇯🇵✨"
