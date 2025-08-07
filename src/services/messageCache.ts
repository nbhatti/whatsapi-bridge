import { LightMessageMeta } from '../types/analytics.types';
import { getRedisClient } from '../config/redis';
import logger from '../config/logger';
import { MetricsService } from '../config/metrics';

/**
 * Message Cache Service
 * 
 * Caches WhatsApp messages to Redis lists for analytics and monitoring.
 * Maintains separate lists for inbound and outbound messages with automatic trimming
 * to prevent memory issues.
 */
class MessageCacheService {
  private readonly INBOUND_KEY = 'whatsapp:in';
  private readonly OUTBOUND_KEY = 'whatsapp:out';
  private readonly MAX_LIST_SIZE = 10000;

  /**
   * Cache an inbound message
   * Adds message metadata to the whatsapp:in Redis list and trims to maintain size limit
   */
  async cacheInbound(meta: LightMessageMeta): Promise<void> {
    try {
      const redisClient = getRedisClient();
      
      // Serialize the message metadata
      const messageData = JSON.stringify({
        ...meta,
        cachedAt: Date.now(),
        direction: 'inbound'
      });

      // Add to the beginning of the list (LPUSH)
      await redisClient.lpush(this.INBOUND_KEY, messageData);
      
      // Trim list to maintain size limit (keep only the most recent MAX_LIST_SIZE items)
      await redisClient.ltrim(this.INBOUND_KEY, 0, this.MAX_LIST_SIZE - 1);
      
      // Track cache hit metrics
      MetricsService.incrementCacheHits('in', 'set');
      
      logger.debug(`Cached inbound message ${meta.messageId} to ${this.INBOUND_KEY}`);
    } catch (error) {
      logger.error('Failed to cache inbound message:', {
        messageId: meta.messageId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw error to avoid disrupting message processing
    }
  }

  /**
   * Cache an outbound message
   * Adds message metadata to the whatsapp:out Redis list and trims to maintain size limit
   */
  async cacheOutbound(meta: LightMessageMeta): Promise<void> {
    try {
      const redisClient = getRedisClient();
      
      // Serialize the message metadata
      const messageData = JSON.stringify({
        ...meta,
        cachedAt: Date.now(),
        direction: 'outbound'
      });

      // Add to the beginning of the list (LPUSH)
      await redisClient.lpush(this.OUTBOUND_KEY, messageData);
      
      // Trim list to maintain size limit (keep only the most recent MAX_LIST_SIZE items)
      await redisClient.ltrim(this.OUTBOUND_KEY, 0, this.MAX_LIST_SIZE - 1);
      
      // Track cache hit metrics
      MetricsService.incrementCacheHits('out', 'set');
      
      logger.debug(`Cached outbound message ${meta.messageId} to ${this.OUTBOUND_KEY}`);
    } catch (error) {
      logger.error('Failed to cache outbound message:', {
        messageId: meta.messageId,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw error to avoid disrupting message processing
    }
  }

  /**
   * Get recent inbound messages
   * @param limit Number of messages to retrieve (default: 100)
   * @returns Array of cached inbound message metadata
   */
  async getRecentInbound(limit: number = 100): Promise<LightMessageMeta[]> {
    try {
      const redisClient = getRedisClient();
      const messages = await redisClient.lrange(this.INBOUND_KEY, 0, limit - 1);
      
      // Track cache get operation
      MetricsService.incrementCacheHits('in', 'get');
      
      return messages.map(messageData => {
        try {
          const parsed = JSON.parse(messageData);
          // Remove cache-specific fields before returning
          const { cachedAt, direction, ...meta } = parsed;
          return meta as LightMessageMeta;
        } catch (parseError) {
          logger.error('Failed to parse cached inbound message:', parseError);
          return null;
        }
      }).filter((meta): meta is LightMessageMeta => meta !== null);
    } catch (error) {
      logger.error('Failed to retrieve inbound messages:', error);
      return [];
    }
  }

  /**
   * Get recent outbound messages
   * @param limit Number of messages to retrieve (default: 100)
   * @returns Array of cached outbound message metadata
   */
  async getRecentOutbound(limit: number = 100): Promise<LightMessageMeta[]> {
    try {
      const redisClient = getRedisClient();
      const messages = await redisClient.lrange(this.OUTBOUND_KEY, 0, limit - 1);
      
      // Track cache get operation
      MetricsService.incrementCacheHits('out', 'get');
      
      return messages.map(messageData => {
        try {
          const parsed = JSON.parse(messageData);
          // Remove cache-specific fields before returning
          const { cachedAt, direction, ...meta } = parsed;
          return meta as LightMessageMeta;
        } catch (parseError) {
          logger.error('Failed to parse cached outbound message:', parseError);
          return null;
        }
      }).filter((meta): meta is LightMessageMeta => meta !== null);
    } catch (error) {
      logger.error('Failed to retrieve outbound messages:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   * @returns Object containing cache size information
   */
  async getCacheStats(): Promise<{ inbound: number; outbound: number }> {
    try {
      const redisClient = getRedisClient();
      const [inboundCount, outboundCount] = await Promise.all([
        redisClient.llen(this.INBOUND_KEY),
        redisClient.llen(this.OUTBOUND_KEY)
      ]);

      return {
        inbound: inboundCount,
        outbound: outboundCount
      };
    } catch (error) {
      logger.error('Failed to get cache statistics:', error);
      return { inbound: 0, outbound: 0 };
    }
  }

  /**
   * Clear all cached messages
   * WARNING: This will delete all cached message data
   */
  async clearCache(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      await Promise.all([
        redisClient.del(this.INBOUND_KEY),
        redisClient.del(this.OUTBOUND_KEY)
      ]);
      
      // Track full cache flush
      MetricsService.incrementCacheFlushes('full');
      
      logger.info('Message cache cleared');
    } catch (error) {
      logger.error('Failed to clear message cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
const messageCacheService = new MessageCacheService();

/**
 * Cache an inbound message
 * @param meta Message metadata to cache
 */
export const cacheInbound = (meta: LightMessageMeta): Promise<void> => {
  return messageCacheService.cacheInbound(meta);
};

/**
 * Cache an outbound message
 * @param meta Message metadata to cache
 */
export const cacheOutbound = (meta: LightMessageMeta): Promise<void> => {
  return messageCacheService.cacheOutbound(meta);
};

/**
 * Get recent inbound messages
 * @param limit Number of messages to retrieve
 * @returns Array of cached inbound message metadata
 */
export const getRecentInbound = (limit?: number): Promise<LightMessageMeta[]> => {
  return messageCacheService.getRecentInbound(limit);
};

/**
 * Get recent outbound messages
 * @param limit Number of messages to retrieve
 * @returns Array of cached outbound message metadata
 */
export const getRecentOutbound = (limit?: number): Promise<LightMessageMeta[]> => {
  return messageCacheService.getRecentOutbound(limit);
};

/**
 * Get cache statistics
 * @returns Object containing cache size information
 */
export const getCacheStats = (): Promise<{ inbound: number; outbound: number }> => {
  return messageCacheService.getCacheStats();
};

/**
 * Clear all cached messages
 * WARNING: This will delete all cached message data
 */
export const clearCache = (): Promise<void> => {
  return messageCacheService.clearCache();
};

export default messageCacheService;
