# Architecture & Technology Stack

## Overview
This document defines the architecture and technology stack for a WhatsApp integration service with REST API endpoints.

## Technology Stack

### Backend Framework
- **Node.js** with **TypeScript** for type safety and better developer experience
- **Express.js** or **Fastify** for the REST API layer
  - Express: Mature, extensive ecosystem, well-documented
  - Fastify: Higher performance, built-in TypeScript support, modern async/await patterns

### WhatsApp Integration
- **whatsapp-web.js** library for WhatsApp Web API integration
- **Multi-device support**: Using the latest version that supports WhatsApp's multi-device architecture
- Note: WhatsApp has deprecated legacy session handling in favor of multi-device sessions

### Database & Session Persistence
- **Redis**: For session storage, caching, and real-time data
  - Fast in-memory storage for WhatsApp session data
  - Pub/Sub capabilities for real-time messaging
  - Session expiration handling
- **PostgreSQL**: For persistent data storage
  - User management
  - Message history
  - Configuration settings
  - Audit logs

## Architecture Components

### 1. REST API Layer
```
┌─────────────────────────────────────┐
│           REST API Layer            │
│        (Express/Fastify + TS)       │
├─────────────────────────────────────┤
│ • Authentication & Authorization    │
│ • Request validation                │
│ • Rate limiting                     │
│ • Error handling                    │
│ • API documentation (OpenAPI)       │
└─────────────────────────────────────┘
```

### 2. WhatsApp Service Layer
```
┌─────────────────────────────────────┐
│         WhatsApp Service            │
│        (whatsapp-web.js)            │
├─────────────────────────────────────┤
│ • Multi-device session management  │
│ • Message sending/receiving         │
│ • Contact management                │
│ • Media handling                    │
│ • Event handling                    │
└─────────────────────────────────────┘
```

### 3. Data Layer
```
┌─────────────────┐    ┌──────────────────┐
│      Redis      │    │   PostgreSQL     │
│   (Sessions)    │    │ (Persistent Data)│
├─────────────────┤    ├──────────────────┤
│ • Session data  │    │ • Users          │
│ • Cache         │    │ • Messages       │
│ • Pub/Sub       │    │ • Configurations │
│ • Rate limits   │    │ • Audit logs     │
└─────────────────┘    └──────────────────┘
```

## Key Features

### Multi-Device Session Management
- Utilizes WhatsApp's multi-device architecture
- Persistent session storage in Redis
- Automatic session recovery and reconnection
- Session health monitoring

### API Endpoints (Planned)
- `POST /api/v1/sessions` - Create WhatsApp session
- `GET /api/v1/sessions/:id/status` - Get session status
- `POST /api/v1/messages/send` - Send message
- `GET /api/v1/messages` - Retrieve messages
- `POST /api/v1/media/send` - Send media files

### Security Considerations
- API key authentication
- Request rate limiting
- Input validation and sanitization
- Secure session storage
- CORS configuration

## Dependencies

### Core Dependencies
```json
{
  "express": "^4.18.x" || "fastify": "^4.x.x",
  "whatsapp-web.js": "^1.21.x",
  "redis": "^4.x.x",
  "pg": "^8.x.x",
  "typescript": "^5.x.x"
}
```

### Additional Dependencies
```json
{
  "@types/node": "^20.x.x",
  "cors": "^2.8.x",
  "helmet": "^7.x.x",
  "joi": "^17.x.x",
  "winston": "^3.x.x",
  "dotenv": "^16.x.x"
}
```

## Environment Configuration
- `NODE_ENV`: Environment (development/production)
- `PORT`: API server port
- `REDIS_URL`: Redis connection string
- `DATABASE_URL`: PostgreSQL connection string
- `API_KEY`: Authentication key
- `WEBHOOK_URL`: Optional webhook for message events

## Deployment Considerations
- Docker containerization
- Health checks for WhatsApp session status
- Graceful shutdown handling
- Process management (PM2 for production)
- Logging and monitoring setup
