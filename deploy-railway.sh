#!/bin/bash

# 🚀 Automated Railway.app Deployment Script
# This script automatically deploys your AI Creative Studio to Railway.app

set -e

echo "🚀 AI Creative Studio - Automated Railway Deployment"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    
    # Install Railway CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install railway
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://railway.app/install.sh | sh
    else
        # Windows (WSL)
        curl -fsSL https://railway.app/install.sh | sh
    fi
    
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
fi

# Login to Railway
echo ""
echo "📝 Logging into Railway..."
railway login

# Create new project
echo ""
echo "🏗️  Creating new Railway project..."
railway init

# Link to project
railway link

# Add PostgreSQL
echo ""
echo "🗄️  Adding PostgreSQL database..."
railway add --plugin postgresql

# Add Redis
echo ""
echo "📦 Adding Redis..."
railway add --plugin redis

# Set environment variables
echo ""
echo "⚙️  Setting environment variables..."

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set API_VERSION=v1

echo -e "${GREEN}✓ Environment variables set${NC}"

# Deploy
echo ""
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo ""
echo "🌐 Getting deployment URL..."
RAILWAY_URL=$(railway domain)

echo ""
echo "======================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Your API is live at: $RAILWAY_URL"
echo ""
echo "Next steps:"
echo "1. Set up MongoDB Atlas: https://mongodb.com/cloud/atlas"
echo "2. Set up Upstash Redis: https://upstash.com"
echo "3. Set up Cloudflare R2: https://cloudflare.com"
echo "4. Update environment variables with:"
echo "   railway variables set MONGODB_URI=<your-mongodb-uri>"
echo "   railway variables set REDIS_HOST=<your-upstash-host>"
echo "   railway variables set S3_ENDPOINT=<your-r2-endpoint>"
echo ""
echo "View logs: railway logs"
echo "Open dashboard: railway open"
echo ""
