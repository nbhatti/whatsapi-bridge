# Redis Client Configuration

This document describes the Redis client wrapper configuration and usage for the WhatsApp API Bridge.

## Features

- **Singleton Connection Pooling**: Single Redis connection instance shared across the application
- **Lazy Loading**: Connection is established only when first accessed
- **Environment-driven Configuration**: All settings configurable via environment variables
- **Key Prefixing**: Automatic key prefixing to avoid collisions (`whatsapp:{env}:`)
- **Cluster Support**: Full Redis Cluster support with ioredis
- **Streams Support**: Redis Streams for event sourcing and message streaming
- **Health Monitoring**: Built-in health check and connection monitoring
- **Graceful Shutdown**: Proper connection cleanup

## Environment Variables

### Basic Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_HOST` | Redis server hostname | `localhost` | No |
| `REDIS_PORT` | Redis server port | `6379` | No |
| `REDIS_PASSWORD` | Redis authentication password | - | No |
| `REDIS_DB` | Redis database number | `0` | No |
| `NODE_ENV` | Environment (affects key prefix) | `development` | No |

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_TLS` | Enable TLS/SSL connection | `false` | No |
| `REDIS_PASSWORD` | Authentication password | - | No |

### Performance Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_MAX_RETRIES` | Maximum retries per request | `3` | No |
| `REDIS_RETRY_DELAY` | Retry delay on failover (ms) | `100` | No |
| `REDIS_CONNECT_TIMEOUT` | Connection timeout (ms) | `10000` | No |
| `REDIS_COMMAND_TIMEOUT` | Command timeout (ms) | `5000` | No |

### Cluster Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REDIS_CLUSTER_HOSTS` | Comma-separated cluster hosts | `host1:6379,host2:6379,host3:6379` | No |

## Usage Examples

### Basic Usage

```typescript
import { getRedis, closeRedis } from './lib/redis';

async function example() {
  // Get Redis client (lazy connection)
  const redis = await getRedis();
  
  // Use Redis operations
  await redis.set('user:123', JSON.stringify({ name: 'John' }));
  const user = await redis.get('user:123');
  
  // Keys are automatically prefixed: whatsapp:development:user:123
  console.log(user);
}
```

### Key Prefixing

```typescript
import { getKeyPrefix, prefixKey, unprefixKey } from './lib/redis';

// Get current prefix
console.log(getKeyPrefix()); // "whatsapp:development:"

// Manual key prefixing
const prefixed = prefixKey('my_key'); // "whatsapp:development:my_key"
const unprefixed = unprefixKey(prefixed); // "my_key"
```

### Redis Streams

```typescript
import { getRedis } from './lib/redis';

async function streamExample() {
  const redis = await getRedis();
  
  // Add event to stream
  await redis.xadd('events', '*', 
    'event', 'message_sent',
    'userId', '123',
    'timestamp', Date.now().toString()
  );
  
  // Read from stream
  const events = await redis.xrange('events', '-', '+', 'COUNT', 10);
  console.log(events);
}
```

### Health Monitoring

```typescript
import { redisHealthCheck, getConnectionInfo } from './lib/redis';

async function healthCheck() {
  const health = await redisHealthCheck();
  console.log(health); // { status: 'healthy', message: 'Redis connection is working' }
  
  const info = getConnectionInfo();
  console.log(info); // { host: 'localhost', port: 6379, keyPrefix: '...', isCluster: false }
}
```

### Graceful Shutdown

```typescript
import { closeRedis } from './lib/redis';

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await closeRedis();
  process.exit(0);
});
```

## Key Prefixing Strategy

All Redis keys are automatically prefixed with `whatsapp:{env}:` where `{env}` is the value of `NODE_ENV`:

- Development: `whatsapp:development:user:123`
- Production: `whatsapp:production:user:123`
- Test: `whatsapp:test:user:123`

This prevents key collisions between different environments and applications sharing the same Redis instance.

## Redis Cluster Support

To use Redis Cluster, set the `REDIS_CLUSTER_HOSTS` environment variable:

```bash
REDIS_CLUSTER_HOSTS=redis-node1:6379,redis-node2:6379,redis-node3:6379
```

The client will automatically detect cluster mode and use the appropriate connection strategy.

## Best Practices

1. **Connection Management**: Use the singleton pattern - always call `getRedis()` instead of creating new connections
2. **Error Handling**: Wrap Redis operations in try-catch blocks
3. **Graceful Shutdown**: Always call `closeRedis()` during application shutdown
4. **Key Naming**: Use descriptive key names; prefixing is automatic
5. **TTL Usage**: Set expiration times for temporary data using `setex` or `expire`
6. **Streams**: Use Redis Streams for event sourcing and message queues
7. **Health Checks**: Implement regular health checks in your monitoring system

## Performance Considerations

- **Connection Pooling**: The singleton pattern ensures efficient connection reuse
- **Lazy Loading**: Connection is only established when first needed
- **Cluster Support**: Automatic load balancing across cluster nodes
- **Command Pipelining**: Use Redis pipelines for batch operations
- **Memory Management**: Set appropriate TTL values to prevent memory bloat

## Troubleshooting

### Connection Issues
- Check `REDIS_HOST` and `REDIS_PORT` values
- Verify Redis server is running and accessible
- Check firewall and network connectivity

### Authentication Issues
- Ensure `REDIS_PASSWORD` is correctly set
- Verify Redis server authentication configuration

### Cluster Issues
- Verify all cluster nodes are accessible
- Check cluster node discovery and failover behavior
- Monitor cluster health and node status

### Performance Issues
- Monitor connection pool usage
- Check command timeout settings
- Use Redis monitoring tools (Redis CLI, RedisInsight)
- Consider implementing connection health checks
