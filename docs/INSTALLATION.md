# 🔧 WhatsAPI Bridge - Installation Guide

Complete installation and deployment guide for WhatsAPI Bridge.

## 📋 System Requirements

### Minimum Requirements
- **CPU**: 1 core (2 cores recommended)
- **RAM**: 2GB (4GB recommended)
- **Storage**: 1GB free space
- **Network**: Internet connection for package installation

### Software Dependencies
- **Node.js**: v22.0.0 or higher
- **npm**: v10.0.0 or higher  
- **Git**: Latest version
- **Redis**: v7.0+ (Docker or standalone)
- **Docker**: v20.10+ (optional but recommended)

### Operating System Support
- ✅ **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- ✅ **macOS**: 10.15+ (Catalina or later)
- ✅ **Windows**: 10+ with WSL2 recommended

## 📦 Installation Methods

### Method 1: Git Clone (Recommended)

```bash
# Clone the repository
git clone git@github.com:nbhatti/whatsapi-bridge.git
cd whatsapi-bridge

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit configuration (see Configuration section)
nano .env

# Start Redis
npm run redis:up

# Run in development mode
npm run dev
```

### Method 2: Docker Compose (Easiest)

```bash
# Clone the repository
git clone git@github.com:nbhatti/whatsapi-bridge.git
cd whatsapi-bridge

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Method 3: Manual Installation

```bash
# Create project directory
mkdir whatsapi-bridge && cd whatsapi-bridge

# Download and extract source
curl -L https://github.com/nbhatti/whatsapi-bridge/archive/main.tar.gz | tar xz --strip-components=1

# Install dependencies
npm install

# Continue with configuration...
```

## ⚙️ Configuration

### 1. Environment Variables

Edit your `.env` file with required configurations:

```env
# Essential Configuration
API_KEY=your-super-secure-api-key-here
REDIS_URL=redis://localhost:6379
PORT=3000

# WhatsApp Configuration  
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_TIMEOUT=60000

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-3.5-turbo
```

### 2. Redis Setup

#### Option A: Docker Redis (Recommended)
```bash
# Start Redis with Docker
docker run -d -p 6379:6379 --name whatsapi-redis redis:7-alpine

# Or use the npm script
npm run redis:up
```

#### Option B: System Redis
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install redis-server

# macOS
brew install redis
brew services start redis

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis
```

### 3. Directory Setup

```bash
# Create required directories
mkdir -p sessions logs

# Set proper permissions
chmod 755 sessions logs
```

## 🏗️ Build and Start

### Development Mode
```bash
# Install dependencies
npm install

# Start Redis
npm run redis:up

# Run in development mode (with hot reload)
npm run dev
```

### Production Mode
```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build

# Start in production mode
npm start
```

## 🐳 Docker Deployment

### Single Container
```bash
# Build the image
docker build -t whatsapi-bridge .

# Run the container
docker run -d \
  --name whatsapi-bridge \
  -p 3000:3000 \
  -e API_KEY=your-api-key \
  -e REDIS_URL=redis://redis:6379 \
  --link redis:redis \
  whatsapi-bridge
```

### Docker Compose (Recommended)
```yaml
# docker-compose.yml
version: '3.8'

services:
  whatsapi-bridge:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=your-secure-api-key
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ./sessions:/app/sessions
      - ./logs:/app/logs

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🎯 Production Deployment

### PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'whatsapi-bridge',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Systemd Service (Linux)
```bash
# Create systemd service
sudo tee /etc/systemd/system/whatsapi-bridge.service << EOF
[Unit]
Description=WhatsAPI Bridge
After=network.target

[Service]
Type=simple
User=whatsapi
WorkingDirectory=/opt/whatsapi-bridge
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable whatsapi-bridge
sudo systemctl start whatsapi-bridge
```

### Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/whatsapi-bridge
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapi-bridge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔧 Post-Installation

### 1. Verify Installation
```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response
{
  "status": "OK",
  "uptime": 123.456,
  "timestamp": "2025-01-06T12:00:00.000Z",
  "checks": {
    "redis": "OK",
    "memory": "OK",
    "server": "OK"
  }
}
```

### 2. Access API Documentation
- Open: http://localhost:3000/docs
- Interactive Swagger UI with all endpoints

### 3. Test Basic Functionality
```bash
# Start a WhatsApp device session
curl -X POST http://localhost:3000/api/devices/start \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"deviceId": "test-device"}'
```

## 🔍 Troubleshooting

### Common Issues

#### Redis Connection Failed
```bash
# Check Redis status
redis-cli ping

# If not running, start Redis
sudo systemctl start redis
# or
npm run redis:up
```

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Permission Denied
```bash
# Fix directory permissions
sudo chown -R $(whoami):$(whoami) .
chmod -R 755 sessions logs
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Install specific version with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Debugging

#### Enable Debug Mode
```bash
# Set debug environment variable
DEBUG=whatsapi:* npm run dev

# Or in .env file
DEBUG_MODE=true
LOG_LEVEL=debug
```

#### Check Logs
```bash
# Application logs
tail -f logs/app.log

# Docker logs
docker-compose logs -f whatsapi-bridge

# PM2 logs
pm2 logs whatsapi-bridge
```

## 📞 Getting Help

If you encounter issues:

1. **📖 Check Documentation**: [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)
2. **🔍 Search Issues**: [GitHub Issues](https://github.com/nbhatti/whatsapi-bridge/issues)
3. **💬 Community Help**: [GitHub Discussions](https://github.com/nbhatti/whatsapi-bridge/discussions)
4. **📧 Direct Support**: [naseer@ylinx.pk](mailto:naseer@ylinx.pk)

## 🚀 Next Steps

After successful installation:

- ✅ Configure WhatsApp device connections
- ✅ Set up AI integrations
- ✅ Configure webhooks for notifications
- ✅ Set up monitoring and logging
- ✅ Implement backup strategies
- ✅ Configure SSL certificates for production

---

**🎉 Installation Complete! Your WhatsAPI Bridge is ready to use.**
