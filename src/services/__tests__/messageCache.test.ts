import { LightMessageMeta } from '../../types/analytics.types';
import messageCacheService, {
  cacheInbound,
  cacheOutbound,
  getRecentInbound,
  getRecentOutbound,
  getCacheStats,
  clearCache
} from '../messageCache';
import redisMock from 'redis-mock';

// Mock the actual Redis config to use redis-mock
jest.mock('../../config/redis', () => {
  const mockRedisClient = redisMock.createClient();
  return {
    getRedisClient: jest.fn(() => mockRedisClient)
  };
});

// Mock the metrics service
jest.mock('../../config/metrics', () => ({
  MetricsService: {
    incrementCacheHits: jest.fn(),
    incrementCacheFlushes: jest.fn()
  }
}));

// Mock logger to avoid noise in tests
jest.mock('../../config/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Message Cache Service with Redis Mock', () => {
  const mockMessageMeta: LightMessageMeta = {
    messageId: 'test-message-id-' + Date.now(),
    chatId: 'test-chat@c.us',
    sender: 'test-sender@c.us',
    timestamp: Date.now(),
    type: 'text',
    meta: {
      fromMe: false,
      isGroup: false,
      hasMedia: false,
      isForwarded: false,
      isReply: false,
      mentionCount: 0,
      deviceId: 'test-device-id'
    }
  };

  const mockOutboundMessageMeta: LightMessageMeta = {
    messageId: 'test-outbound-message-id-' + Date.now(),
    chatId: 'test-outbound-chat@c.us',
    sender: 'test-outbound-sender@c.us',
    timestamp: Date.now(),
    type: 'text',
    meta: {
      fromMe: true,
      isGroup: true,
      hasMedia: true,
      isForwarded: false,
      isReply: true,
      mentionCount: 2,
      deviceId: 'test-device-id'
    }
  };

  beforeEach(async () => {
    // Clear all Redis data before each test
    const { getRedisClient } = require('../../config/redis');
    const client = getRedisClient();
    await client.flushdb();
    jest.clearAllMocks();
  });

  describe('Cache Operations', () => {
    describe('cacheInbound', () => {
      it('should cache inbound message successfully', async () => {
        await expect(cacheInbound(mockMessageMeta)).resolves.toBeUndefined();

        // Verify the message was cached
        const recentInbound = await getRecentInbound(1);
        expect(recentInbound).toHaveLength(1);
        expect(recentInbound[0]).toMatchObject({
          messageId: mockMessageMeta.messageId,
          chatId: mockMessageMeta.chatId,
          sender: mockMessageMeta.sender,
          type: mockMessageMeta.type
        });
      });

      it('should handle multiple inbound messages and maintain order', async () => {
        const message1 = { ...mockMessageMeta, messageId: 'msg-1', timestamp: 1000 };
        const message2 = { ...mockMessageMeta, messageId: 'msg-2', timestamp: 2000 };
        const message3 = { ...mockMessageMeta, messageId: 'msg-3', timestamp: 3000 };

        await cacheInbound(message1);
        await cacheInbound(message2);
        await cacheInbound(message3);

        const recentInbound = await getRecentInbound(5);
        expect(recentInbound).toHaveLength(3);
        
        // Most recent should be first (LPUSH adds to beginning)
        expect(recentInbound[0].messageId).toBe('msg-3');
        expect(recentInbound[1].messageId).toBe('msg-2');
        expect(recentInbound[2].messageId).toBe('msg-1');
      });

      it('should not throw error on Redis failure', async () => {
        // Mock Redis to throw an error
        const { getRedisClient } = require('../../config/redis');
        const client = getRedisClient();
        jest.spyOn(client, 'lpush').mockRejectedValueOnce(new Error('Redis connection failed'));

        await expect(cacheInbound(mockMessageMeta)).resolves.toBeUndefined();
      });
    });

    describe('cacheOutbound', () => {
      it('should cache outbound message successfully', async () => {
        await expect(cacheOutbound(mockOutboundMessageMeta)).resolves.toBeUndefined();

        const recentOutbound = await getRecentOutbound(1);
        expect(recentOutbound).toHaveLength(1);
        expect(recentOutbound[0]).toMatchObject({
          messageId: mockOutboundMessageMeta.messageId,
          chatId: mockOutboundMessageMeta.chatId,
          sender: mockOutboundMessageMeta.sender,
          type: mockOutboundMessageMeta.type,
          meta: expect.objectContaining({
            fromMe: true,
            isGroup: true,
            hasMedia: true,
            mentionCount: 2
          })
        });
      });

      it('should handle mixed inbound and outbound messages', async () => {
        await cacheInbound(mockMessageMeta);
        await cacheOutbound(mockOutboundMessageMeta);

        const recentInbound = await getRecentInbound(5);
        const recentOutbound = await getRecentOutbound(5);

        expect(recentInbound).toHaveLength(1);
        expect(recentOutbound).toHaveLength(1);
        expect(recentInbound[0].messageId).toBe(mockMessageMeta.messageId);
        expect(recentOutbound[0].messageId).toBe(mockOutboundMessageMeta.messageId);
      });
    });
  });

  describe('Retrieval Operations', () => {
    beforeEach(async () => {
      // Setup test data
      const inboundMessages = Array.from({ length: 5 }, (_, i) => ({
        ...mockMessageMeta,
        messageId: `inbound-${i}`,
        timestamp: 1000 + i
      }));

      const outboundMessages = Array.from({ length: 3 }, (_, i) => ({
        ...mockOutboundMessageMeta,
        messageId: `outbound-${i}`,
        timestamp: 2000 + i
      }));

      for (const msg of inboundMessages) {
        await cacheInbound(msg);
      }
      for (const msg of outboundMessages) {
        await cacheOutbound(msg);
      }
    });

    describe('getRecentInbound', () => {
      it('should return recent inbound messages with default limit', async () => {
        const messages = await getRecentInbound();
        expect(messages).toHaveLength(5);
        expect(messages[0].messageId).toBe('inbound-4'); // Most recent first
      });

      it('should respect custom limit', async () => {
        const messages = await getRecentInbound(2);
        expect(messages).toHaveLength(2);
        expect(messages[0].messageId).toBe('inbound-4');
        expect(messages[1].messageId).toBe('inbound-3');
      });

      it('should handle limit larger than available messages', async () => {
        const messages = await getRecentInbound(100);
        expect(messages).toHaveLength(5);
      });

      it('should return empty array when no messages exist', async () => {
        await clearCache();
        const messages = await getRecentInbound();
        expect(messages).toHaveLength(0);
      });
    });

    describe('getRecentOutbound', () => {
      it('should return recent outbound messages', async () => {
        const messages = await getRecentOutbound();
        expect(messages).toHaveLength(3);
        expect(messages[0].messageId).toBe('outbound-2');
      });

      it('should handle parsing errors gracefully', async () => {
        // Inject invalid JSON into Redis list
        const { getRedisClient } = require('../../config/redis');
        const client = getRedisClient();
        await client.lpush('whatsapp:out', 'invalid-json-data');

        const messages = await getRecentOutbound();
        // Should still return valid messages, filtering out invalid ones
        expect(messages).toHaveLength(3);
      });
    });
  });

  describe('Statistics and Maintenance', () => {
    beforeEach(async () => {
      // Add test data
      for (let i = 0; i < 10; i++) {
        await cacheInbound({ ...mockMessageMeta, messageId: `in-${i}` });
      }
      for (let i = 0; i < 5; i++) {
        await cacheOutbound({ ...mockOutboundMessageMeta, messageId: `out-${i}` });
      }
    });

    describe('getCacheStats', () => {
      it('should return accurate cache statistics', async () => {
        const stats = await getCacheStats();
        expect(stats).toEqual({
          inbound: 10,
          outbound: 5
        });
      });

      it('should handle Redis errors gracefully', async () => {
        const { getRedisClient } = require('../../config/redis');
        const client = getRedisClient();
        jest.spyOn(client, 'llen').mockRejectedValueOnce(new Error('Connection failed'));

        const stats = await getCacheStats();
        expect(stats).toEqual({
          inbound: 0,
          outbound: 0
        });
      });
    });

    describe('clearCache', () => {
      it('should clear all cached messages', async () => {
        // Verify data exists
        const initialStats = await getCacheStats();
        expect(initialStats.inbound).toBe(10);
        expect(initialStats.outbound).toBe(5);

        // Clear cache
        await clearCache();

        // Verify data is cleared
        const finalStats = await getCacheStats();
        expect(finalStats).toEqual({
          inbound: 0,
          outbound: 0
        });

        const inboundMessages = await getRecentInbound();
        const outboundMessages = await getRecentOutbound();
        expect(inboundMessages).toHaveLength(0);
        expect(outboundMessages).toHaveLength(0);
      });

      it('should handle Redis delete errors', async () => {
        const { getRedisClient } = require('../../config/redis');
        const client = getRedisClient();
        jest.spyOn(client, 'del').mockRejectedValueOnce(new Error('Delete failed'));

        await expect(clearCache()).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty message metadata gracefully', async () => {
      const emptyMessage = {
        messageId: '',
        chatId: '',
        sender: '',
        timestamp: 0,
        type: 'text' as const,
        meta: {
          fromMe: false,
          isGroup: false,
          hasMedia: false,
          isForwarded: false,
          isReply: false,
          mentionCount: 0,
          deviceId: ''
        }
      };

      await expect(cacheInbound(emptyMessage)).resolves.toBeUndefined();
      const messages = await getRecentInbound(1);
      expect(messages).toHaveLength(1);
      expect(messages[0].messageId).toBe('');
    });

    it('should handle very large message count', async () => {
      // This tests the list trimming functionality
      const largeMessageSet = Array.from({ length: 12000 }, (_, i) => ({
        ...mockMessageMeta,
        messageId: `bulk-${i}`,
        timestamp: i
      }));

      // Cache all messages
      for (const msg of largeMessageSet) {
        await cacheInbound(msg);
      }

      // Should be trimmed to MAX_LIST_SIZE (10000)
      const stats = await getCacheStats();
      expect(stats.inbound).toBeLessThanOrEqual(10000);

      // Most recent messages should be preserved
      const recentMessages = await getRecentInbound(5);
      expect(recentMessages[0].messageId).toBe('bulk-11999');
    });

    it('should preserve message metadata integrity', async () => {
      const complexMessage: LightMessageMeta = {
        messageId: 'complex-msg-123',
        chatId: 'group-chat@g.us',
        sender: 'user123@c.us',
        timestamp: 1234567890123,
        type: 'image',
        meta: {
          fromMe: false,
          isGroup: true,
          hasMedia: true,
          isForwarded: true,
          isReply: true,
          mentionCount: 5,
          deviceId: 'device-xyz-789'
        }
      };

      await cacheInbound(complexMessage);
      const retrieved = await getRecentInbound(1);

      expect(retrieved[0]).toEqual(complexMessage);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle concurrent cache operations', async () => {
      const concurrentOperations = Array.from({ length: 50 }, (_, i) => 
        cacheInbound({ ...mockMessageMeta, messageId: `concurrent-${i}` })
      );

      await Promise.all(concurrentOperations);

      const stats = await getCacheStats();
      expect(stats.inbound).toBe(50);
    });

    it('should efficiently retrieve large result sets', async () => {
      // Add 1000 messages
      for (let i = 0; i < 1000; i++) {
        await cacheInbound({ ...mockMessageMeta, messageId: `perf-${i}` });
      }

      const startTime = Date.now();
      const messages = await getRecentInbound(500);
      const endTime = Date.now();

      expect(messages).toHaveLength(500);
      // Should complete within reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
