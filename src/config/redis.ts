import { Redis } from 'ioredis';
import logger, { logError } from './logger';

let redisClient: Redis | null = null;

/**
 * Get Redis client singleton instance
 * Uses REDIS_URL if available, otherwise falls back to individual Redis config variables
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    let redisConfig;

    if (redisUrl) {
      // Use REDIS_URL (preferred for Docker/production)
      redisConfig = redisUrl;
      logger.info('Initializing Redis with REDIS_URL');
    } else {
      // Fallback to individual config variables
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379');
      const password = process.env.REDIS_PASSWORD;
      const db = parseInt(process.env.REDIS_DB || '0');
      
      redisConfig = {
        host,
        port,
        password,
        db,
      };
      logger.info(`Initializing Redis with individual config: ${host}:${port}`);
    }

    if (typeof redisConfig === 'string') {
      redisClient = new Redis(redisConfig, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } else {
      redisClient = new Redis({
        ...redisConfig,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    }

    // Connection event handlers
    redisClient.on('connect', () => {
      logger.info('Connected to Redis successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client is ready');
    });

    redisClient.on('error', (error) => {
      logError('Redis connection error', error);
    });

    redisClient.on('reconnecting', (time: number) => {
      logger.info(`Reconnecting to Redis in ${time}ms`);
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }
  
  return redisClient;
};

/**
 * Initialize Redis connection
 * Call this during application startup
 */
export const initializeRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.connect();
    logger.info('Redis client initialized successfully');
  } catch (error) {
    logError('Failed to initialize Redis client', error);
    throw error;
  }
};

/**
 * Close Redis connection
 * Call this during application shutdown
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logError('Error closing Redis connection', error);
    }
  }
};
