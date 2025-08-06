# 🚀 WhatsAPI Bridge - Quick Start Guide

Get your WhatsAPI Bridge up and running in minutes!

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js**: v22.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v10.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Docker**: Latest version ([Download](https://docker.com/)) - Optional but recommended

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: 1GB free space for installation
- **Network**: Internet connection for package installation

## ⚡ Quick Installation

### Option 1: Clone and Install (Recommended)
```bash
# Clone the repository
git clone git@github.com:nbhatti/whatsapi-bridge.git
cd whatsapi-bridge

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Redis (required)
npm run redis:up

# Run in development mode
npm run dev
```

### Option 2: Docker Compose (Easiest)
```bash
# Clone the repository
git clone git@github.com:nbhatti/whatsapi-bridge.git
cd whatsapi-bridge

# Start all services with Docker
npm run docker:up

# View logs
npm run docker:logs
```

## 🔧 Environment Configuration

Edit your `.env` file with these essential configurations:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
API_KEY=your-secure-api-key-here

# Redis Configuration (if not using Docker)
REDIS_URL=redis://localhost:6379

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_TIMEOUT=60000

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-key-here
AI_MODEL=gpt-3.5-turbo

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

## 🧪 Verify Installation

1. **Check if server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Access Swagger documentation:**
   - Open: http://localhost:3000/docs

3. **Run tests:**
   ```bash
   npm test
   ```

## 📱 Connect WhatsApp Device

1. **Start a new device session:**
   ```bash
   POST http://localhost:3000/api/devices/start
   {
     "deviceId": "my-device-1"
   }
   ```

2. **Get QR Code:**
   ```bash
   GET http://localhost:3000/api/devices/my-device-1/qr
   ```

3. **Scan QR code** with WhatsApp mobile app

4. **Send your first message:**
   ```bash
   POST http://localhost:3000/api/messages/send
   {
     "deviceId": "my-device-1",
     "to": "1234567890@c.us",
     "type": "text",
     "content": "Hello from WhatsAPI Bridge!"
   }
   ```

## 🐳 Production Deployment

### Docker Production
```bash
# Build production image
docker build -t whatsapi-bridge .

# Run with environment file
docker run -d \
  --name whatsapi-bridge \
  -p 3000:3000 \
  --env-file .env.production \
  whatsapi-bridge
```

### PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name whatsapi-bridge

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔍 Troubleshooting

### Common Issues

**Redis Connection Error:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

**WhatsApp Session Issues:**
```bash
# Clear session data
rm -rf ./sessions/*

# Restart the device
POST /api/devices/{deviceId}/restart
```

**Port Already in Use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

**Permission Issues:**
```bash
# Fix file permissions
chmod 755 ./sessions
chmod 755 ./logs

# Run with sudo (not recommended)
sudo npm run dev
```

## 📞 Support

Need help? Here's how to get support:

1. **📖 Documentation**: Check the [README.md](README.md)
2. **🐛 Issues**: [Report bugs](https://github.com/nbhatti/whatsapi-bridge/issues)
3. **💬 Discussions**: [Community help](https://github.com/nbhatti/whatsapi-bridge/discussions)
4. **📧 Email**: [naseer@ylinx.pk](mailto:naseer@ylinx.pk)

## 🎯 Next Steps

- ✅ **Explore API**: Check out `/docs` for interactive API documentation
- ✅ **Enable AI**: Configure OpenAI integration for smart responses
- ✅ **Set up monitoring**: Implement logging and health checks
- ✅ **Scale**: Deploy with Docker Compose or Kubernetes
- ✅ **Secure**: Enable HTTPS and proper authentication

---

**🎉 Congratulations! Your WhatsAPI Bridge is now ready for action!**
