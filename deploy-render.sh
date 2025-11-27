#!/bin/bash

# 🚀 Automated Render.com Deployment Script
# This script automatically deploys your AI Creative Studio to Render.com

set -e

echo "🚀 AI Creative Studio - Automated Render Deployment"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo -e "${YELLOW}Render CLI not found. Installing...${NC}"
    npm install -g @render/cli
    echo -e "${GREEN}✓ Render CLI installed${NC}"
fi

# Login to Render
echo ""
echo "📝 Logging into Render..."
render login

# Create render.yaml if it doesn't exist
if [ ! -f "render.yaml" ]; then
    echo ""
    echo "📝 Creating render.yaml configuration..."
    
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: ai-studio-api
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: JWT_SECRET
        generateValue: true
      - key: API_VERSION
        value: v1
    healthCheckPath: /health

databases:
  - name: ai-studio-postgres
    databaseName: ai_studio
    user: postgres
    plan: free
EOF
    
    echo -e "${GREEN}✓ render.yaml created${NC}"
fi

# Deploy
echo ""
echo "🚀 Deploying to Render..."
render deploy

echo ""
echo "======================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Your API will be live at: https://ai-studio-api.onrender.com"
echo ""
echo "Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Add environment variables for:"
echo "   - MONGODB_URI (from MongoDB Atlas)"
echo "   - REDIS_HOST (from Upstash)"
echo "   - S3_ENDPOINT (from Cloudflare R2)"
echo ""
