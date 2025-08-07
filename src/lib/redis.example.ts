/**
 * Example usage of the Redis client wrapper
 * 
 * This file demonstrates how to use the Redis client with the singleton pattern,
 * key prefixing, and various Redis operations including streams and clustering support.
 */

import { 
  getRedis, 
  closeRedis, 
  getKeyPrefix, 
  prefixKey, 
  unprefixKey, 
  redisHealthCheck,
  getConnectionInfo 
} from './redis';

async function exampleUsage() {
  try {
    // Get Redis client instance (creates connection lazily)
    const redis = await getRedis();
    
    // Basic operations with automatic key prefixing
    await redis.set('user:123', JSON.stringify({ name: 'John', email: 'john@example.com' }));
    const user = await redis.get('user:123');
    console.log('User:', user);

    // Hash operations
    await redis.hset('session:abc123', {
      userId: '123',
      loginTime: Date.now().toString(),
      deviceType: 'mobile'
    });
    const sessionData = await redis.hgetall('session:abc123');
    console.log('Session:', sessionData);

    // List operations for message queues
    await redis.lpush('message_queue', JSON.stringify({ 
      to: '+1234567890',
      message: 'Hello from WhatsApp API',
      timestamp: Date.now()
    }));
    const message = await redis.rpop('message_queue');
    console.log('Queued message:', message);

    // Set operations for unique collections
    await redis.sadd('active_sessions', 'session:abc123', 'session:def456');
    const activeSessions = await redis.smembers('active_sessions');
    console.log('Active sessions:', activeSessions);

    // Sorted set for rate limiting or leaderboards
    await redis.zadd('api_requests', Date.now(), 'user:123');
    const recentRequests = await redis.zrevrangebyscore('api_requests', '+inf', Date.now() - 3600000);
    console.log('Recent API requests:', recentRequests);

    // Redis Streams example (great for event sourcing or message streaming)
    await redis.xadd('whatsapp:events', '*', 
      'event', 'message_sent',
      'userId', '123',
      'to', '+1234567890',
      'timestamp', Date.now().toString()
    );

    // Read from stream
    const events = await redis.xrange('whatsapp:events', '-', '+', 'COUNT', 10);
    console.log('WhatsApp events:', events);

    // Key expiration for temporary data
    await redis.setex('temp_token:user123', 300, 'temporary_access_token'); // 5 minutes TTL

    // Pub/Sub example
    const subscriber = redis.duplicate();
    await subscriber.subscribe('whatsapp:notifications');
    
    subscriber.on('message', (channel, message) => {
      console.log(`Received on ${channel}:`, message);
    });

    // Publish a message
    await redis.publish('whatsapp:notifications', JSON.stringify({
      type: 'new_message',
      from: '+0987654321',
      preview: 'Hello there!'
    }));

    // Key prefix utilities
    console.log('Current key prefix:', getKeyPrefix());
    console.log('Prefixed key:', prefixKey('my_key'));
    console.log('Unprefixed key:', unprefixKey(prefixKey('my_key')));

    // Health check
    const healthStatus = await redisHealthCheck();
    console.log('Redis health:', healthStatus);

    // Connection info
    const connectionInfo = getConnectionInfo();
    console.log('Connection info:', connectionInfo);

    // Cleanup subscriber
    await subscriber.unsubscribe();
    await subscriber.disconnect();

  } catch (error) {
    console.error('Redis example error:', error);
  }
}

// Graceful shutdown example
async function gracefulShutdown() {
  console.log('Shutting down Redis connection...');
  await closeRedis();
  console.log('Redis connection closed');
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage()
    .then(() => console.log('Redis example completed'))
    .catch(console.error);
}
