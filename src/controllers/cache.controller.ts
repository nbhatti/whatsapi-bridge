import { Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import logger, { logError, logInfo } from '../config/logger';
import { MetricsService } from '../config/metrics';
import { env } from '../config/env';
import { getChatCacheStats } from '../services/chatCache';

export class CacheController {
  /**
   * DELETE /api/v1/cache
   * Flush WhatsApp message cache by deleting whatsapp:in and whatsapp:out keys
   */
  public static async flushCache(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Flushing WhatsApp message cache');
      
      const redis = getRedisClient();
      
      // Delete the specific WhatsApp cache keys
      const keysToDelete = ['whatsapp:in', 'whatsapp:out'];
      const deletedCount = await redis.del(...keysToDelete);
      
      // Track cache flush metrics
      MetricsService.incrementCacheFlushes('manual');
      
      logInfo(`Cache flushed successfully. Keys removed: ${deletedCount}`);
      
      res.status(200).json({
        flushed: true,
        keysRemoved: deletedCount
      });
    } catch (error) {
      logError('Error flushing cache', error);
      res.status(500).json({
        success: false,
        error: 'Failed to flush cache',
        flushed: false,
        keysRemoved: 0
      });
    }
  }

  /**
   * GET /api/v1/cache/health
   * Returns cache health information including PING latency and list sizes
   */
  public static async cacheHealth(req: Request, res: Response): Promise<void> {
    try {
      const redis = getRedisClient();
      const startTime = Date.now();
      
      // Test Redis connection with PING
      const pingResult = await redis.ping();
      const pingLatency = Date.now() - startTime;
      
      // Update metrics
      MetricsService.setRedisPingLatency(pingLatency);
      
      // Get list sizes for in and out queues
      const inListSize = await redis.llen('whatsapp:in');
      const outListSize = await redis.llen('whatsapp:out');
      
      // Get chat cache statistics
      const chatCacheStats = await getChatCacheStats();
      
      // Update list size metrics
      MetricsService.setCacheListSize('in', inListSize);
      MetricsService.setCacheListSize('out', outListSize);
      
      const healthInfo = {
        status: 'healthy',
        redis: {
          connected: pingResult === 'PONG',
          pingLatencyMs: pingLatency,
          enabled: env.REDIS_ENABLED,
        },
        cache: {
          messages: {
            in: inListSize,
            out: outListSize,
          },
          chats: {
            lists: chatCacheStats.chatLists,
            details: chatCacheStats.chatDetails,
            participants: chatCacheStats.chatParticipants,
          },
          syncIntervalMs: env.SYNC_INTERVAL_MS,
          maxListLength: env.MAX_LIST_LENGTH,
        },
        timestamp: new Date().toISOString(),
      };
      
      logInfo(`Cache health check completed: ping=${pingLatency}ms, messages(in=${inListSize}, out=${outListSize}), chats(lists=${chatCacheStats.chatLists}, details=${chatCacheStats.chatDetails}, participants=${chatCacheStats.chatParticipants})`);
      
      res.status(200).json(healthInfo);
    } catch (error) {
      logError('Cache health check failed', error);
      
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        redis: {
          connected: false,
          enabled: env.REDIS_ENABLED,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
