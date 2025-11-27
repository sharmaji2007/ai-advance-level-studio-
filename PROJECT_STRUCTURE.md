# Project Structure

```
ai-creative-studio-backend/
├── README.md                          # Project overview and quick start
├── PROJECT_STRUCTURE.md               # This file
├── package.json                       # Node.js dependencies
├── tsconfig.json                      # TypeScript configuration
├── Dockerfile                         # API server Docker image
├── docker-compose.yml                 # Multi-container orchestration
├── .env.example                       # Environment variables template
├── setup.sh                           # Automated setup script
│
├── docs/                              # Documentation
│   ├── API.md                        # API endpoints documentation
│   ├── GPU_SERVICE.md                # GPU service guide
│   ├── DEPLOYMENT.md                 # Deployment instructions
│   └── ARCHITECTURE.md               # System architecture
│
├── src/                              # API Server (Node.js/TypeScript)
│   ├── server.ts                     # Main application entry point
│   │
│   ├── database/                     # Database layer
│   │   ├── connection.ts            # DB connection management
│   │   └── schema.sql               # PostgreSQL schema
│   │
│   ├── models/                       # Data models
│   │   └── Job.ts                   # MongoDB job metadata model
│   │
│   ├── routes/                       # API routes
│   │   ├── index.ts                 # Route aggregator
│   │   ├── auth.routes.ts           # Authentication endpoints
│   │   ├── job.routes.ts            # Job management endpoints
│   │   ├── user.routes.ts           # User management endpoints
│   │   ├── payment.routes.ts        # Payment processing endpoints
│   │   └── admin.routes.ts          # Admin endpoints
│   │
│   ├── controllers/                  # Business logic
│   │   └── job.controller.ts        # Job processing logic
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── errorHandler.ts         # Error handling
│   │   ├── upload.ts                # File upload handling
│   │   └── validation.ts            # Request validation
│   │
│   ├── validators/                   # Input validation schemas
│   │   └── job.validator.ts         # Job validation rules
│   │
│   ├── services/                     # Service layer
│   │   ├── credit.service.ts        # Credit management
│   │   └── storage.service.ts       # S3/MinIO operations
│   │
│   ├── queues/                       # Job queue management
│   │   └── index.ts                 # Bull queue configuration
│   │
│   └── utils/                        # Utility functions
│       └── logger.ts                 # Winston logger setup
│
├── gpu-service/                      # GPU Service (Python)
│   ├── main.py                       # FastAPI application
│   ├── worker.py                     # Job worker
│   ├── gpu_manager.py                # GPU memory management
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                    # GPU service Docker image
│   │
│   └── processors/                   # AI model processors
│       ├── image_generator.py        # Stable Diffusion image gen
│       ├── cloth_swap.py             # Virtual try-on
│       ├── influencer_creator.py     # AI influencer generation
│       ├── video_3d.py               # 3D video generation
│       ├── study_animation.py        # Educational animations
│       └── story_video.py            # Cinematic story videos
│
├── logs/                             # Application logs (gitignored)
│   ├── error.log
│   └── combined.log
│
└── data/                             # Persistent data (gitignored)
    ├── postgres/                     # PostgreSQL data
    ├── mongodb/                      # MongoDB data
    ├── redis/                        # Redis data
    └── minio/                        # MinIO/S3 data
```

## Key Files Explained

### Configuration Files

- **package.json**: Node.js project configuration, dependencies, and scripts
- **tsconfig.json**: TypeScript compiler configuration
- **docker-compose.yml**: Multi-container Docker application definition
- **.env.example**: Template for environment variables
- **setup.sh**: Automated setup and initialization script

### API Server (src/)

#### Core Files
- **server.ts**: Express application setup, middleware configuration, server initialization
- **database/connection.ts**: PostgreSQL and MongoDB connection management
- **database/schema.sql**: Database schema with tables for users, jobs, transactions

#### Routes
- **auth.routes.ts**: User registration, login, JWT token generation
- **job.routes.ts**: Job creation, status checking, result retrieval
- **user.routes.ts**: User profile, credits, transaction history
- **payment.routes.ts**: Stripe integration, credit purchases
- **admin.routes.ts**: Admin dashboard, statistics, GPU metrics

