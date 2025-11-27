#!/bin/bash

# AI Creative Studio Backend Setup Script
# This script sets up the complete backend infrastructure

set -e

echo "🚀 AI Creative Studio Backend Setup"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${YELLOW}Warning: This script is optimized for Linux. Some features may not work on other systems.${NC}"
fi

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Check NVIDIA GPU
if ! command -v nvidia-smi &> /dev/null; then
    echo -e "${YELLOW}⚠ NVIDIA drivers not found. GPU features will not work.${NC}"
    echo "Install NVIDIA drivers: https://www.nvidia.com/Download/index.aspx"
else
    echo -e "${GREEN}✓ NVIDIA drivers installed${NC}"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
fi

# Check NVIDIA Container Toolkit
if ! docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
    echo -e "${YELLOW}⚠ NVIDIA Container Toolkit not properly configured${NC}"
    echo "Install: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
else
    echo -e "${GREEN}✓ NVIDIA Container Toolkit configured${NC}"
fi

echo ""
echo "📝 Setting up environment..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please edit .env with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/mongodb
mkdir -p data/redis
mkdir -p data/minio
echo -e "${GREEN}✓ Directories created${NC}"

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
if command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ npm not found. Skipping Node.js dependencies.${NC}"
    echo "Install Node.js: https://nodejs.org/"
fi

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
if command -v npm &> /dev/null; then
    npm run build
    echo -e "${GREEN}✓ TypeScript compiled${NC}"
fi

# Pull Docker images
echo ""
echo "🐳 Pulling Docker images..."
docker-compose pull
echo -e "${GREEN}✓ Docker images pulled${NC}"

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
fi

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is ready${NC}"
else
    echo -e "${RED}❌ MongoDB is not ready${NC}"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis is not ready${NC}"
fi

# Initialize database
echo ""
echo "🗄️  Initializing database..."
sleep 5
docker-compose exec -T postgres psql -U postgres -d ai_studio -f /app/src/database/schema.sql 2>/dev/null || {
    echo -e "${YELLOW}⚠ Database schema already exists or failed to create${NC}"
}

# Check API health
echo ""
echo "🔍 Checking API health..."
sleep 5
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠ API health check failed. Check logs: docker-compose logs api${NC}"
fi

# Check GPU service health
echo ""
echo "🎮 Checking GPU service health..."
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✓ GPU service is healthy${NC}"
else
    echo -e "${YELLOW}⚠ GPU service health check failed. Check logs: docker-compose logs gpu-service${NC}"
fi

# Display summary
echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Services running:"
echo "  • API Server: http://localhost:3000"
echo "  • GPU Service: http://localhost:8000"
echo "  • PostgreSQL: localhost:5432"
echo "  • MongoDB: localhost:27017"
echo "  • Redis: localhost:6379"
echo "  • MinIO: http://localhost:9000 (Console: http://localhost:9001)"
echo ""
echo "Useful commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart"
echo "  • Check GPU: docker-compose exec gpu-service nvidia-smi"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Test API: curl http://localhost:3000/health"
echo "  3. Read documentation in docs/"
echo ""
echo "Happy coding! 🎉"
