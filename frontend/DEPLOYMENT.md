# Deployment Guide

This document outlines the deployment setup for the WhatsAPI Bridge Web frontend application.

## 🐳 Docker Production Deployment

### Multi-Stage Dockerfile

The application uses a multi-stage Dockerfile optimized for production:

1. **Dependencies Stage**: Installs production dependencies
2. **Builder Stage**: Builds the Next.js application with Prisma client generation  
3. **Runner Stage**: Minimal Alpine image with the built application

### Building the Production Image

```bash
# Build production image
docker build -t whatsapi-bridge-web:latest .

# Run production container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e NEXTAUTH_SECRET="your-nextauth-secret" \
  whatsapi-bridge-web:latest
```

### Development Image

For local development with hot-reload:

```bash
# Build and run development container
docker build -f Dockerfile.dev -t whatsapi-bridge-web:dev .
docker run -p 4000:4000 -v $(pwd):/app whatsapi-bridge-web:dev
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

- **Lint & Test**: ESLint, Prettier, unit tests, API tests
- **Prisma Operations**: Client generation and database migrations
- **E2E Testing**: Cypress tests with real database
- **Docker Build**: Multi-stage production builds
- **Security Scanning**: Trivy vulnerability scanning

### Image Tagging Strategy

Images are tagged as:
- `whatsapi-bridge-web:${GITHUB_SHA}` - Commit-specific tag
- `whatsapi-bridge-web:latest` - Latest stable release

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret-key
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## 🌐 Preview Deployments

### Vercel Integration

Automatic preview deployments on pull requests using Vercel:

1. **Setup**: Connect repository to Vercel project
2. **Configuration**: Set environment variables in Vercel dashboard
3. **Secrets**: Add GitHub secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Netlify Integration (Alternative)

Deploy to Netlify using the provided `netlify.toml`:

1. **Setup**: Connect repository to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: `frontend/`

## 🏥 Health Monitoring

### Health Check Endpoint

The application provides a health check endpoint at `/api/health`:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected"
}
```

### Docker Health Check

The production Dockerfile includes health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js
```

## 🔒 Security Features

### Production Optimizations

- **Non-root user**: Container runs as `nextjs` user
- **Signal handling**: Uses `dumb-init` for proper signal forwarding
- **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Standalone build**: Minimal Next.js standalone output

### Environment Security

- Secrets management through environment variables
- Rate limiting on API endpoints
- CORS configuration for production domains
- Database connection pooling and timeouts

## 📊 Monitoring & Observability

### Application Metrics

- Health check endpoint for uptime monitoring
- Request logging and error tracking
- Database connection status
- Performance metrics via Next.js built-in analytics

### Container Metrics

- Resource usage monitoring via Docker stats
- Container health status
- Application uptime and restarts

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**: Verify `DATABASE_URL` format and network access
2. **Prisma Client**: Ensure `npx prisma generate` runs during build
3. **Port Conflicts**: Production uses port 3000, development uses 4000
4. **Environment Variables**: Check all required variables are set

### Debug Commands

```bash
# Check container logs
docker logs <container-id>

# Execute shell in container
docker exec -it <container-id> sh

# Verify health endpoint
curl http://localhost:3000/api/health

# Check Prisma client
docker exec <container-id> npx prisma db push --help
```

## 📦 Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] SSL certificates configured for HTTPS
- [ ] Domain DNS configured
- [ ] Monitoring and alerting setup
- [ ] Backup strategy implemented
- [ ] Security headers verified
- [ ] Performance testing completed

## 🔄 Updates & Rollbacks

### Rolling Updates

```bash
# Pull latest image
docker pull ghcr.io/your-org/whatsapi-bridge-web:latest

# Rolling restart
docker service update --image whatsapi-bridge-web:latest your-service
```

### Rollback Strategy

```bash
# Rollback to previous version
docker service update --rollback your-service

# Or deploy specific version
docker service update --image whatsapi-bridge-web:${PREVIOUS_SHA} your-service
```
