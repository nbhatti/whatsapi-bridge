# Logging & Monitoring Implementation

This document summarizes the logging and monitoring features that have been implemented for the WhatsApp API server.

## ✅ Features Implemented

### 1. Winston Transports: Console + Rotating File

- **Console Transport**: Added for development environment with colorized output
- **Daily Rotating File Transports**: 
  - `error-%DATE%.log` - Error level logs only
  - `combined-%DATE%.log` - All log levels
  - `http-%DATE%.log` - HTTP request logs only

**Configuration:**
- **Date Pattern**: `YYYY-MM-DD` (daily rotation)
- **Max File Size**: 20MB before rotation
- **Max Files**: 14 days retention
- **Zipped Archive**: Older logs are compressed

**Location**: `./logs/` directory

### 2. Morgan Stream for HTTP Request Logs

- **HTTP Request Logging**: All HTTP requests are logged using Morgan
- **Format**: Combined format (Apache common log format + additional info)
- **Stream Integration**: Morgan logs are piped to Winston's HTTP transport
- **Separate File**: HTTP logs are stored in dedicated rotating files

**Features:**
- Request method, URL, status code, response time
- User agent and referrer information
- Remote IP address
- Content length

### 3. Health Check Route `/health`

A comprehensive health check endpoint that verifies system status and returns uptime information.

**Endpoint**: `GET /health`

**Response Format:**
```json
{
  "status": "OK|DEGRADED|FAIL",
  "uptime": 123.456,
  "timestamp": "2025-01-06T08:45:30.123Z",
  "checks": {
    "redis": "OK|FAIL|UNKNOWN",
    "memory": "OK|WARN",
    "server": "OK"
  },
  "metadata": {
    "version": "1.0.0",
    "environment": "development",
    "node_version": "v18.17.0"
  }
}
```

**Health Checks:**
- **Redis Connection**: Verifies Redis ping response
- **Memory Usage**: Warns if heap usage > 90%
- **Server Status**: Basic server availability

**Status Codes:**
- `200 OK`: All systems operational
- `503 Service Unavailable`: One or more systems degraded/failed

## 📁 Log Files Structure

```
logs/
├── combined-2025-01-06.log     # All logs (info, warn, error, http)
├── error-2025-01-06.log        # Error logs only
├── http-2025-01-06.log         # HTTP request logs only
└── .audit files               # Winston rotation metadata
```

## 🔧 Configuration

### Environment Variables

```env
# Logging Configuration
LOG_LEVEL=info

# Server Configuration
PORT=3000
NODE_ENV=development

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Logger Levels

- `error`: Error messages
- `warn`: Warning messages  
- `info`: Informational messages
- `http`: HTTP request logs
- `debug`: Debug messages (development only)

## 🚀 Usage Examples

### Using the Logger

```typescript
import { logger, logInfo, logError, logWarn, logDebug } from './config/logger';

// Direct usage
logger.info('Server started successfully');
logger.error('Database connection failed', { error: err });

// Helper functions
logInfo('User authenticated', { userId: '123' });
logError('Validation failed', validationError);
logWarn('High memory usage detected');
logDebug('Processing request', { requestId: 'req-123' });
```

### Health Check Integration

The health check endpoint is automatically available at `/health` and can be used by:

- **Load balancers**: For health checking backend instances
- **Monitoring systems**: For alerting on service degradation
- **DevOps tools**: For automated health verification
- **Docker**: As a health check in container orchestration

## 📊 Log Rotation & Cleanup

- **Automatic Rotation**: Files rotate daily at midnight
- **Size-based Rotation**: Files rotate when they exceed 20MB
- **Retention Policy**: Logs are kept for 14 days
- **Compression**: Old logs are automatically gzipped
- **Audit Trail**: Winston maintains audit files for rotation tracking

## 🔍 Monitoring Best Practices

1. **Log Levels**: Use appropriate log levels for different scenarios
2. **Structured Logging**: Logs are in JSON format for easy parsing
3. **Error Context**: Always include error context and stack traces
4. **Performance**: HTTP logs help track response times and usage patterns
5. **Health Monitoring**: Regular health check polling for proactive monitoring

## Dependencies Added

```json
{
  "morgan": "^1.10.0",
  "winston-daily-rotate-file": "^5.0.0",
  "@types/morgan": "^1.9.9"
}
```

Existing dependencies used:
- `winston`: "^3.17.0" (already installed)

All logging and monitoring features are now operational and ready for production use.