#### Controllers
- **job.controller.ts**: Job creation logic, credit validation, queue management

#### Middleware
- **auth.ts**: JWT token verification, user authentication
- **errorHandler.ts**: Centralized error handling
- **upload.ts**: Multer file upload configuration
- **validation.ts**: Joi schema validation

#### Services
- **credit.service.ts**: Credit balance management, transactions
- **storage.service.ts**: S3/MinIO file operations, signed URLs

### GPU Service (gpu-service/)

#### Core Files
- **main.py**: FastAPI application, health endpoints
- **worker.py**: Redis queue consumer, job dispatcher
- **gpu_manager.py**: VRAM management, model loading/unloading

#### Processors
Each processor handles a specific AI generation task:
- **image_generator.py**: Stable Diffusion XL for image generation
- **cloth_swap.py**: Virtual try-on using pose detection
- **influencer_creator.py**: Consistent face generation
- **video_3d.py**: 3D video from text prompts
- **study_animation.py**: Educational video generation
- **story_video.py**: Cinematic story videos with narration

## Data Flow

### 1. Job Creation
```
Client → API Route → Controller → Validator → Credit Check → 
Database Insert → Queue Add → Credit Deduct → Response
```

### 2. Job Processing
```
Queue → Worker → GPU Manager → Processor → Model Inference → 
Output Save → Storage Upload → Database Update → Notification
```

### 3. Result Retrieval
```
Client → API Route → Database Query → Storage Signed URL → Response
```

## Technology Stack by Layer

### Frontend (Not included, API only)
- React/Next.js (suggested)
- TailwindCSS (provided in HTML)

### API Layer
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT
- **Validation**: Joi
- **Queue**: Bull (Redis-based)
- **Logging**: Winston

### GPU Layer
- **Runtime**: Python 3.10
- **Framework**: FastAPI
- **AI Framework**: PyTorch
- **Image Gen**: Diffusers (Stable Diffusion)
- **Video**: OpenCV, MoviePy
- **Audio**: Coqui TTS

### Data Layer
- **Relational DB**: PostgreSQL 16
- **Document DB**: MongoDB 7
- **Cache/Queue**: Redis 7
- **Storage**: MinIO (S3-compatible)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes
- **Monitoring**: Prometheus + Grafana
- **Payment**: Stripe

## Environment Variables

### Required
- `JWT_SECRET`: Secret key for JWT tokens
- `POSTGRES_PASSWORD`: Database password
- `STRIPE_SECRET_KEY`: Stripe API key
- `S3_ACCESS_KEY`: Storage access key
- `S3_SECRET_KEY`: Storage secret key

### Optional
- `GPU_MAX_CONCURRENT_JOBS`: Max parallel GPU jobs (default: 2)
- `GPU_VRAM_LIMIT`: VRAM limit in MB (default: 7500)
- `RATE_LIMIT_MAX_REQUESTS`: API rate limit (default: 100)

## Development Workflow

### 1. Setup
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Development
```bash
# API development
npm run dev

# GPU service development
cd gpu-service
python main.py
```

### 3. Testing
```bash
# Run tests
npm test

# Test API endpoint
curl http://localhost:3000/health
```

### 4. Deployment
```bash
# Build images
docker-compose build

# Deploy
docker-compose up -d
```

## Scaling Considerations

### Horizontal Scaling
- API: Stateless, can scale infinitely
- GPU Workers: Add more GPU instances
- Databases: Read replicas, sharding

### Vertical Scaling
- GPU: Upgrade to RTX 3060/4070/4090
- Database: Larger instance sizes
- Redis: Cluster mode

## Security Features

- JWT authentication
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Helmet.js security headers
- Encrypted storage
- Secure credential management

## Monitoring & Logging

### Logs
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Access logs: Nginx/API gateway

### Metrics
- API response times
- Job processing times
- GPU utilization
- Queue depth
- Error rates

## Backup Strategy

- Database: Daily automated backups
- Storage: S3 versioning enabled
- Configuration: Git version control
- Logs: Rotated and archived

## Cost Optimization

- Spot instances for GPU workers
- S3 lifecycle policies
- Database connection pooling
- Efficient caching
- Auto-scaling based on load
