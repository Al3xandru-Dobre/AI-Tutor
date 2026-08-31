#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     🚀 Japanese AI Tutor - Authentication Setup              ║"
echo "║                                                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Step 2: Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please edit .env file with your configuration before continuing"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Step 3: Check Redis
echo "🔴 Step 3: Checking Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running and accessible"
    else
        echo "⚠️  Redis is installed but not running"
        echo "   Please start Redis: redis-server"
        echo "   Or use Docker: docker run -d -p 6379:6379 redis:alpine redis-server --appendonly yes"
    fi
else
    echo "⚠️  Redis is not installed"
    echo "   Please install Redis: https://redis.io/download"
    echo "   Or use Docker: docker run -d -p 6379:6379 redis:alpine redis-server --appendonly yes"
fi
echo ""

# Step 4: Clean existing data (optional)
echo "🧹 Step 4: Clean existing data?"
read -p "Do you want to clean existing data? (y/N): " cleanData
if [ "$cleanData" = "y" ] || [ "$cleanData" = "Y" ]; then
    echo "   Cleaning data..."
    node backend/scripts/cleanup-existing-data.js
    if [ $? -ne 0 ]; then
        echo "❌ Failed to clean data"
        exit 1
    fi
else
    echo "   Skipping data cleanup"
fi
echo ""

# Step 5: Verify environment variables
echo "🔧 Step 5: Checking environment variables..."
if grep -q "JWT_SECRET=your-super-secret-jwt-access-key-change-in-production" .env; then
    echo "⚠️  JWT_SECRET is still using default value. Please update in .env"
fi

if grep -q "REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production" .env; then
    echo "⚠️  REFRESH_TOKEN_SECRET is still using default value. Please update in .env"
fi

if grep -q "EMAIL_HASH_KEY=email-hashing-secret-key-change-in-production" .env; then
    echo "⚠️  EMAIL_HASH_KEY is still using default value. Please update in .env"
fi

if grep -q "SMTP_HOST=smtp.scaleway.com" .env && grep -q "SMTP_USER=your-smtp-user@scaleway.com" .env; then
    echo "ℹ️  SMTP credentials are using default values. Please update if you want email verification"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║  ✅ SETUP COMPLETE!                                            ║"
echo "║                                                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Make sure Redis is running: redis-server"
echo "   3. Start the server: npm start"
echo "   4. Open browser: http://localhost:3000"
echo "   5. Register a new account"
echo "   6. Verify email (if email service configured)"
echo "   7. Login and test the system"
echo ""

echo "📖 For more information, see docs/plans/auth.md"
echo ""
