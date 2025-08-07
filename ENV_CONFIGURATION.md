# Environment Configuration Guide

This document describes all available environment variables for the WhatsAPI Bridge application.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```bash
   nano .env
   ```

3. Update the required values (marked with `CHANGE THIS!`)

## Environment Files

- **`.env`** - Your local development configuration (never commit)
- **`.env.example`** - Template with all available options and defaults
- **`.env.test`** - Test environment configuration (used in CI/CD)
- **`config/staging/.env.staging`** - Staging environment configuration

## Core Configuration

### Server Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `HOST` | `localhost` | Server host |

### Redis Configuration (Required)
| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | `` | Redis password (optional) |
| `REDIS_DB` | `0` | Redis database number |
| `REDIS_ENABLED` | `true` | Enable Redis features |

### Security (CRITICAL - Change These!)
| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | `your-super-secure-api-key-change-this-immediately` | ⚠️ **CHANGE THIS** |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` | ⚠️ **CHANGE THIS** |
| `JWT_EXPIRE` | `7d` | JWT token expiration |
| `WEBHOOK_ENCRYPTION_KEY` | `your-32-byte-webhook-encryption-key` | ⚠️ **CHANGE THIS** |

## AI Configuration

### Provider Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `openrouter` | Primary AI provider (openai, openrouter, xai) |
| `AI_API_KEY` | `` | ⚠️ **REQUIRED** - Primary AI API key |
| `AI_MODEL` | `meta-llama/llama-3.1-8b-instruct:free` | Default model |
| `AI_MAX_TOKENS` | `4000` | Max tokens per request |
| `AI_TEMPERATURE` | `0.1` | AI creativity level (0.0-1.0) |

### Provider-Specific Keys
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `` | OpenAI API key |
| `OPENROUTER_API_KEY` | `` | OpenRouter API key |
| `X_API_KEY` | `` | X.AI (Grok) API key |

## Analytics Configuration

Control default behavior for all analytics endpoints:

| Variable | Default | Description |
|----------|---------|-------------|
| `ANALYTICS_DEFAULT_LIMIT` | `20` | Default result limit for all analytics endpoints |
| `ANALYTICS_DEFAULT_DAYS` | `30` | Default time range in days |
| `ANALYTICS_MAX_LIMIT` | `50` | Maximum allowed limit (safety cap) |

### Usage Examples
```bash
# Use defaults (20 results, 30 days)
GET /api/v1/devices/{id}/analytics/unread-detective
GET /api/v1/devices/{id}/analytics/chatterboxes

# Override with custom limit
GET /api/v1/devices/{id}/analytics/unread-detective?limit=15
GET /api/v1/devices/{id}/analytics/chatterboxes?limit=10

# Custom time range with limit
GET /api/v1/devices/{id}/analytics/chatterboxes?timeRange=7&limit=5
GET /api/v1/devices/{id}/analytics/conversation-health-check?timeRange=14
```

## Blocking Prevention

Anti-blocking configuration for WhatsApp:

| Variable | Default | Description |
|----------|---------|-------------|
| `MESSAGE_MIN_DELAY` | `1000` | Minimum delay between messages (ms) |
| `MESSAGE_MAX_DELAY` | `10000` | Maximum delay between messages (ms) |
| `MESSAGE_MAX_ATTEMPTS` | `3` | Max retry attempts for failed messages |
| `MESSAGE_RETRY_DELAY` | `5000` | Delay between retry attempts (ms) |
| `MESSAGES_PER_MINUTE` | `10` | Rate limit per device per minute |
| `MESSAGE_BURST_LIMIT` | `3` | Burst limit for rapid messages |
| `ENABLE_TYPING_DELAY` | `true` | Simulate typing indicators |
| `ENABLE_READ_RECEIPT_DELAY` | `true` | Simulate read receipt delays |

## Feature Flags

Enable/disable features:

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_AI_ENABLED` | `true` | Enable AI features |
| `FEATURE_GROUPS_ENABLED` | `true` | Enable group chat features |
| `FEATURE_MEDIA_ENABLED` | `true` | Enable media handling |
| `FEATURE_WEBHOOKS_ENABLED` | `false` | Enable webhook notifications |
| `FEATURE_BLOCKING_PREVENTION` | `true` | Enable anti-blocking measures |

