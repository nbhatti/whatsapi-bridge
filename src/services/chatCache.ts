import { getRedisClient } from '../config/redis';
import logger from '../config/logger';
import { MetricsService } from '../config/metrics';
import { Chat } from 'whatsapp-web.js';

/**
 * Chat Cache Service
 * 
 * Caches WhatsApp chat data with TTL for fast analytics and AI analysis.
 * Includes chat lists, chat metadata, and participant information.
 */

export interface CachedChat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  archived: boolean;
  pinned: boolean;
  muted: boolean;
  participantCount?: number;
  lastMessage?: {
    body: string;
    timestamp: number;
    fromMe: boolean;
    messageId?: string;
  };
  cachedAt: number;
  deviceId: string;
}

export interface CachedChatList {
  chats: CachedChat[];
  totalCount: number;
  cachedAt: number;
  deviceId: string;
  expiresAt: number;
}

class ChatCacheService {
  private readonly CHAT_LIST_KEY_PREFIX = 'whatsapp:chats:list:';
  private readonly CHAT_DETAIL_KEY_PREFIX = 'whatsapp:chats:detail:';
  private readonly CHAT_PARTICIPANTS_KEY_PREFIX = 'whatsapp:chats:participants:';
  
  // TTL settings
  private readonly CHAT_LIST_TTL = 5 * 60; // 5 minutes for chat lists
  private readonly CHAT_DETAIL_TTL = 10 * 60; // 10 minutes for individual chats
  private readonly CHAT_PARTICIPANTS_TTL = 30 * 60; // 30 minutes for participants

  /**
   * Cache the complete chat list for a device
   */
  async cacheChatList(deviceId: string, chats: Chat[]): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const key = `${this.CHAT_LIST_KEY_PREFIX}${deviceId}`;
      
