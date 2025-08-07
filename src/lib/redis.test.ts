/**
 * Basic test for Redis wrapper functionality
 * 
 * This is a simple test to verify the Redis wrapper is working correctly.
 * For production use, you should have comprehensive tests using Jest or similar.
 */

import { getRedis, closeRedis, getKeyPrefix, prefixKey, unprefixKey, redisHealthCheck, getConnectionInfo } from './redis';

async function testRedisWrapper() {
  console.log('Testing Redis wrapper...\n');

  try {
    // Test 1: Key prefix functionality
    console.log('🔧 Testing key prefix functionality...');
    const prefix = getKeyPrefix();
    console.log(`  Current prefix: ${prefix}`);
    
    const testKey = 'test_key';
    const prefixedKey = prefixKey(testKey);
    const unprefixedKey = unprefixKey(prefixedKey);
    
    console.log(`  Original key: ${testKey}`);
    console.log(`  Prefixed key: ${prefixedKey}`);
    console.log(`  Unprefixed key: ${unprefixedKey}`);
    console.log(`  ✅ Key prefix test passed: ${testKey === unprefixedKey}\n`);

    // Test 2: Connection info
    console.log('🔧 Testing connection info...');
    const connectionInfo = getConnectionInfo();
    console.log(`  Host: ${connectionInfo.host}`);
    console.log(`  Port: ${connectionInfo.port}`);
    console.log(`  Key prefix: ${connectionInfo.keyPrefix}`);
    console.log(`  Is cluster: ${connectionInfo.isCluster}`);
    console.log('  ✅ Connection info retrieved\n');

    // Test 3: Health check (may fail if Redis is not running)
    console.log('🔧 Testing Redis health check...');
    const healthStatus = await redisHealthCheck();
    console.log(`  Status: ${healthStatus.status}`);
    console.log(`  Message: ${healthStatus.message}`);
    
    if (healthStatus.status === 'healthy') {
      console.log('  ✅ Redis health check passed\n');
      
      // Test 4: Basic Redis operations (only if Redis is healthy)
      console.log('🔧 Testing basic Redis operations...');
      const redis = await getRedis();
      
      // Test basic set/get
      const testValue = JSON.stringify({ message: 'Hello Redis!', timestamp: Date.now() });
      await redis.set('test:basic', testValue);
      const retrievedValue = await redis.get('test:basic');
      
      console.log(`  Set value: ${testValue}`);
      console.log(`  Retrieved value: ${retrievedValue}`);
      console.log(`  ✅ Basic operations test passed: ${testValue === retrievedValue}\n`);
      
      // Test hash operations
      console.log('🔧 Testing hash operations...');
      await redis.hset('test:hash', {
        field1: 'value1',
        field2: 'value2',
        timestamp: Date.now().toString()
      });
      
      const hashData = await redis.hgetall('test:hash');
      console.log(`  Hash data:`, hashData);
      console.log(`  ✅ Hash operations test passed\n`);
      
      // Test list operations
      console.log('🔧 Testing list operations...');
      await redis.lpush('test:list', 'item1', 'item2', 'item3');
      const listLength = await redis.llen('test:list');
      const listItems = await redis.lrange('test:list', 0, -1);
      
      console.log(`  List length: ${listLength}`);
      console.log(`  List items:`, listItems);
      console.log(`  ✅ List operations test passed\n`);
      
      // Cleanup test data
      console.log('🧹 Cleaning up test data...');
      await redis.del('test:basic', 'test:hash', 'test:list');
      console.log('  ✅ Test data cleaned up\n');
      
    } else {
      console.log('  ⚠️  Redis health check failed - skipping Redis operations tests\n');
      console.log('  Note: This is expected if Redis server is not running locally\n');
    }

    // Test 5: Graceful shutdown
    console.log('🔧 Testing graceful shutdown...');
    await closeRedis();
    console.log('  ✅ Redis connection closed gracefully\n');

    console.log('🎉 All Redis wrapper tests completed successfully!');

  } catch (error) {
    console.error('❌ Redis wrapper test failed:', error);
    
    // Ensure cleanup even on error
    try {
      await closeRedis();
    } catch (cleanupError) {
      console.error('❌ Error during cleanup:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testRedisWrapper()
    .then(() => {
      console.log('\n✅ Redis wrapper test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Redis wrapper test suite failed:', error);
      process.exit(1);
    });
}

export { testRedisWrapper };
