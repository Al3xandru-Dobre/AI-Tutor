#!/bin/bash
# setup-chromadb.sh - Automated setup script for ChromaDB and embeddings

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji support check
if [[ "$OSTYPE" == "darwin"* ]]; then
    CHECK="✅"
    CROSS="❌"
    WARN="⚠️"
    ROCKET="🚀"
    GEAR="⚙️"
else
    CHECK="[OK]"
    CROSS="[FAIL]"
    WARN="[WARN]"
    ROCKET=">>>"
    GEAR="[*]"
fi

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Japanese AI Tutor - ChromaDB Setup Wizard            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${2}${1}${NC}"
}

print_step() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${1}${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Step 1: Check prerequisites
print_step "Step 1: Checking Prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_status "$CHECK Node.js installed: $NODE_VERSION" "$GREEN"
else
    print_status "$CROSS Node.js not found. Please install Node.js 18+" "$RED"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_status "$CHECK npm installed: $NPM_VERSION" "$GREEN"
else
    print_status "$CROSS npm not found" "$RED"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_status "$CHECK Python installed: $PYTHON_VERSION" "$GREEN"
else
    print_status "$CROSS Python 3 not found. Please install Python 3.9+" "$RED"
    exit 1
fi

# Check pip
if command_exists pip3; then
    print_status "$CHECK pip3 installed" "$GREEN"
else
    print_status "$CROSS pip3 not found. Please install pip3" "$RED"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_status "$CHECK Docker installed: $DOCKER_VERSION" "$GREEN"

    # Check if Docker daemon is running
    if docker ps >/dev/null 2>&1; then
        print_status "$CHECK Docker daemon is running" "$GREEN"
    else
        print_status "$WARN Docker daemon not running. Starting..." "$YELLOW"
        sudo systemctl start docker 2>/dev/null || true
    fi
else
    print_status "$CROSS Docker not found. Please install Docker" "$RED"
    exit 1
fi

# Check docker-compose
if command_exists docker-compose; then
    print_status "$CHECK docker-compose installed" "$GREEN"
else
    print_status "$WARN docker-compose not found, trying docker compose..." "$YELLOW"
    if docker compose version >/dev/null 2>&1; then
        print_status "$CHECK docker compose available" "$GREEN"
        alias docker-compose='docker compose'
    else
        print_status "$CROSS Neither docker-compose nor docker compose found" "$RED"
        exit 1
    fi
fi

# Step 2: Install Node.js dependencies
print_step "Step 2: Installing Node.js Dependencies"

cd backend
print_status "$GEAR Installing backend dependencies..." "$BLUE"
npm install chromadb @tensorflow/tfjs-node @xenova/transformers --save 2>&1 | tail -n 5
print_status "$CHECK Node.js dependencies installed" "$GREEN"
cd ..

# Step 3: Setup Python environment
print_step "Step 3: Setting Up Python Environment"

cd chromaDB-development_and_AI_stuff

if [ -d "venv" ]; then
    print_status "$WARN Virtual environment already exists, skipping creation" "$YELLOW"
else
    print_status "$GEAR Creating virtual environment..." "$BLUE"
    python3 -m venv venv
    print_status "$CHECK Virtual environment created" "$GREEN"
fi

print_status "$GEAR Installing Python dependencies..." "$BLUE"
source venv/bin/activate
pip install -r requirements.txt --quiet --disable-pip-version-check 2>&1 | tail -n 5
print_status "$CHECK Python dependencies installed" "$GREEN"
deactivate

cd ..

# Step 4: Setup ChromaDB
print_step "Step 4: Setting Up ChromaDB"

cd backend/chromaDB

# Create directories
print_status "$GEAR Creating ChromaDB directories..." "$BLUE"
mkdir -p chroma_data chroma_logs chroma_config backups
print_status "$CHECK Directories created" "$GREEN"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "$GEAR Creating .env file..." "$BLUE"
    cp .env.example .env 2>/dev/null || echo "CHROMA_DB_URL=http://localhost:8000" > .env
    print_status "$CHECK .env file created" "$GREEN"
else
    print_status "$WARN .env file already exists, skipping" "$YELLOW"
fi

# Step 5: Start ChromaDB
print_step "Step 5: Starting ChromaDB"

print_status "$ROCKET Starting ChromaDB container..." "$BLUE"
docker-compose up -d

# Wait for ChromaDB to be ready
print_status "$GEAR Waiting for ChromaDB to be ready..." "$BLUE"
MAX_TRIES=30
TRIES=0
while [ $TRIES -lt $MAX_TRIES ]; do
    if curl -s http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1; then
        print_status "$CHECK ChromaDB is ready!" "$GREEN"
        break
    fi
    TRIES=$((TRIES + 1))
    echo -n "."
    sleep 2
done

if [ $TRIES -eq $MAX_TRIES ]; then
    print_status "$CROSS ChromaDB failed to start" "$RED"
    echo "Check logs with: docker-compose logs chromadb"
    exit 1
fi

cd ../..

# Step 6: Test the setup
print_step "Step 6: Testing ChromaDB Integration"

print_status "$GEAR Running integration tests..." "$BLUE"
cd backend
node scripts/test-chromadb.js

# Step 7: Summary
print_step "Setup Complete!"

echo ""
print_status "$CHECK All components installed successfully!" "$GREEN"
echo ""
echo -e "${CYAN}What's been set up:${NC}"
echo -e "  $CHECK Node.js dependencies installed"
echo -e "  $CHECK Python virtual environment created"
echo -e "  $CHECK Python dependencies installed"
echo -e "  $CHECK ChromaDB running on http://localhost:8000"
echo -e "  $CHECK Integration tests passed"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Start your backend: ${CYAN}cd backend && npm start${NC}"
echo -e "  2. Use the app to generate conversation data"
echo -e "  3. Train custom embeddings: ${CYAN}cd chromaDB-development_and_AI_stuff && source venv/bin/activate && python scripts/run_training_pipeline.py${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  • Check ChromaDB status: ${CYAN}docker ps | grep chroma${NC}"
echo -e "  • View ChromaDB logs: ${CYAN}cd backend/chromaDB && docker-compose logs chromadb${NC}"
echo -e "  • Stop ChromaDB: ${CYAN}cd backend/chromaDB && docker-compose down${NC}"
echo -e "  • Restart ChromaDB: ${CYAN}cd backend/chromaDB && docker-compose restart${NC}"
echo -e "  • Run tests: ${CYAN}node backend/scripts/test-chromadb.js${NC}"
echo -e "  • Maintenance: ${CYAN}node backend/chromaDB/chromadb-maitanance.js [health|backup|analyze|info]${NC}"
echo ""
print_status "$ROCKET ChromaDB is ready to use!" "$GREEN"
echo ""