      // Convert WhatsApp chats to cached format
      const cachedChats: CachedChat[] = chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        archived: chat.archived || false,
        pinned: chat.pinned || false,
        muted: chat.isMuted || false,
        participantCount: chat.isGroup ? (chat as any).participants?.length : undefined,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body || '',
          timestamp: chat.lastMessage.timestamp,
          fromMe: chat.lastMessage.fromMe,
          messageId: chat.lastMessage.id?._serialized,
        } : undefined,
        cachedAt: Date.now(),
        deviceId,
      }));

      const cacheData: CachedChatList = {
        chats: cachedChats,
        totalCount: chats.length,
        cachedAt: Date.now(),
        deviceId,
        expiresAt: Date.now() + (this.CHAT_LIST_TTL * 1000),
      };

      await redisClient.setex(key, this.CHAT_LIST_TTL, JSON.stringify(cacheData));
      
      // Track metrics
      MetricsService.incrementCacheHits('chats', 'set');
      
      logger.debug(`Cached ${chats.length} chats for device ${deviceId} with TTL ${this.CHAT_LIST_TTL}s`);
    } catch (error) {
      logger.error('Failed to cache chat list:', {
        deviceId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get cached chat list for a device
   */
  async getCachedChatList(deviceId: string): Promise<CachedChatList | null> {
    try {
      const redisClient = getRedisClient();
      const key = `${this.CHAT_LIST_KEY_PREFIX}${deviceId}`;
      
      const cached = await redisClient.get(key);
      if (!cached) {
        MetricsService.incrementCacheHits('chats', 'miss');
        return null;
      }

      const cacheData: CachedChatList = JSON.parse(cached);
      
      // Check if cache is expired (double-check)
      if (Date.now() > cacheData.expiresAt) {
        await redisClient.del(key);
        MetricsService.incrementCacheHits('chats', 'expired');
        return null;
      }

      MetricsService.incrementCacheHits('chats', 'hit');
      logger.debug(`Cache hit for chat list device ${deviceId} (${cacheData.chats.length} chats)`);
      
      return cacheData;
    } catch (error) {
      logger.error('Failed to get cached chat list:', {
        deviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Cache individual chat details
   */
  async cacheChatDetail(deviceId: string, chatId: string, chat: Chat): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const key = `${this.CHAT_DETAIL_KEY_PREFIX}${deviceId}:${chatId}`;
      
      const cachedChat: CachedChat = {
        id: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        archived: chat.archived || false,
        pinned: chat.pinned || false,
        muted: chat.isMuted || false,
        participantCount: chat.isGroup ? (chat as any).participants?.length : undefined,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body || '',
          timestamp: chat.lastMessage.timestamp,
          fromMe: chat.lastMessage.fromMe,
          messageId: chat.lastMessage.id?._serialized,
        } : undefined,
        cachedAt: Date.now(),
        deviceId,
      };

      await redisClient.setex(key, this.CHAT_DETAIL_TTL, JSON.stringify(cachedChat));
      
      MetricsService.incrementCacheHits('chat_details', 'set');
      logger.debug(`Cached chat details for ${chatId} on device ${deviceId}`);
    } catch (error) {
      logger.error('Failed to cache chat detail:', {
        deviceId,
        chatId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get cached individual chat details
   */
  async getCachedChatDetail(deviceId: string, chatId: string): Promise<CachedChat | null> {
    try {
      const redisClient = getRedisClient();
      const key = `${this.CHAT_DETAIL_KEY_PREFIX}${deviceId}:${chatId}`;
      
      const cached = await redisClient.get(key);
      if (!cached) {
        MetricsService.incrementCacheHits('chat_details', 'miss');
        return null;
      }

      const cachedChat: CachedChat = JSON.parse(cached);
      MetricsService.incrementCacheHits('chat_details', 'hit');
      
      return cachedChat;
    } catch (error) {
      logger.error('Failed to get cached chat detail:', {
        deviceId,
        chatId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Cache chat participants (for groups)
   */
  async cacheChatParticipants(deviceId: string, chatId: string, participants: any[]): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const key = `${this.CHAT_PARTICIPANTS_KEY_PREFIX}${deviceId}:${chatId}`;
      
      const participantData = {
        chatId,
        deviceId,
        participants: participants.map(p => ({
          id: p.id._serialized,
          isAdmin: p.isAdmin || false,
          isSuperAdmin: p.isSuperAdmin || false,
        })),
        count: participants.length,
        cachedAt: Date.now(),
      };

      await redisClient.setex(key, this.CHAT_PARTICIPANTS_TTL, JSON.stringify(participantData));
      
      MetricsService.incrementCacheHits('chat_participants', 'set');
      logger.debug(`Cached ${participants.length} participants for chat ${chatId} on device ${deviceId}`);
    } catch (error) {
      logger.error('Failed to cache chat participants:', {
        deviceId,
        chatId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Invalidate cache for a specific device
   */
  async invalidateDeviceCache(deviceId: string): Promise<void> {
    try {
      const redisClient = getRedisClient();
      
      // Find all cache keys for this device
      const patterns = [
        `${this.CHAT_LIST_KEY_PREFIX}${deviceId}`,
        `${this.CHAT_DETAIL_KEY_PREFIX}${deviceId}:*`,
        `${this.CHAT_PARTICIPANTS_KEY_PREFIX}${deviceId}:*`,
      ];

      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          // Use SCAN for pattern matching
          const keys = await this.scanKeys(pattern);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        } else {
          await redisClient.del(pattern);
        }
      }

      MetricsService.incrementCacheFlushes('device_invalidation');
      logger.info(`Invalidated all chat cache for device ${deviceId}`);
    } catch (error) {
      logger.error('Failed to invalidate device cache:', {
        deviceId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Invalidate cache for a specific chat across all devices
   */
  async invalidateChatCache(chatId: string): Promise<void> {
    try {
      const redisClient = getRedisClient();
      
      const patterns = [
        `${this.CHAT_DETAIL_KEY_PREFIX}*:${chatId}`,
        `${this.CHAT_PARTICIPANTS_KEY_PREFIX}*:${chatId}`,
      ];

      for (const pattern of patterns) {
        const keys = await this.scanKeys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }

      MetricsService.incrementCacheFlushes('chat_invalidation');
      logger.info(`Invalidated cache for chat ${chatId} across all devices`);
    } catch (error) {
      logger.error('Failed to invalidate chat cache:', {
        chatId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    chatLists: number;
    chatDetails: number;
    chatParticipants: number;
  }> {
    try {
      const redisClient = getRedisClient();
      
      const [chatLists, chatDetails, chatParticipants] = await Promise.all([
        this.countKeys(`${this.CHAT_LIST_KEY_PREFIX}*`),
        this.countKeys(`${this.CHAT_DETAIL_KEY_PREFIX}*`),
        this.countKeys(`${this.CHAT_PARTICIPANTS_KEY_PREFIX}*`),
      ]);

      return { chatLists, chatDetails, chatParticipants };
    } catch (error) {
      logger.error('Failed to get chat cache statistics:', error);
      return { chatLists: 0, chatDetails: 0, chatParticipants: 0 };
    }
  }

  /**
   * Clear all chat cache
   */
  async clearAllChatCache(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      
      const patterns = [
        `${this.CHAT_LIST_KEY_PREFIX}*`,
        `${this.CHAT_DETAIL_KEY_PREFIX}*`,
        `${this.CHAT_PARTICIPANTS_KEY_PREFIX}*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.scanKeys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }

      MetricsService.incrementCacheFlushes('chat_clear_all');
      logger.info('Cleared all chat cache');
    } catch (error) {
      logger.error('Failed to clear all chat cache:', error);
    }
  }

  /**
   * Helper method to scan keys by pattern
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const redisClient = getRedisClient();
    const keys: string[] = [];
    let cursor = '0';

    do {
      const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      keys.push(...reply[1]);
    } while (cursor !== '0');

    return keys;
  }

  /**
   * Helper method to count keys by pattern
   */
  private async countKeys(pattern: string): Promise<number> {
    const keys = await this.scanKeys(pattern);
    return keys.length;
  }
}

// Export singleton instance
const chatCacheService = new ChatCacheService();

/**
 * Cache chat list for a device
 */
export const cacheChatList = (deviceId: string, chats: Chat[]): Promise<void> => {
  return chatCacheService.cacheChatList(deviceId, chats);
};

/**
 * Get cached chat list for a device
 */
export const getCachedChatList = (deviceId: string): Promise<CachedChatList | null> => {
  return chatCacheService.getCachedChatList(deviceId);
};

/**
 * Cache individual chat details
 */
export const cacheChatDetail = (deviceId: string, chatId: string, chat: Chat): Promise<void> => {
  return chatCacheService.cacheChatDetail(deviceId, chatId, chat);
};

/**
 * Get cached individual chat details
 */
export const getCachedChatDetail = (deviceId: string, chatId: string): Promise<CachedChat | null> => {
  return chatCacheService.getCachedChatDetail(deviceId, chatId);
};

/**
 * Cache chat participants
 */
export const cacheChatParticipants = (deviceId: string, chatId: string, participants: any[]): Promise<void> => {
  return chatCacheService.cacheChatParticipants(deviceId, chatId, participants);
};

/**
 * Invalidate cache for a specific device
 */
export const invalidateDeviceCache = (deviceId: string): Promise<void> => {
  return chatCacheService.invalidateDeviceCache(deviceId);
};

/**
 * Invalidate cache for a specific chat
 */
export const invalidateChatCache = (chatId: string): Promise<void> => {
  return chatCacheService.invalidateChatCache(chatId);
};

/**
 * Get cache statistics
 */
export const getChatCacheStats = (): Promise<{ chatLists: number; chatDetails: number; chatParticipants: number }> => {
  return chatCacheService.getCacheStats();
};

/**
 * Clear all chat cache
 */
export const clearAllChatCache = (): Promise<void> => {
  return chatCacheService.clearAllChatCache();
};

export default chatCacheService;
