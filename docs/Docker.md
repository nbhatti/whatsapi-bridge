# Docker Setup for WhatsApp API

This project includes a complete Docker setup with multi-stage builds and Docker Compose orchestration.

## Quick Start

### Production Environment

1. **Build and start all services:**
   ```bash
   npm run docker:up
   ```

2. **View logs:**
   ```bash
   npm run docker:logs
   ```

3. **Stop services:**
   ```bash
   npm run docker:down
   ```

### Development Environment

1. **Start development environment with hot reload:**
   ```bash
   npm run docker:dev
   ```

2. **Build development image:**
   ```bash
   npm run docker:dev:build
   ```

## Architecture

### Multi-Stage Dockerfile

The `Dockerfile` uses a two-stage build process:

1. **Builder Stage (`node:18-alpine`):**
   - Installs all dependencies (including dev dependencies)
   - Compiles TypeScript to JavaScript
   - Optimized for build time

2. **Production Stage (`node:18-alpine`):**
   - Installs only production dependencies
   - Copies compiled JavaScript from builder stage
   - Runs as non-root user for security
   - Uses `dumb-init` for proper signal handling
   - Minimal image size for deployment

### Services

#### API Service
- **Container:** `whatsapp-api`
- **Port:** 3000 (HTTP/WebSocket)
- **Environment:** Production-ready with proper health checks
- **Dependencies:** Redis service

#### Redis Service
- **Container:** `whatsapp-redis`
- **Port:** 6379
- **Persistence:** Data stored in Docker volume
- **Configuration:** Append-only file (AOF) enabled

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:build` | Build Docker images |
| `npm run docker:up` | Start services in detached mode |
| `npm run docker:down` | Stop and remove services |
| `npm run docker:logs` | Follow service logs |
| `npm run docker:dev` | Start development environment |
| `npm run docker:dev:build` | Build development image |
| `npm run redis:up` | Start only Redis service |
| `npm run redis:down` | Stop only Redis service |

## Environment Configuration

The application uses environment variables from `.env` file:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security
API_KEY=your-secret-api-key
```

## Health Checks

Both services include health checks:

- **API Service:** HTTP GET to `/health` endpoint
- **Redis Service:** Redis PING command

Health checks ensure services are fully operational before accepting traffic.

## Networking

Services communicate through a custom Docker network (`whatsapp-network`) with:
- Service discovery via container names
- Isolated network for security
- Bridge driver for local development

## Volume Persistence

Redis data is persisted using Docker volumes:
- **Production:** `redis_data`
- **Development:** `redis_data_dev`

## Security Features

- Non-root user execution
- Minimal Alpine Linux base images
- Proper signal handling with `dumb-init`
- Network isolation
- Health check monitoring

## Troubleshooting

### Check Service Status
```bash
docker-compose ps
```

### View Service Logs
```bash
docker-compose logs -f api
docker-compose logs -f redis
```

### Rebuild Images
```bash
docker-compose build --no-cache
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up --build
```

## Production Deployment

For production deployment:

1. Update `.env` with production values
2. Use Docker Compose with production overrides
3. Consider using Docker Swarm or Kubernetes for orchestration
4. Set up proper monitoring and logging
5. Configure reverse proxy (nginx/traefik) for SSL termination

## WebSocket Support

The API service supports WebSocket connections on the same port (3000) as HTTP. Both protocols are handled by the Express.js server with Socket.IO integration.
