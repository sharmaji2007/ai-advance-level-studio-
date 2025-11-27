# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web App, Mobile App, API Clients)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                 │
│  (Nginx, ALB, Rate Limiting, SSL/TLS)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Server (Node.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Service │  │ Job Service  │  │ User Service │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Payment Svc   │  │Storage Svc   │  │Credit Svc    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────┬──────────────────────────────────┘
             │                │
             ▼                ▼
┌────────────────────┐  ┌────────────────────┐
│   PostgreSQL       │  │   MongoDB          │
│  (User, Jobs,      │  │  (Job Metadata,    │
│   Transactions)    │  │   File Info)       │
└────────────────────┘  └────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Redis (Queue & Cache)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Job Queue    │  │ Session Cache│  │ Result Cache │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GPU Worker Service (Python)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    GPU Manager                            │  │
│  │  (VRAM Management, Model Loading, Optimization)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Image Gen     │  │Cloth Swap    │  │Influencer    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │3D Video      │  │Study Anim    │  │Story Video   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Storage (MinIO / S3)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Input Files  │  │ Output Files │  │ Temp Files   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Job Creation Flow
```
User → API → Validate → Check Credits → Create Job Record → 
Add to Queue → Deduct Credits → Return Job ID
```

### 2. Job Processing Flow
```
Queue → Worker → Load Model → Process → Save Output → 
Update Job Status → Upload to Storage → Notify User
```

### 3. Result Retrieval Flow
```
User → API → Check Job Status → Generate Signed URL → 
Return Download Link
```

## Component Details

### API Server (Node.js + Express)
**Responsibilities:**
- Request validation
- Authentication & authorization
- Credit management
- Job orchestration
- Payment processing
- User management

**Technology:**
- TypeScript
- Express.js
- JWT authentication
- Joi validation
- Bull queue

### GPU Service (Python + FastAPI)
**Responsibilities:**
- AI model inference
- GPU memory management
- Image/video generation
- Model optimization
- Result processing

**Technology:**
- Python 3.10+
- FastAPI
- PyTorch
- Diffusers
- OpenCV

### Databases

#### PostgreSQL
**Schema:**
- users (authentication, credits, subscriptions)
- jobs (job tracking, status, results)
- transactions (payment history)
- api_keys (API access)
- gpu_stats (performance metrics)

#### MongoDB
**Collections:**
- job_metadata (detailed job info, files, processing steps)
- Used for flexible schema and large documents

#### Redis
**Usage:**
- Job queue (Bull)
- Session cache
- Rate limiting
- Result caching

### Storage (MinIO/S3)
**Structure:**
```
/inputs/{userId}/{jobId}/
/outputs/{userId}/{jobId}/
/references/{userId}/
/temp/{jobId}/
```

## Scalability

### Horizontal Scaling
1. **API Servers**: Load balanced, stateless
2. **GPU Workers**: Multiple instances with job distribution
3. **Databases**: Read replicas, sharding
4. **Storage**: Distributed object storage

### Vertical Scaling
1. **GPU Upgrade**: 3050 → 3060 → 4070 → 4090
2. **Database**: Larger instances
3. **Redis**: Cluster mode

## Security Layers

### 1. Network Security
- VPC isolation
- Security groups
- Private subnets for databases
- Public subnet for API gateway

### 2. Application Security
- JWT authentication
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

### 3. Data Security
- Encryption at rest (S3, RDS)
- Encryption in transit (TLS)
- Secure credential storage
- Regular backups

## Monitoring & Observability

### Metrics
- API response times
- Job processing times
- GPU utilization
- VRAM usage
- Queue depth
- Error rates
- Credit usage

### Logging
- Application logs (Winston)
- Access logs (Nginx)
- Error logs
- Audit logs

### Alerting
- High error rate
- GPU OOM
- Queue backup
- Database connection issues
- Low disk space

## Disaster Recovery

### Backup Strategy
1. **Database**: Daily automated backups
2. **Storage**: S3 versioning enabled
3. **Configuration**: Version controlled

### Recovery Plan
1. **RTO**: 4 hours
2. **RPO**: 24 hours
3. **Failover**: Automated for critical services

## Performance Optimization

### API Layer
- Response caching
- Connection pooling
- Async processing
- CDN for static assets

### GPU Layer
- Model caching
- Batch processing
- FP16 precision
- Memory optimization

### Database Layer
- Query optimization
- Proper indexing
- Connection pooling
- Read replicas

## Cost Optimization

### Compute
- Spot instances for GPU workers
- Auto-scaling based on queue depth
- Reserved instances for base load

### Storage
- S3 lifecycle policies
- Intelligent tiering
- Compression

### Database
- Right-sizing instances
- Automated backups retention
- Query optimization

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API | Node.js + Express | REST API |
| GPU Service | Python + FastAPI | AI Processing |
| Queue | Redis + Bull | Job Queue |
| Database | PostgreSQL | Relational Data |
| NoSQL | MongoDB | Flexible Schema |
| Cache | Redis | Caching |
| Storage | MinIO/S3 | Object Storage |
| Container | Docker | Containerization |
| Orchestration | Docker Compose / K8s | Deployment |
| Monitoring | Prometheus + Grafana | Metrics |
| Logging | Winston | Application Logs |
| Payment | Stripe | Payment Processing |

## GPU Optimization for NVIDIA 3050

### Memory Budget (8GB VRAM)
```
System Reserved: 500MB
Model Loading: 3000-5000MB (depending on model)
Inference: 2000-3000MB
Buffer: 500MB
```

### Optimization Techniques
1. **FP16 Precision**: 50% memory reduction
2. **Attention Slicing**: 30% memory reduction
3. **VAE Slicing**: 20% memory reduction
4. **xFormers**: 15% speed improvement
5. **Model Quantization**: 40% memory reduction (optional)

### Concurrent Jobs
- Maximum: 2 jobs (light models)
- Recommended: 1 job at a time
- Queue depth: Unlimited (Redis)

## Future Enhancements

### Phase 2
- WebSocket for real-time updates
- Multi-GPU support
- Advanced caching strategies
- GraphQL API

### Phase 3
- Microservices architecture
- Kubernetes deployment
- Multi-region support
- Advanced analytics

### Phase 4
- Custom model training
- API marketplace
- White-label solution
- Enterprise features
