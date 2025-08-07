#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { getRedis, closeRedis } from '../lib/redis';
import logger from '../config/logger';

// Load environment variables
dotenv.config();

/**
 * CLI script to flush WhatsApp cache
 * This script provides the same functionality as the REST API endpoint
 * but can be run from the command line for DevOps and shell operations
 */
async function flushCache(): Promise<void> {
  try {
    console.log('🔄 Initializing cache flush...');
    
    const redis = await getRedis();
    
    console.log('✅ Connected to Redis');
    console.log('🗑️  Flushing WhatsApp cache...');
    
    // Delete the specific WhatsApp cache keys
    // Note: Redis client automatically adds the key prefix, so we use relative keys
    const keysToDelete = ['in', 'out'];
    const deletedCount = await redis.del(...keysToDelete);
    
    console.log(`✅ Cache flushed successfully!`);
    console.log(`📊 Keys removed: ${deletedCount}`);
    console.log(`🔑 Deleted keys: ${keysToDelete.join(', ')}`);
    
    // Log the operation
    logger.info(`Cache flushed via CLI. Keys removed: ${deletedCount}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error flushing cache:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💡 Make sure Redis is running and environment variables are set correctly');
    
    logger.error('CLI cache flush failed', error);
    process.exit(1);
  } finally {
    try {
      await closeRedis();
      console.log('🔌 Disconnected from Redis');
    } catch (disconnectError) {
      console.warn('⚠️  Warning: Error disconnecting from Redis:', disconnectError instanceof Error ? disconnectError.message : 'Unknown error');
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
