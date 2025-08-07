# Middleware Components

This directory contains the core middleware components for the WhatsApp API server.

## Available Middleware

### 1. Authentication Middleware (`auth.ts`)

Provides API key-based authentication using the `x-api-key` header.

#### Configuration
- Set `API_KEY` environment variable

#### Usage
```typescript
import { apiKeyAuth, optionalApiKeyAuth } from './middlewares';

// Require API key authentication
app.use('/api/protected', apiKeyAuth);

// Optional API key authentication (sets req.authenticated)
app.use('/api/public', optionalApiKeyAuth);
```

#### Response Codes
- `401` - Missing or invalid API key
- `500` - Server configuration error

### 2. Rate Limiting Middleware (`rateLimiter.ts`)

Advanced rate limiting using Redis store with configurable windows and limits.

#### Configuration
- `RATE_LIMIT_WINDOW_MS` - Time window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window (default: 100)
- `TRUSTED_IPS` - Comma-separated list of IPs to skip rate limiting

#### Available Rate Limiters
```typescript
import { 
  apiRateLimiter,           // General API (100 req/15min)
  strictRateLimiter,        // Sensitive ops (10 req/15min)
  messageRateLimiter,       // Messages (30 req/1min)
  uploadRateLimiter,        // Uploads (50 req/10min)
  clientOperationRateLimiter, // Client ops (20 req/5min)
  adminRateLimiter,         // Admin ops (5 req/1hour)
  createRateLimiter,        // Custom limiter factory
  createPerUserRateLimiter  // Per-user limiter
} from './middlewares';
```

#### Custom Rate Limiter
```typescript
const customLimiter = createRateLimiter({
  windowMs: 60000,      // 1 minute
  max: 10,              // 10 requests
  keyPrefix: 'custom',
  message: 'Custom rate limit exceeded'
});
```

#### Response Code
- `429` - Rate limit exceeded

### 3. Error Handler Middleware (`errorHandler.ts`)

Centralized error handling with structured logging using Winston.

#### Features
- Standardized error response format
- Stack trace logging with Winston
- Environment-specific error details
- Request context logging

#### Usage
```typescript
import { errorHandler, notFoundHandler } from './middlewares';

// Place at the end of middleware stack
app.use(notFoundHandler);  // Handle 404s
app.use(errorHandler);     // Handle all other errors
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "status": 500,
    // Development only:
    "originalError": "Original error message",
    "stack": "Error stack trace"
  }
}
```

## Quick Setup

1. **Environment Variables**
```bash
# Required for auth middleware
API_KEY=your-strong-api-key

# Optional rate limiting config
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUSTED_IPS=127.0.0.1,::1

# Redis connection for rate limiting
REDIS_URL=redis://localhost:6379
```

2. **Application Integration**
```typescript
import express from 'express';
import { 
  apiKeyAuth, 
  apiRateLimiter, 
  errorHandler, 
  notFoundHandler 
} from './middlewares';

const app = express();

// Core middleware
app.use(express.json());

// Security middleware
app.use(apiRateLimiter);
app.use(apiKeyAuth);

// Your routes here
app.use('/api', routes);

// Error handling (at the end)
app.use(notFoundHandler);
app.use(errorHandler);
```

## Security Features

- **API Key Authentication**: Validates requests against environment variable
- **Rate Limiting**: Prevents abuse with Redis-backed counting
- **Error Sanitization**: Hides sensitive data in production
- **Request Logging**: Tracks suspicious activities
- **IP Whitelisting**: Bypasses limits for trusted sources

## Monitoring

All middleware components log important events:
- Authentication attempts (success/failure)
- Rate limit violations
- Error occurrences with full context
- Request patterns and anomalies

Check the `logs/` directory for detailed logs.

## Performance

- **Redis Integration**: Distributed rate limiting across instances
- **Memory Fallback**: Graceful degradation when Redis unavailable  
- **Efficient Key Generation**: Optimized for high-throughput scenarios
- **Skip Logic**: Development and trusted IP bypass
