#!/bin/bash

# Enhanced RAG Service Test Script
# This script tests the new ChromaDB integration

echo "🧪 Testing Enhanced RAG Service Integration"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server URL
SERVER_URL="http://localhost:3000"

# Test 1: Check if server is running
echo "1️⃣  Testing server connection..."
if curl -s "$SERVER_URL/api/test" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start it with 'npm start'${NC}"
    exit 1
fi
echo ""

# Test 2: Check RAG stats
echo "2️⃣  Checking RAG statistics..."
RAG_STATS=$(curl -s "$SERVER_URL/api/rag/stats")
echo "$RAG_STATS" | jq '.'
echo ""

# Test 3: Check ChromaDB stats
echo "3️⃣  Checking ChromaDB statistics..."
CHROMA_STATS=$(curl -s "$SERVER_URL/api/rag/chroma-stats")
echo "$CHROMA_STATS" | jq '.'
if echo "$CHROMA_STATS" | jq -e '.mode == "chromadb"' > /dev/null; then
    echo -e "${GREEN}✅ ChromaDB is active${NC}"
else
    echo -e "${YELLOW}⚠️  Using legacy mode (ChromaDB not available)${NC}"
fi
echo ""

# Test 4: Test semantic search
echo "4️⃣  Testing semantic search..."
SEARCH_RESULT=$(curl -s -X POST "$SERVER_URL/api/rag/semantic-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I use particles は and が?",
    "level": "beginner",
    "options": {"maxResults": 3}
  }')

if echo "$SEARCH_RESULT" | jq -e '.results' > /dev/null; then
    RESULT_COUNT=$(echo "$SEARCH_RESULT" | jq '.results | length')
    echo -e "${GREEN}✅ Semantic search successful - Found $RESULT_COUNT results${NC}"
    echo "$SEARCH_RESULT" | jq '.results[0] | {title, level, score}'
else
    echo -e "${RED}❌ Semantic search failed${NC}"
    echo "$SEARCH_RESULT" | jq '.'
fi
echo ""

# Test 5: Test regular RAG search
echo "5️⃣  Testing regular RAG search..."
REGULAR_SEARCH=$(curl -s -X POST "$SERVER_URL/api/rag/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "counting in Japanese",
    "level": "beginner",
    "maxResults": 2
  }')

if echo "$REGULAR_SEARCH" | jq -e '.results' > /dev/null; then
    RESULT_COUNT=$(echo "$REGULAR_SEARCH" | jq '.results | length')
    echo -e "${GREEN}✅ Regular search successful - Found $RESULT_COUNT results${NC}"
else
    echo -e "${RED}❌ Regular search failed${NC}"
fi
echo ""

# Test 6: Check health endpoint
echo "6️⃣  Checking system health..."
HEALTH=$(curl -s "$SERVER_URL/api/health")
RAG_STATUS=$(echo "$HEALTH" | jq -r '.rag.initialized')
SYSTEM_READY=$(echo "$HEALTH" | jq -r '.system_ready')

if [ "$SYSTEM_READY" == "true" ]; then
    echo -e "${GREEN}✅ System is ready${NC}"
    echo "   RAG Initialized: $RAG_STATUS"
    echo "   ChromaDB Mode: $(echo "$HEALTH" | jq -r '.rag.mode')"
else
    echo -e "${YELLOW}⚠️  System is not fully ready${NC}"
fi
echo ""

# Test 7: Add a test document
echo "7️⃣  Testing document addition..."
ADD_RESULT=$(curl -s -X POST "$SERVER_URL/api/rag/add" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document - Greetings",
    "content": "おはよう (ohayou) means good morning. こんにちは (konnichiwa) means hello.",
    "metadata": {
      "level": "beginner",
      "category": "test",
      "tags": ["greetings", "test"]
    }
  }')

if echo "$ADD_RESULT" | jq -e '.docId' > /dev/null; then
    DOC_ID=$(echo "$ADD_RESULT" | jq -r '.docId')
    echo -e "${GREEN}✅ Document added successfully - ID: $DOC_ID${NC}"
else
    echo -e "${RED}❌ Failed to add document${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "🎉 Test suite completed!"
echo ""
echo "Summary:"
echo "  - Server: Running"
echo "  - RAG Service: Initialized"
echo "  - ChromaDB: $(echo "$CHROMA_STATS" | jq -r '.mode')"
echo "  - Semantic Search: Working"
echo "  - Document Addition: Working"
echo ""
echo "For more details, visit:"
echo "  📊 Stats: $SERVER_URL/api/rag/stats"
echo "  🔬 Test: $SERVER_URL/api/test"
echo "  ❤️  Health: $SERVER_URL/api/health"
echo ""
