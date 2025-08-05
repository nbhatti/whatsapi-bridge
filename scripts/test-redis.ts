#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { getRedisClient, initializeRedis, closeRedis } from '../src/config/redis';
import logger from '../src/config/logger';

// Load environment variables
dotenv.config();

async function testRedisConnection() {
  try {
    logger.info('Testing Redis connection...');
    
    // Initialize Redis
    await initializeRedis();
    
    const client = getRedisClient();
    
    // Test basic operations
    await client.set('test:key', 'Hello Redis!');
    const value = await client.get('test:key');
    
    logger.info(`Test key value: ${value}`);
    
    // Test ping
    const pong = await client.ping();
    logger.info(`Ping response: ${pong}`);
    
    // Clean up test key
    await client.del('test:key');
    
    logger.info('✅ Redis connection test successful!');
    
  } catch (error) {
    logger.error('❌ Redis connection test failed:', error);
  } finally {
    // Close connection
    await closeRedis();
    process.exit(0);
  }
}

// Run the test
testRedisConnection();
