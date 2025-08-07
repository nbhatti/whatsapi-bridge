# Cache Management

The WhatsApp API Bridge includes cache management functionality for flushing WhatsApp message cache stored in Redis.

## Overview

The cache system stores incoming and outgoing WhatsApp messages in Redis under the keys:
- `whatsapp:{env}:in` - Incoming message cache (where {env} is the NODE_ENV)
- `whatsapp:{env}:out` - Outgoing message cache (where {env} is the NODE_ENV)

For example, in development mode:
- `whatsapp:development:in`
- `whatsapp:development:out`

## REST API

### Flush Cache

**Endpoint:** `DELETE /api/v1/cache`

**Authentication:** JWT/API Key required

**Description:** Flushes the WhatsApp message cache by deleting the `whatsapp:in` and `whatsapp:out` Redis keys.

#### Request

```http
DELETE /api/v1/cache
Content-Type: application/json
x-api-key: your-api-key
```

#### Response

**Success (200 OK):**
```json
{
  "flushed": true,
  "keysRemoved": 2
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to flush cache",
  "flushed": false,
  "keysRemoved": 0
}
```

#### Response Fields

- `flushed`: Boolean indicating if the flush operation was successful
- `keysRemoved`: Number of Redis keys that were actually removed
- `success`: Boolean indicating overall operation success (only in error responses)
- `error`: Error message (only in error responses)

#### Example Usage

```bash
# Using curl
curl -X DELETE "http://localhost:3000/api/v1/cache" \
  -H "x-api-key: your-api-key"

# Using curl with response formatting
curl -X DELETE "http://localhost:3000/api/v1/cache" \
  -H "x-api-key: your-api-key" \
  | jq '.'
```

## CLI Helper

### npm run cache:flush

**Command:** `npm run cache:flush`

**Description:** Command-line helper for DevOps and shell operations that provides the same functionality as the REST API endpoint.

#### Usage

```bash
# Flush cache using TypeScript version (recommended)
npm run cache:flush

# Alternative: Flush cache using JavaScript version
npm run cache:flush:js
```

#### Output

```
🔄 Initializing cache flush...
✅ Connected to Redis
🗑️  Flushing WhatsApp cache...
✅ Cache flushed successfully!
📊 Keys removed: 2
🔑 Deleted keys: whatsapp:in, whatsapp:out
🔌 Disconnected from Redis
```

#### Error Handling

```
❌ Error flushing cache: Redis connection failed
💡 Make sure Redis is running and environment variables are set correctly
```

### Environment Variables

The CLI helper uses the same Redis configuration as the main application:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TLS=false
```

## Security

- The REST API endpoint is secured by JWT/API Key authentication
- Only authenticated requests can flush the cache
- The CLI helper requires proper Redis configuration

## Use Cases

### Development

```bash
# Clear cache during development
npm run cache:flush
```

### Production Deployment

```bash
# Clear cache after deployment
curl -X DELETE "https://api.yourcompany.com/api/v1/cache" \
  -H "x-api-key: $PRODUCTION_API_KEY"
```

### DevOps Scripts

```bash
#!/bin/bash
# deployment-script.sh

echo "Deploying application..."
# ... deployment steps ...

echo "Flushing cache..."
npm run cache:flush

echo "Deployment complete!"
```

### Monitoring and Automation

The endpoint returns the number of keys removed, which can be used for monitoring:

- `keysRemoved: 2` - Both cache keys existed and were removed
- `keysRemoved: 1` - Only one cache key existed
- `keysRemoved: 0` - No cache keys existed (idempotent operation)

## Error Handling

The cache flush operation is designed to be safe and idempotent:

- If Redis is unavailable, the operation fails gracefully
- If the keys don't exist, the operation succeeds with `keysRemoved: 0`
- Multiple flush operations are safe and won't cause errors
- Proper logging is provided for debugging

## Testing

Run the cache functionality tests:

```bash
# Unit tests
npm run test:unit tests/unit/controllers/cache.controller.test.ts

# Integration tests
npm run test:integration tests/integration/cache.test.ts

# All tests
npm test
```
