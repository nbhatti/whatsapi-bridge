# Documentation Index

Welcome to the WhatsApp Web.js REST API Wrapper documentation. This directory contains all project documentation organized by category.

## 📖 Getting Started

- [Installation Guide](INSTALLATION.md) - Step-by-step installation instructions
- [Quick Start Guide](QUICKSTART.md) - Get up and running quickly
- [Environment Configuration](ENV_CONFIGURATION.md) - Configure your environment variables
- [Docker Setup](Docker.md) - Docker development environment

## 🏗️ Architecture & Design

- [System Architecture](ARCHITECTURE.md) - High-level system design
- [Unified Messaging Architecture](UNIFIED_MESSAGING_ARCHITECTURE.md) - Messaging system design
- [WebSocket Gateway](WEBSOCKET_GATEWAY.md) - Real-time communication architecture
- [WhatsApp Event Flow Analysis](WHATSAPP_EVENT_FLOW_ANALYSIS.md) - Event processing flow

## 🚀 API Documentation

- [API Guide](API_GUIDE.md) - Complete API reference
- [Unified Messaging API](UNIFIED_MESSAGING_API.md) - Messaging API endpoints
- [Contact Routes](CONTACT_ROUTES.md) - Contact management endpoints
- [Group Routes](GROUP_ROUTES.md) - Group management endpoints

## 🔧 Development

### Core Components
- [Redis Implementation](development/redis-implementation.md) - Redis caching and data storage
- [Redis Documentation](development/redis.md) - Redis setup and configuration
- [Middlewares](development/middlewares.md) - Express middleware documentation
- [Type Definitions](development/types.md) - TypeScript type definitions
- [Workers](development/workers.md) - Background job processing
- [Media Utils](development/media-utils.md) - Media handling utilities
- [Secrets Management](development/secrets.md) - Secrets configuration

### Monitoring & Analytics
- [Cache Health Metrics](CACHE_HEALTH_METRICS.md) - Cache monitoring implementation
- [Analytics Implementation](ANALYTICS_IMPLEMENTATION_SUMMARY.md) - Analytics system overview
- [Analytics](ANALYTICS.md) - Analytics features and usage
- [Logging & Monitoring](LOGGING_MONITORING_IMPLEMENTATION.md) - Logging system

## 🧪 Testing & CI/CD

- [Testing Guide](TESTING_CI_ROLLOUT.md) - Testing strategies and CI/CD pipeline

## 🔐 Security

- [Security Guide](SECURITY.md) - Security best practices and implementation
- [Blocking Prevention Fixes](BLOCKING_PREVENTION_FIXES.md) - Anti-blocking measures

## 📚 Examples & Guides

- [AI Analysis Examples](ai-analysis-examples.md) - AI-powered message analysis
- [Chat Management Examples](chat-management-examples.md) - Chat handling examples
- [Cache Management](cache-management.md) - Cache management strategies

## 📝 Project Management

- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- [Changelog](CHANGELOG.md) - Version history and changes

## 🎨 Frontend Documentation

Frontend-specific documentation is located in the `frontend/` directory:
- Frontend setup and configuration
- Authentication system
- Dashboard implementation
- UI components and themes

## 📋 Quick Reference

### Essential Commands
```bash
# Start development environment
npm run docker:up:dev

# Run API only
npm run docker:up:api

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Key Endpoints
- **Health Check**: `GET /health`
- **Send Message**: `POST /api/sendMessage`
- **Get Chats**: `GET /api/getChats`
- **WebSocket**: `ws://localhost:3000/socket.io`

---

For specific implementation details, refer to the individual documentation files linked above.
