# Cache Configuration, Health Checks, and Metrics

This document describes the cache configuration flags, health check endpoints, and Prometheus metrics added to the WhatsApp API Bridge.

## Configuration Files

### Environment Variables (.env)

The following cache configuration flags have been added to your `.env` file:

```bash
# Redis cache feature flags
REDIS_ENABLED=true
SYNC_INTERVAL_MS=5000
MAX_LIST_LENGTH=1000
```

### config.json

A new `config.json` file has been added to the root directory with the following structure:

```json
{
  "cache": {
    "redis": {
      "enabled": true,
      "syncIntervalMs": 5000,
      "maxListLength": 1000
    }
  },
  "health": {
    "enableCacheEndpoint": true,
    "enableMetrics": true
  },
  "metrics": {
    "prometheus": {
      "enabled": true,
      "prefix": "whatsapp_cache_",
      "defaultLabels": {
        "service": "whatsapi-bridge",
        "environment": "development"
      }
    }
  }
}
```

## Health Check Endpoints

### Primary Cache Health Check

**Endpoint:** `GET /health/cache`
**Description:** Returns cache health information including Redis PING latency and list sizes for in/out queues.

**Response Format:**
```json
{
  "status": "healthy",
  "redis": {
    "connected": true,
    "pingLatencyMs": 5,
    "enabled": true
  },
  "cache": {
    "listSizes": {
      "in": 150,
      "out": 75
    },
    "syncIntervalMs": 5000,
    "maxListLength": 1000
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### API v1 Cache Health Check

**Endpoint:** `GET /api/v1/cache/health`
**Description:** Same functionality as above, available through the versioned API endpoint.

## Prometheus Metrics

The system now exposes Prometheus metrics for cache monitoring and observability.

### Metrics Endpoint

**Endpoint:** `GET /api/v1/cache/metrics`
**Content-Type:** `text/plain`
**Description:** Returns Prometheus metrics in the standard format.

### Available Metrics

#### Cache Operations
- `whatsapp_cache_hits_total{cache_type="in|out", operation="get|set|delete"}` - Total cache operations
- `whatsapp_cache_flushes_total{flush_type="manual|auto|full"}` - Total cache flushes

#### Sync Operations
- `whatsapp_cache_sync_cycles_total{sync_type="in|out|full", status="success|error"}` - Total sync cycles

#### Cache Status
- `whatsapp_cache_list_size{list_type="in|out"}` - Current size of cache lists
- `whatsapp_cache_redis_ping_latency_ms` - Redis PING command latency

#### Performance
- `whatsapp_cache_operation_duration_seconds{operation="operation_name"}` - Duration histogram of cache operations

### Default Process Metrics

The following standard Node.js metrics are also included:
- Memory usage
- CPU usage
- Event loop lag
- Garbage collection stats
- HTTP request metrics (if enabled)

## Cache Controller Updates

### New Endpoints

#### Flush Cache
**Endpoint:** `DELETE /api/v1/cache`
**Description:** Flush WhatsApp message cache (now includes metrics tracking)

#### Health Check
**Endpoint:** `GET /api/v1/cache/health`
**Description:** Get cache health status with Redis ping and queue sizes

#### Metrics
**Endpoint:** `GET /api/v1/cache/metrics`
**Description:** Get Prometheus metrics for cache monitoring

## Metrics Integration

### Message Cache Service

The message cache service now automatically tracks:
- Cache hits for inbound messages (`cache_type="in", operation="set"`)
- Cache hits for outbound messages (`cache_type="out", operation="set"`) 
- Cache retrievals (`cache_type="in|out", operation="get"`)
- Full cache flushes (`flush_type="full"`)

### Sync Worker

The sync worker now tracks:
- Successful sync cycles per queue type
- Failed sync cycles
- Full sync cycle completions

### Cache Controller

The cache controller tracks:
- Manual cache flushes
- Redis ping latency measurements
- Cache list size updates

## Usage Examples

### Monitoring Cache Health

```bash
# Check overall cache health
curl http://localhost:3000/health/cache

# Check API v1 cache health  
curl http://localhost:3000/api/v1/cache/health
```

### Collecting Metrics

```bash
# Get Prometheus metrics
curl http://localhost:3000/api/v1/cache/metrics

# Example output:
# whatsapp_cache_hits_total{cache_type="in",operation="set"} 150
# whatsapp_cache_hits_total{cache_type="out",operation="set"} 75
# whatsapp_cache_sync_cycles_total{sync_type="full",status="success"} 25
# whatsapp_cache_redis_ping_latency_ms 5.2
```

### Prometheus Configuration

Add the following to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'whatsapi-bridge'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/v1/cache/metrics'
    scrape_interval: 15s
```

## Configuration Notes

- Set `REDIS_ENABLED=true` to enable Redis cache features
- `SYNC_INTERVAL_MS` controls how often the sync worker runs (default: 5000ms)
- `MAX_LIST_LENGTH` limits the size of in-memory cache lists (default: 1000)
- Metrics can be disabled by setting `config.json` → `metrics.prometheus.enabled` to `false`
- Health check endpoints are always available regardless of Redis status

## Error Handling

- Health checks return HTTP 503 if Redis is unavailable
- Metrics endpoint returns HTTP 500 if metrics collection fails
- Cache operations fail gracefully without disrupting message processing
- All operations include proper error logging and monitoring
