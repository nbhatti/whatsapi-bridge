# WhatsApp API Bridge - Deployment & Rollback Procedures

This document contains internal deployment procedures, rollback strategies, and maintenance commands for the WhatsApp API Bridge production environment.

## Production Deployment

### Prerequisites

1. Ensure you have Docker and docker-compose installed
2. Set required environment variables:
   ```bash
   export API_KEY="your-production-api-key"
   export REDIS_PASSWORD="your-secure-redis-password"
   export POSTGRES_PASSWORD="your-database-password"  # if using PostgreSQL
   ```

3. Create deployment directory:
   ```bash
   sudo mkdir -p /opt/whatsapi-bridge/{logs,config,data/{redis,postgres}}
   sudo chown -R $USER:$USER /opt/whatsapi-bridge
   ```

### Image Tagging Strategy

All deployment images are tagged with the git SHA for version tracking:

```bash
# Build and tag image with current git SHA
./scripts/deploy-production.sh build

# Build with specific git SHA
./scripts/deploy-production.sh build --git-sha=abc123

# Current SHA: d27a660
docker build -t whatsapi-bridge:d27a660 -t whatsapi-bridge:latest .
```

### Deployment Commands

#### Standard Deployment (with Redis)
```bash
# Deploy with current git SHA
./scripts/deploy-production.sh deploy

# Deploy with specific git SHA
./scripts/deploy-production.sh deploy --git-sha=abc123

# Deploy with Redis disabled
./scripts/deploy-production.sh deploy --redis-enabled=false
```

#### Manual Docker Compose Deployment
```bash
# Build and tag image
git_sha=$(git rev-parse --short HEAD)
docker build -t whatsapi-bridge:$git_sha .

# Deploy using docker-compose
export REDIS_ENABLED=true
export NODE_ENV=production
docker-compose -f docker-compose.prod.yml up -d
```

## Rollback Procedures

### Automatic Rollback

The deployment system maintains image tags for easy rollback:

```bash
# Quick rollback - disables Redis caching
./scripts/deploy-production.sh rollback

# Rollback to specific version
./scripts/deploy-production.sh rollback --previous-tag=whatsapi-bridge:abc123
```

### Manual Rollback

#### Method 1: Using Previous Tag
```bash
# Check previous deployment
cat /opt/whatsapi-bridge/previous-image.txt

# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Start with previous image
export OLD_TAG="whatsapi-bridge:abc123"  # previous tag
docker run -d --name whatsapp-api-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e API_KEY="$API_KEY" \
  -e REDIS_ENABLED=false \
  --network whatsapp-prod-network \
  $OLD_TAG
```

#### Method 2: Docker Compose Rollback
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down --timeout 30

# Update image tag in compose file (or use environment variable)
export DEPLOYMENT_IMAGE="whatsapi-bridge:abc123"
sed -i.bak "s|image: whatsapi-bridge:latest|image: $DEPLOYMENT_IMAGE|" docker-compose.prod.yml

# Start with previous version
docker-compose -f docker-compose.prod.yml up -d

# Restore compose file
mv docker-compose.prod.yml.bak docker-compose.prod.yml
```

### Emergency Redis Disabling

For quick troubleshooting when Redis is causing issues:

```bash
# Method 1: Using deployment script
./scripts/deploy-production.sh deploy --redis-enabled=false

# Method 2: Direct environment variable update
docker-compose -f docker-compose.prod.yml down
export REDIS_ENABLED=false
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Status

### Deployment Status
```bash
# Check deployment status
./scripts/deploy-production.sh status

# Check container health
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml exec whatsapp-api curl -f http://localhost:3000/health

# Check Redis status (when enabled)
docker-compose -f docker-compose.prod.yml exec redis-prod redis-cli ping
docker-compose -f docker-compose.prod.yml exec redis-prod redis-cli info memory
```

### Log Management
```bash
# Application logs
./scripts/deploy-production.sh logs

# Follow logs
./scripts/deploy-production.sh logs --follow

# Specific service logs
docker-compose -f docker-compose.prod.yml logs whatsapp-api
docker-compose -f docker-compose.prod.yml logs redis-prod

# Container logs with timestamps
docker-compose -f docker-compose.prod.yml logs -f -t whatsapp-api
```

