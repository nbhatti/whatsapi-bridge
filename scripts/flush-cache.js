#!/usr/bin/env node

const Redis = require('ioredis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * CLI script to flush WhatsApp cache
 * This script is used by 'npm run cache:flush'
 */
async function flushCache() {
  let redisClient;
  
  try {
    console.log('🔄 Connecting to Redis...');
    
    // Create Redis client with same configuration as the app
    const env = process.env.NODE_ENV || 'development';
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      connectTimeout: 5000,
      commandTimeout: 3000,
      keyPrefix: `whatsapp:${env}:`,
    };

    // Add TLS if configured
    if (process.env.REDIS_TLS === 'true') {
      redisConfig.tls = {};
    }

    redisClient = new Redis(redisConfig);
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      redisClient.on('ready', resolve);
      redisClient.on('error', reject);
      
      // Set timeout for connection
      setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 10000);
    });

    console.log('✅ Connected to Redis');
    console.log('🗑️  Flushing WhatsApp cache...');
    
    // Delete the specific WhatsApp cache keys
    // Note: Redis client automatically adds the key prefix, so we use relative keys
    const keysToDelete = ['in', 'out'];
    const deletedCount = await redisClient.del(...keysToDelete);
    
    console.log(`✅ Cache flushed successfully!`);
    console.log(`📊 Keys removed: ${deletedCount}`);
    console.log(`🔑 Deleted keys: ${keysToDelete.join(', ')}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error flushing cache:', error.message);
    console.error('💡 Make sure Redis is running and environment variables are set correctly');
    process.exit(1);
  } finally {
    if (redisClient) {
      try {
        await redisClient.disconnect();
        console.log('🔌 Disconnected from Redis');
      } catch (disconnectError) {
        console.warn('⚠️  Warning: Error disconnecting from Redis:', disconnectError.message);
      }
    }
  }
}

// Handle process signals for clean exit
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT, exiting...');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM, exiting...');
  process.exit(143);
});

// Run the script
flushCache();
