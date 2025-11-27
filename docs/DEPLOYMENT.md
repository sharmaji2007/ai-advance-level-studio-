# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- NVIDIA GPU with CUDA support
- NVIDIA Container Toolkit
- Node.js 20+ (for local development)
- Python 3.10+ (for GPU service)

## Quick Start (Development)

### 1. Clone and Setup
```bash
git clone <repository>
cd ai-creative-studio-backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Install NVIDIA Container Toolkit
```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify GPU access
docker-compose exec gpu-service nvidia-smi
```

### 4. Initialize Database
```bash
# Run migrations
docker-compose exec api npm run migrate

# Or manually
docker-compose exec postgres psql -U postgres -d ai_studio -f /app/src/database/schema.sql
```

### 5. Test API
```bash
curl http://localhost:3000/health
curl http://localhost:8000/health
```

## Production Deployment

### Option 1: Docker Compose (Single Server)

1. **Update docker-compose.yml for production**:
```yaml
services:
  api:
    environment:
      NODE_ENV: production
    restart: always
    
  gpu-service:
    restart: always
```

2. **Use production database**:
```bash
# Update .env
POSTGRES_HOST=your-db-host
MONGODB_URI=mongodb://your-mongo-host
REDIS_HOST=your-redis-host
```

3. **Setup SSL/TLS**:
```bash
# Use nginx as reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes

1. **Create namespace**:
```bash
kubectl create namespace ai-studio
```

2. **Deploy PostgreSQL**:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: ai_studio
```

3. **Deploy API**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: your-registry/ai-studio-api:latest
        ports:
        - containerPort: 3000
```

4. **Deploy GPU Service**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gpu-service
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: gpu-service
        image: your-registry/ai-studio-gpu:latest
        resources:
          limits:
            nvidia.com/gpu: 1
```

### Option 3: Cloud Deployment (AWS)

#### Architecture
```
ALB → ECS (API) → RDS (PostgreSQL)
                → DocumentDB (MongoDB)
                → ElastiCache (Redis)
                → S3 (Storage)
                
EC2 (GPU) → SQS → Lambda (Orchestration)
```

#### Setup

1. **Create RDS Instance**:
```bash
aws rds create-db-instance \
  --db-instance-identifier ai-studio-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 100
```

2. **Create ElastiCache**:
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id ai-studio-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1
```

3. **Create S3 Bucket**:
```bash
aws s3 mb s3://ai-studio-media
aws s3api put-bucket-cors --bucket ai-studio-media --cors-configuration file://cors.json
```

4. **Deploy API to ECS**:
```bash
# Build and push image
docker build -t ai-studio-api .
docker tag ai-studio-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ai-studio-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ai-studio-api:latest

# Create ECS task definition and service
aws ecs create-service --cli-input-json file://ecs-service.json
```

5. **Deploy GPU Service to EC2**:
```bash
# Launch g4dn.xlarge instance with Deep Learning AMI
# Install Docker and NVIDIA Container Toolkit
# Run GPU service container
```

## Environment Configuration

### Production .env
```bash
NODE_ENV=production
PORT=3000

# Database (use managed services)
POSTGRES_HOST=your-rds-endpoint.amazonaws.com
MONGODB_URI=mongodb://your-documentdb-endpoint
REDIS_HOST=your-elasticache-endpoint

# Storage (use S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=ai-studio-media

# Security
JWT_SECRET=<generate-strong-secret>
STRIPE_SECRET_KEY=sk_live_...

# GPU Service
GPU_SERVICE_URL=http://gpu-service:8000
```

## Monitoring & Logging

### 1. Setup Prometheus
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']
  
  - job_name: 'gpu-service'
    static_configs:
      - targets: ['gpu-service:8000']
```

### 2. Setup Grafana
```bash
docker run -d -p 3001:3000 grafana/grafana
```

### 3. Application Logs
```bash
# View logs
docker-compose logs -f api
docker-compose logs -f gpu-service

# Export to CloudWatch (AWS)
aws logs create-log-group --log-group-name /ai-studio/api
```

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL
docker-compose exec postgres pg_dump -U postgres ai_studio > backup.sql

# MongoDB
docker-compose exec mongodb mongodump --out /backup

# Automated backups
0 2 * * * /usr/local/bin/backup-db.sh
```

### S3 Backup
```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ai-studio-media \
  --versioning-configuration Status=Enabled

# Lifecycle policy for old versions
aws s3api put-bucket-lifecycle-configuration \
  --bucket ai-studio-media \
  --lifecycle-configuration file://lifecycle.json
```

## Scaling

### Horizontal Scaling

1. **API Servers**:
```bash
docker-compose up -d --scale api=3
```

2. **GPU Workers**:
- Add more GPU instances
- Use load balancer for job distribution
- Implement job queue sharding

### Vertical Scaling

1. **Upgrade GPU**:
- RTX 3060 (12GB) - 50% more VRAM
- RTX 4070 (12GB) - Better performance
- RTX 4090 (24GB) - 3x capacity

2. **Database**:
- Increase RDS instance size
- Enable read replicas
- Use connection pooling

## Security

### 1. API Security
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### 2. Database Security
- Use SSL connections
- Rotate credentials regularly
- Implement least privilege access
- Enable audit logging

### 3. Storage Security
- Enable S3 encryption at rest
- Use signed URLs for downloads
- Implement bucket policies
- Enable access logging

## Performance Optimization

### 1. Caching
```typescript
// Redis caching
import Redis from 'redis';

const cache = Redis.createClient();

// Cache job results
await cache.setex(`job:${jobId}`, 3600, JSON.stringify(result));
```

### 2. CDN
```bash
# Use CloudFront for S3
aws cloudfront create-distribution \
  --origin-domain-name ai-studio-media.s3.amazonaws.com
```

### 3. Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM jobs WHERE user_id = 'xxx';
```

## Troubleshooting

### Common Issues

1. **GPU Service Not Starting**:
```bash
# Check NVIDIA drivers
nvidia-smi

# Check Docker GPU access
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

2. **Database Connection Issues**:
```bash
# Test connection
docker-compose exec api node -e "require('./dist/database/connection').connectDatabases()"
```

3. **High Memory Usage**:
```bash
# Monitor containers
docker stats

# Restart services
docker-compose restart
```

## Maintenance

### Regular Tasks

1. **Weekly**:
- Review error logs
- Check disk space
- Monitor GPU utilization
- Review failed jobs

2. **Monthly**:
- Update dependencies
- Rotate credentials
- Clean old job data
- Review costs

3. **Quarterly**:
- Security audit
- Performance review
- Capacity planning
- Disaster recovery test
