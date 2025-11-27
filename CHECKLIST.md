# Setup & Deployment Checklist

## ✅ Initial Setup

### Prerequisites
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] NVIDIA GPU drivers installed
- [ ] NVIDIA Container Toolkit installed
- [ ] 16GB+ RAM available
- [ ] 50GB+ disk space

### Installation
- [ ] Run `./setup.sh`
- [ ] Edit `.env` file
- [ ] Change `JWT_SECRET`
- [ ] Add Stripe keys (optional)
- [ ] Verify all services running

### Testing
- [ ] API health check passes
- [ ] GPU service health check passes
- [ ] Register test user
- [ ] Generate test image
- [ ] Check GPU access

## 🚀 Production Deployment

### Security
- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Review security headers

### Database
- [ ] Use managed database service
- [ ] Enable SSL connections
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Enable query logging
- [ ] Set up monitoring

### Storage
- [ ] Configure S3/MinIO
- [ ] Enable encryption at rest
- [ ] Set up lifecycle policies
- [ ] Configure CDN (optional)
- [ ] Enable access logging

### Monitoring
- [ ] Set up Prometheus
- [ ] Configure Grafana dashboards
- [ ] Enable error tracking
- [ ] Set up alerts
- [ ] Configure log aggregation

### Performance
- [ ] Optimize database queries
- [ ] Enable Redis caching
- [ ] Configure CDN
- [ ] Set up load balancer
- [ ] Test under load

### Backup & Recovery
- [ ] Database backup schedule
- [ ] Test restore procedure
- [ ] Document recovery steps
- [ ] Set up off-site backups

## 📝 Documentation
- [ ] Update API documentation
- [ ] Document custom changes
- [ ] Create runbooks
- [ ] Document troubleshooting steps
