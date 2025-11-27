#!/bin/bash

# 🆓 Complete Free Deployment Script
# Automates deployment to all free services

set -e

echo "🆓 AI Creative Studio - Complete Free Deployment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install Railway CLI
echo -e "${BLUE}Step 1/6: Installing Railway CLI...${NC}"
if ! command_exists railway; then
    curl -fsSL https://railway.app/install.sh | sh
    echo -e "${GREEN}✓ Railway CLI installed${NC}"
else
    echo -e "${GREEN}✓ Railway CLI already installed${NC}"
fi

# Step 2: Install Ngrok
echo ""
echo -e "${BLUE}Step 2/6: Installing Ngrok...${NC}"
if ! command_exists ngrok; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ngrok/ngrok/ngrok
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    fi
    echo -e "${GREEN}✓ Ngrok installed${NC}"
else
    echo -e "${GREEN}✓ Ngrok already installed${NC}"
fi

# Step 3: Deploy API to Railway
echo ""
echo -e "${BLUE}Step 3/6: Deploying API to Railway...${NC}"
echo "Please login to Railway when prompted..."
railway login

echo "Creating new Railway project..."
railway init

echo "Adding PostgreSQL..."
railway add --plugin postgresql

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set API_VERSION=v1

echo "Deploying API..."
railway up

RAILWAY_URL=$(railway domain)
echo -e "${GREEN}✓ API deployed to Railway: $RAILWAY_URL${NC}"

# Step 4: Setup MongoDB Atlas
echo ""
echo -e "${BLUE}Step 4/6: MongoDB Atlas Setup${NC}"
echo -e "${YELLOW}Please complete these steps manually:${NC}"
echo "1. Go to: https://mongodb.com/cloud/atlas"
echo "2. Create free account (M0 cluster)"
echo "3. Create database user"
echo "4. Get connection string"
echo ""
read -p "Enter your MongoDB connection string: " MONGODB_URI
railway variables set MONGODB_URI="$MONGODB_URI"
echo -e "${GREEN}✓ MongoDB configured${NC}"

# Step 5: Setup Upstash Redis
echo ""
echo -e "${BLUE}Step 5/6: Upstash Redis Setup${NC}"
echo -e "${YELLOW}Please complete these steps manually:${NC}"
echo "1. Go to: https://upstash.com"
echo "2. Create free account"
echo "3. Create Redis database"
echo "4. Get connection details"
echo ""
read -p "Enter Redis host: " REDIS_HOST
read -p "Enter Redis port (default 6379): " REDIS_PORT
REDIS_PORT=${REDIS_PORT:-6379}
read -p "Enter Redis password: " REDIS_PASSWORD
railway variables set REDIS_HOST="$REDIS_HOST"
railway variables set REDIS_PORT="$REDIS_PORT"
railway variables set REDIS_PASSWORD="$REDIS_PASSWORD"
echo -e "${GREEN}✓ Redis configured${NC}"

# Step 6: Setup Cloudflare R2
echo ""
echo -e "${BLUE}Step 6/6: Cloudflare R2 Setup${NC}"
echo -e "${YELLOW}Please complete these steps manually:${NC}"
echo "1. Go to: https://cloudflare.com"
echo "2. Create account"
echo "3. Go to R2 Storage"
echo "4. Create bucket"
echo "5. Get API credentials"
echo ""
read -p "Enter R2 endpoint: " S3_ENDPOINT
read -p "Enter R2 access key: " S3_ACCESS_KEY
read -p "Enter R2 secret key: " S3_SECRET_KEY
read -p "Enter R2 bucket name: " S3_BUCKET
railway variables set S3_ENDPOINT="$S3_ENDPOINT"
railway variables set S3_ACCESS_KEY="$S3_ACCESS_KEY"
railway variables set S3_SECRET_KEY="$S3_SECRET_KEY"
railway variables set S3_BUCKET="$S3_BUCKET"
echo -e "${GREEN}✓ Storage configured${NC}"

# Step 7: Start GPU Service Locally
echo ""
echo -e "${BLUE}Step 7/6: GPU Service Setup${NC}"
echo "Starting GPU service locally..."

# Install Python dependencies
cd gpu-service
pip install -r requirements.txt

# Start GPU service in background
echo "Starting GPU service on port 8000..."
python main.py &
GPU_PID=$!

# Wait for GPU service to start
sleep 5

# Start Ngrok tunnel
echo "Starting Ngrok tunnel..."
ngrok http 8000 > /dev/null &
NGROK_PID=$!

# Wait for Ngrok to start
sleep 3

# Get Ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}Failed to get Ngrok URL${NC}"
    echo "Please start Ngrok manually: ngrok http 8000"
else
    echo -e "${GREEN}✓ GPU service exposed at: $NGROK_URL${NC}"
    
    # Update Railway with GPU URL
    railway variables set GPU_SERVICE_URL="$NGROK_URL"
fi

# Final Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Complete Free Deployment Done!${NC}"
echo "======================================"
echo ""
echo "📊 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API Server:     $RAILWAY_URL"
echo "GPU Service:    $NGROK_URL"
echo "Database:       MongoDB Atlas (Free)"
echo "Queue:          Upstash Redis (Free)"
echo "Storage:        Cloudflare R2 (Free)"
echo ""
echo "🎯 Next Steps:"
echo "1. Test API: curl $RAILWAY_URL/health"
echo "2. View logs: railway logs"
echo "3. Keep this terminal open (GPU service running)"
echo ""
echo "💡 Important:"
echo "- GPU service runs on your computer"
echo "- Keep this terminal open for GPU processing"
echo "- Ngrok URL changes on restart (update Railway)"
echo ""
echo "🔗 Useful Links:"
echo "- Railway Dashboard: https://railway.app/dashboard"
echo "- MongoDB Atlas: https://cloud.mongodb.com"
echo "- Upstash Console: https://console.upstash.com"
echo "- Cloudflare R2: https://dash.cloudflare.com"
echo ""
