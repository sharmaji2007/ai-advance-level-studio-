# Quick Start Guide

Get your AI Creative Studio backend running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- NVIDIA GPU with CUDA support (for GPU features)
- 16GB RAM minimum
- 50GB free disk space

## Installation

### 1. Clone & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-creative-studio-backend

# Run automated setup
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check prerequisites
- ✅ Create environment file
- ✅ Install dependencies
- ✅ Pull Docker images
- ✅ Start all services
- ✅ Initialize database

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Required: Generate a strong JWT secret
JWT_SECRET=your_super_secret_key_change_this

# Optional: Add Stripe keys for payments
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### 3. Verify Installation

```bash
# Check all services are running
docker-compose ps

# Test API
curl http://localhost:3000/health

# Test GPU service
curl http://localhost:8000/health

# Check GPU access
docker-compose exec gpu-service nvidia-smi
```

## First API Call

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "fullName": "Test User",
    "credits": 50
  }
}
```

### 2. Generate an Image

```bash
# Save your token
TOKEN="your_jwt_token_from_above"

# Create image generation job
curl -X POST http://localhost:3000/api/v1/jobs/image-generation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "style": "cinematic",
    "width": 1024,
    "height": 1024
  }'
```

Response:
```json
{
  "jobId": "uuid",
  "status": "pending",
  "creditsUsed": 2,
  "message": "Job queued for processing"
}
```

### 3. Check Job Status

```bash
JOB_ID="your_job_id_from_above"

curl http://localhost:3000/api/v1/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Download Result

Once status is "completed":

```bash
curl http://localhost:3000/api/v1/jobs/$JOB_ID/download \
  -H "Authorization: Bearer $TOKEN"
```

## Available Services

| Service | URL | Purpose |
|---------|-----|---------|
| API Server | http://localhost:3000 | REST API |
| GPU Service | http://localhost:8000 | AI Processing |
| MinIO Console | http://localhost:9001 | Storage Management |
| PostgreSQL | localhost:5432 | Database |
| MongoDB | localhost:27017 | Document Store |
| Redis | localhost:6379 | Queue & Cache |

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f gpu-service
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Stop Services
```bash
docker-compose down
```

### Start Services
```bash
docker-compose up -d
```

### Check GPU Usage
```bash
docker-compose exec gpu-service nvidia-smi
```

### Access Database
```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres -d ai_studio

# MongoDB
docker-compose exec mongodb mongosh
```

## Testing All Features

### 1. Image Generation
```bash
curl -X POST http://localhost:3000/api/v1/jobs/image-generation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city at night",
    "style": "cinematic"
  }'
```

### 2. Cloth Swap
```bash
curl -X POST http://localhost:3000/api/v1/jobs/cloth-swap \
  -H "Authorization: Bearer $TOKEN" \
  -F "person=@person.jpg" \
  -F "cloth=@cloth.jpg" \
  -F "category=formal"
```

### 3. AI Influencer
```bash
curl -X POST http://localhost:3000/api/v1/jobs/influencer-creation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "female",
    "ethnicity": "asian",
    "ageRange": "26-35",
    "style": "professional",
    "poses": 5
  }'
```

### 4. 3D Video
```bash
curl -X POST http://localhost:3000/api/v1/jobs/3d-video \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A dragon flying over mountains",
    "duration": 30,
    "cameraMovement": "orbit"
  }'
```

### 5. Study Animation
```bash
curl -X POST http://localhost:3000/api/v1/jobs/study-animation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Photosynthesis",
    "script": "Plants convert sunlight into energy through photosynthesis...",
    "subject": "science",
    "animationStyle": "3d-cgi"
  }'
```

### 6. Story Video
```bash
curl -X POST http://localhost:3000/api/v1/jobs/story-video \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Once upon a time in a magical forest...",
    "visualStyle": "pixar",
    "voiceStyle": "male-warm",
    "backgroundMusic": "epic"
  }'
```

## Troubleshooting

### Services Won't Start
```bash
# Check Docker
docker --version
docker-compose --version

# Check logs
docker-compose logs

# Restart Docker daemon
sudo systemctl restart docker
```

### GPU Not Detected
```bash
# Check NVIDIA drivers
nvidia-smi

# Check Docker GPU access
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Install NVIDIA Container Toolkit
# See: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html
```

### Database Connection Error
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# Recreate database
docker-compose down -v
docker-compose up -d
./setup.sh
```

### Out of Memory
```bash
# Check system resources
docker stats

# Reduce concurrent GPU jobs in .env
GPU_MAX_CONCURRENT_JOBS=1
```

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :3000

# Change port in .env
PORT=3001
```

## Next Steps

1. **Read Documentation**
   - [API Documentation](docs/API.md)
   - [GPU Service Guide](docs/GPU_SERVICE.md)
   - [Deployment Guide](docs/DEPLOYMENT.md)
   - [Architecture Overview](docs/ARCHITECTURE.md)

2. **Customize Configuration**
   - Edit `.env` for your needs
   - Configure payment gateway
   - Set up monitoring

3. **Deploy to Production**
   - Follow [Deployment Guide](docs/DEPLOYMENT.md)
   - Set up SSL/TLS
   - Configure backups
   - Enable monitoring

4. **Integrate Frontend**
   - Use provided HTML template
   - Build custom frontend
   - Mobile app integration

## Support

- 📖 Documentation: `docs/` folder
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

## Performance Tips

### For NVIDIA 3050 (8GB VRAM)

1. **Limit concurrent jobs**: Set `GPU_MAX_CONCURRENT_JOBS=1`
2. **Use FP16 models**: Already configured
3. **Enable optimizations**: Already enabled
4. **Monitor VRAM**: `docker-compose exec gpu-service nvidia-smi`

### For Better Performance

1. **Upgrade GPU**: RTX 3060 (12GB) or RTX 4070 (12GB)
2. **Add more RAM**: 32GB recommended
3. **Use SSD**: For faster model loading
4. **Scale horizontally**: Add more GPU workers

## Credits & Pricing

### Free Tier
- 50 credits on signup
- Test all features

### Credit Costs
- Image Generation: 2 credits
- Cloth Swap: 3 credits
- AI Influencer: 5 credits
- 3D Video: 8 credits
- Study Animation: 5 credits
- Story Video: 10 credits

### Purchase Credits
```bash
# Create checkout session
curl -X POST http://localhost:3000/api/v1/payments/create-checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"package": "pro"}'
```

## Development Mode

### API Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build
```

### GPU Service Development
```bash
cd gpu-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
python main.py
```

## Production Checklist

- [ ] Change JWT_SECRET
- [ ] Configure Stripe keys
- [ ] Set up SSL/TLS
- [ ] Configure backups
- [ ] Enable monitoring
- [ ] Set up logging
- [ ] Configure rate limiting
- [ ] Review security settings
- [ ] Test disaster recovery
- [ ] Document custom changes

---

**Ready to create amazing AI-powered media! 🚀**
