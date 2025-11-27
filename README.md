# 🎨 AI Creative Studio - Complete Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10-blue.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![GPU](https://img.shields.io/badge/GPU-RTX%203050-green.svg)](https://www.nvidia.com/)

> **Production-ready backend for AI-powered media generation platform**

Generate stunning AI content with 6 powerful features optimized for NVIDIA RTX 3050 (8GB VRAM).

## ✨ Features

| Feature | Description | Credits | Time |
|---------|-------------|---------|------|
| 🎨 **AI Image Generation** | Stable Diffusion XL image creation | 2 | ~15s |
| 👔 **Cloth Swap Engine** | Virtual try-on technology | 3 | ~10s |
| 👤 **AI Influencer** | Consistent face generation | 5 | ~60s |
| 🎬 **3D Video** | Text-to-3D video generation | 8 | ~120s |
| 📚 **Study Animation** | Educational video creation | 5 | ~180s |
| 🎭 **Story Video** | Cinematic 3-minute videos | 10 | ~300s |

## 🚀 Quick Start

### ⚡ One-Command Deployment (FREE!)
```bash
# Complete free deployment to cloud
./deploy-free-complete.sh
```

**Or for local development:**
```bash
chmod +x setup.sh && ./setup.sh
```

### 🆓 Free Cloud Deployment Options

**Option 1: Complete Free Setup (Recommended)**
```bash
./deploy-free-complete.sh  # Linux/Mac
.\deploy.ps1               # Windows
```
- Railway.app (API) - Free
- MongoDB Atlas - Free
- Upstash Redis - Free
- Cloudflare R2 - Free
- Your GPU (Local) - Free
- **Total: $0/month**

**Option 2: Railway Only**
```bash
./deploy-railway.sh
```

**Option 3: Render.com**
```bash
./deploy-render.sh
```

See [DEPLOY_NOW.md](DEPLOY_NOW.md) for detailed deployment guide.

### Manual Local Setup
```bash
# 1. Clone repository
git clone https://github.com/sharmaji2007/ai-advance-level-studio-.git
cd ai-advance-level-studio-

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start services
docker-compose up -d

# 4. Verify
curl http://localhost:3000/health
```

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────┐
│  API Server (Node.js + TypeScript)      │
│  • Authentication (JWT)                  │
│  • Job Management                        │
│  • Credit System                         │
│  • Payment (Stripe)                      │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│  Queue System (Redis + Bull)            │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│  GPU Service (Python + FastAPI)         │
│  • 6 AI Processors                       │
│  • GPU Memory Management                 │
│  • Model Optimization                    │
└──────┬──────────────────────────────────┘
       │
┌──────▼──────────────────────────────────┐
│  Storage (MinIO/S3)                     │
└─────────────────────────────────────────┘
```

## 🎯 Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Authentication**: JWT
- **Validation**: Joi
- **Queue**: Bull (Redis)
- **Logging**: Winston

### GPU Service
- **Runtime**: Python 3.10
- **Framework**: FastAPI
- **AI**: PyTorch + Diffusers
- **Video**: OpenCV + MoviePy
- **Audio**: Coqui TTS

### Data Layer
- **Relational**: PostgreSQL 16
- **Document**: MongoDB 7
- **Cache/Queue**: Redis 7
- **Storage**: MinIO (S3-compatible)

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Payment**: Stripe
- **Monitoring**: Prometheus + Grafana (ready)

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Get running in 5 minutes |
| [FEATURES.md](FEATURES.md) | Complete feature documentation |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Codebase structure |
| [TESTING.md](TESTING.md) | Testing guide |
| [docs/API.md](docs/API.md) | API reference |
| [docs/GPU_SERVICE.md](docs/GPU_SERVICE.md) | GPU optimization |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |

## 🎮 GPU Optimization

Specifically optimized for **NVIDIA RTX 3050 (8GB VRAM)**:

- ✅ **FP16 Precision** - 50% memory reduction
- ✅ **Attention Slicing** - 30% memory reduction
- ✅ **VAE Slicing** - 20% memory reduction
- ✅ **xFormers** - 15% speed improvement
- ✅ **Dynamic Loading** - Load models only when needed
- ✅ **Smart Caching** - Automatic memory cleanup

### VRAM Budget
```
System Reserved:  500MB
Model Loading:    3000-5000MB
Inference:        2000-3000MB
Buffer:           500MB
```

## 💳 Credit System

### Free Tier
- 50 credits on signup
- Test all features

### Pricing
| Package | Credits | Price |
|---------|---------|-------|
| Starter | 100 | $29 |
| Pro | 500 | $79 |
| Enterprise | 2000 | $199 |

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Helmet.js security headers

## 📊 API Example

### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

### Generate Image
```bash
curl -X POST http://localhost:3000/api/v1/jobs/image-generation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "style": "cinematic",
    "width": 1024,
    "height": 1024
  }'
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# View logs
docker-compose logs -f
```

## 🚢 Deployment

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Cloud Platforms
- AWS: ECS + RDS + ElastiCache + S3
- GCP: GKE + Cloud SQL + Memorystore + Cloud Storage
- Azure: AKS + Azure Database + Redis Cache + Blob Storage

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 📈 Performance

### Expected Processing Times (RTX 3050)
- Image Generation (1024x1024): 15-20s
- Cloth Swap: 10-15s
- AI Influencer (5 poses): 60-90s
- 3D Video (30s): 120-180s
- Study Animation (60s): 180-240s
- Story Video (180s): 300-420s

### Scalability
- **Horizontal**: Add more API servers and GPU workers
- **Vertical**: Upgrade to RTX 3060/4070/4090
- **Concurrent Jobs**: 1-2 on RTX 3050, more on better GPUs

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Stable Diffusion by Stability AI
- FastAPI by Sebastián Ramírez
- Bull Queue by OptimalBits
- All open-source contributors

## 📞 Support

- 📖 Documentation: See `docs/` folder
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Email: support@example.com

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ for developers who want to create amazing AI-powered applications!**

🚀 **Ready to generate stunning AI content!**