## Performance & Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_MEMORY_USAGE_MB` | `1024` | Memory usage threshold |
| `REDIS_MEMORY_THRESHOLD_MB` | `512` | Redis memory threshold |
| `TARGET_TPS` | `500` | Target transactions per second |
| `SYNC_WORKER_ENABLED` | `true` | Enable background sync worker |
| `SYNC_LAG_THRESHOLD_MS` | `1000` | Sync lag warning threshold |

## Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting |
| `TRUSTED_IPS` | `127.0.0.1,::1` | Comma-separated trusted IPs |

## Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level (error, warn, info, debug, verbose) |
| `LOG_FILE_PATH` | `./logs` | Log file directory |
| `LOG_CONSOLE` | `true` | Enable console logging |

## Production Settings

### HTTPS Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `HTTPS_ENABLED` | `false` | Enable HTTPS |
| `SSL_CERT_PATH` | `` | SSL certificate path |
| `SSL_KEY_PATH` | `` | SSL private key path |

### Monitoring & Error Tracking
| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | `` | Sentry error tracking DSN |
| `GA_TRACKING_ID` | `` | Google Analytics tracking ID |
| `MONITORING_URL` | `` | External monitoring webhook |

## Environment-Specific Examples

### Development
```bash
NODE_ENV=development
API_KEY=dev-api-key-123
LOG_LEVEL=debug
REDIS_DB=0
FEATURE_AI_ENABLED=true
```

### Production
```bash
NODE_ENV=production
API_KEY=prod-super-secure-key-xyz789
LOG_LEVEL=warn
HTTPS_ENABLED=true
REDIS_PASSWORD=secure-redis-password
CORS_ORIGIN=https://yourdomain.com
```

### Testing
```bash
NODE_ENV=test
PORT=3001
REDIS_DB=1
LOG_LEVEL=error
MOCK_WHATSAPP=true
ANALYTICS_DEFAULT_LIMIT=5
```

## Security Checklist

Before deploying to production:

- [ ] Change `API_KEY` to a strong, unique value
- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Change `WEBHOOK_ENCRYPTION_KEY` to a secure 32-byte key
- [ ] Enable `HTTPS_ENABLED=true`
- [ ] Set proper `CORS_ORIGIN` values
- [ ] Use Redis with authentication (`REDIS_PASSWORD`)
- [ ] Set `LOG_LEVEL=warn` or `LOG_LEVEL=error`
- [ ] Configure `TRUSTED_IPS` if using rate limiting exceptions
- [ ] Set up `SENTRY_DSN` for error tracking
- [ ] Enable proper firewall rules
- [ ] Regularly rotate API keys and secrets

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check `REDIS_URL` format
   - Ensure Redis server is running
   - Verify network connectivity

2. **API Authentication Errors**
   - Verify `API_KEY` matches client requests
   - Check API key format (no spaces, special characters)

3. **WhatsApp Connection Issues**
   - Check `SESSION_PATH` permissions
   - Verify `WHATSAPP_TIMEOUT` settings
   - Review anti-blocking configuration

4. **High Memory Usage**
   - Adjust `MAX_LIST_LENGTH`
   - Reduce `SYNC_INTERVAL_MS`
   - Monitor `MAX_MEMORY_USAGE_MB`

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
DEBUG_MODE=true
```

### Health Checks

Monitor application health:
```bash
curl http://localhost:3000/health
```

## Contributing

When adding new environment variables:
1. Add to `.env.example` with documentation
2. Add to this README
3. Add default value in code
4. Update test configuration if needed
5. Consider security implications
