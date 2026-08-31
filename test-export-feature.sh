#!/bin/bash

# Test script for conversation export feature

echo "🧪 Testing Conversation Export Feature"
echo "========================================"

# Check if server is running
echo ""
echo "1. Checking if server is accessible..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start the server first."
    exit 1
fi

# List conversations
echo ""
echo "2. Listing conversations..."
CONVERSATIONS=$(curl -s http://localhost:3000/api/conversations)
echo "$CONVERSATIONS" | jq '.' 2>/dev/null || echo "$CONVERSATIONS"

# Get first conversation ID
CONV_ID=$(echo "$CONVERSATIONS" | jq -r '.[0].id' 2>/dev/null)

if [ "$CONV_ID" = "null" ] || [ -z "$CONV_ID" ]; then
    echo "⚠️  No conversations found. Please create a conversation first."
    exit 0
fi

echo ""
echo "3. Testing export without training flag..."
RESULT=$(curl -s -X POST http://localhost:3000/api/conversations/$CONV_ID/export \
    -H "Content-Type: application/json" \
    -d '{"useForTraining": false}')
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

echo ""
echo "4. Testing export WITH training flag..."
RESULT=$(curl -s -X POST http://localhost:3000/api/conversations/$CONV_ID/export \
    -H "Content-Type: application/json" \
    -d '{"useForTraining": true}')
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"

# Check if training file was created
echo ""
echo "5. Checking training folder..."
if [ -d "../backend/data/training" ]; then
    TRAINING_FILES=$(ls -la ../backend/data/training/ 2>/dev/null | tail -n +4)
    if [ -z "$TRAINING_FILES" ]; then
        echo "⚠️  Training folder exists but is empty"
    else
        echo "✅ Training files found:"
        echo "$TRAINING_FILES"
    fi
else
    echo "⚠️  Training folder not yet created"
fi

echo ""
echo "6. Verifying conversation history is intact..."
CONV_CHECK=$(curl -s http://localhost:3000/api/conversations/$CONV_ID)
if echo "$CONV_CHECK" | jq '.id' > /dev/null 2>&1; then
    echo "✅ Conversation history is intact"
else
    echo "❌ Failed to retrieve conversation"
fi

echo ""
echo "========================================"
echo "✅ Export feature testing complete!"
echo ""
echo "Frontend testing:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click on a conversation in the sidebar"
echo "3. Click the JSON export button (📥)"
echo "4. Check/uncheck the training data option"
echo "5. Verify the file downloads"