### Health Checks
```bash
# Application health
curl -H "x-api-key: $API_KEY" http://localhost:3000/health

# Redis health (if enabled)
docker exec redis-prod redis-cli ping

# Container status
docker ps --filter name=whatsapp
docker stats --no-stream whatsapp-api-prod redis-prod
```

## Maintenance Procedures

### Image Cleanup
```bash
# Remove old images (keep last 5 versions)
docker images whatsapi-bridge --format "table {{.Tag}}\t{{.CreatedAt}}" | \
  tail -n +6 | awk '{print $1}' | \
  xargs -r docker rmi whatsapi-bridge:

# Clean up dangling images
docker image prune -f
```

### Data Backup
```bash
# Backup Redis data (if enabled)
docker exec redis-prod redis-cli BGSAVE
cp -r /opt/whatsapi-bridge/data/redis /opt/whatsapi-bridge/backups/redis-$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL data (if using database)
docker exec postgres-prod pg_dump -U whatsapp whatsapp > /opt/whatsapi-bridge/backups/postgres-$(date +%Y%m%d_%H%M%S).sql
```

### Environment Updates
```bash
# Update environment file
vim /opt/whatsapi-bridge/.env.production

# Restart services to apply changes
docker-compose -f docker-compose.prod.yml restart
```

## Troubleshooting

### Common Issues

#### Redis Connection Problems
```bash
# Disable Redis quickly
export REDIS_ENABLED=false
docker-compose -f docker-compose.prod.yml up -d whatsapp-api

# Check Redis container
docker logs redis-prod
docker exec redis-prod redis-cli info server
```

#### Application Startup Issues
```bash
# Check application logs
docker logs whatsapp-api-prod --tail=50

# Check environment variables
docker exec whatsapp-api-prod env | grep -E "(NODE_ENV|API_KEY|REDIS)"

# Test health endpoint
docker exec whatsapp-api-prod curl -f http://localhost:3000/health
```

#### Port Conflicts
```bash
# Check port usage
netstat -tlnp | grep :3000
lsof -i :3000

# Use alternative ports
sed -i 's/3000:3000/3001:3000/' docker-compose.prod.yml
```

### Recovery Procedures

#### Complete System Recovery
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down --volumes

# Clean up containers and networks
docker system prune -f

# Restore from last known good configuration
./scripts/deploy-production.sh rollback --previous-tag=whatsapi-bridge:abc123

# Verify deployment
./scripts/deploy-production.sh status
```

#### Data Recovery
```bash
# Restore Redis data
docker-compose -f docker-compose.prod.yml stop redis-prod
cp -r /opt/whatsapi-bridge/backups/redis-20231201_120000/* /opt/whatsapi-bridge/data/redis/
docker-compose -f docker-compose.prod.yml start redis-prod
```

## Security Considerations

- Redis is bound to localhost only (`127.0.0.1:6379`)
- PostgreSQL is bound to localhost only (`127.0.0.1:5432`)
- All passwords must be set via environment variables
- API keys are required for all production requests
- Container logs are size-limited to prevent disk exhaustion

## File Locations

- Production compose file: `docker-compose.prod.yml`
- Deployment script: `scripts/deploy-production.sh`
- Environment file: `/opt/whatsapi-bridge/.env.production`
- Application logs: `/opt/whatsapi-bridge/logs/`
- Redis data: `/opt/whatsapi-bridge/data/redis/`
- PostgreSQL data: `/opt/whatsapi-bridge/data/postgres/`
- Deployment info: `/opt/whatsapi-bridge/deployment-info.txt`
- Current image tag: `/opt/whatsapi-bridge/current-image.txt`
- Previous image tag: `/opt/whatsapi-bridge/previous-image.txt`

## Version History

The deployment system automatically tracks:
- Git SHA of deployed version
- Deployment timestamp
- Redis enabled/disabled status
- Previous version for rollback

Check deployment history:
```bash
cat /opt/whatsapi-bridge/deployment-info.txt
```
