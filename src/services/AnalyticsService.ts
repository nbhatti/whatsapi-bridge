import { getRedisClient } from '../config/redis';
import { DeviceManager } from './DeviceManager';
import { AIService } from './AIService';
import { logger } from '../config';
import { ANALYTICS_DEFAULTS } from '../config/constants';
import { Redis } from 'ioredis';
import { Chat, Message } from 'whatsapp-web.js';

interface ChatAnalytics {
  id: string;
  name: string;
  isGroup: boolean;
  phoneNumber?: string;
  totalMessages: number;
  unreadCount: number;
  lastMessageTime: number;
  firstMessageTime: number;
  avgResponseTime: number;
  sentByMe: number;
  receivedFromThem: number;
  messageTypes: {
    text: number;
    media: number;
    audio: number;
    document: number;
    sticker: number;
    location: number;
  };
  conversationGaps: number[];
  lastActivity: number;
  engagementScore: number;
  responseRate: number;
}

interface MessageAnalytics {
  id: string;
  chatId: string;
  timestamp: number;
  fromMe: boolean;
  messageType: string;
  body: string;
  hasMedia: boolean;
  isForwarded: boolean;
  mentions: string[];
  isReply: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  wordCount: number;
  responseTime?: number; // milliseconds to respond to previous message
}

interface AnalyticsDashboard {
  overview: {
    totalChats: number;
    totalMessages: number;
    unreadChats: number;
    unreadMessages: number;
    avgDailyMessages: number;
    responseRate: number;
    oldestUnreadMessage: {
      chatName: string;
      timestamp: number;
      daysSince: number;
    } | null;
  };
  topSenders: Array<{
    name: string;
    chatId: string;
    isGroup: boolean;
    messageCount: number;
    lastMessage: string;
    lastMessageTime: number;
    avgMessagesPerDay: number;
  }>;
  conversationHealth: {
    healthyConversations: number;
    oneWayConversations: number;
    neglectedChats: number;
    avgEngagementScore: number;
  };
  timePatterns: {
    peakHours: number[];
    mostActiveDay: string;
    avgResponseTimeMinutes: number;
  };
  aiInsights: {
    summary: string;
    recommendations: string[];
    sentimentOverview: {
      positive: number;
      negative: number;
      neutral: number;
    };
    communicationStyle: string;
  };
}

export class AnalyticsService {
  private redisClient: Redis;
  private deviceManager: DeviceManager;
  private aiService: AIService;
  private static readonly ANALYTICS_PREFIX = 'whatsapp:analytics:';
  private static readonly MESSAGE_HISTORY_PREFIX = 'whatsapp:msg_history:';
  private static readonly CHAT_STATS_PREFIX = 'whatsapp:chat_stats:';

  constructor() {
    this.redisClient = getRedisClient();
    this.deviceManager = DeviceManager.getInstance();
    this.aiService = AIService.getInstance();
  }

  /**
   * Store message analytics in Redis for historical tracking
   */
  async trackMessage(deviceId: string, message: Message, chat: Chat): Promise<void> {
    try {
      const messageAnalytics: MessageAnalytics = {
        id: message.id._serialized,
        chatId: chat.id._serialized,
        timestamp: message.timestamp * 1000,
        fromMe: message.fromMe,
        messageType: message.type,
        body: message.body || '',
        hasMedia: message.hasMedia,
        isForwarded: message.isForwarded || false,
        mentions: message.mentionedIds || [],
        isReply: !!message.hasQuotedMsg,
        wordCount: (message.body || '').split(' ').length,
      };

      // Calculate response time if this is a reply to previous message
      if (!message.fromMe) {
        const lastMyMessage = await this.getLastMessageFromMe(deviceId, chat.id._serialized);
        if (lastMyMessage) {
          messageAnalytics.responseTime = messageAnalytics.timestamp - lastMyMessage.timestamp;
        }
      }

      // Store individual message
      await this.redisClient.lpush(
        `${this.MESSAGE_HISTORY_PREFIX}${deviceId}:${chat.id._serialized}`,
        JSON.stringify(messageAnalytics)
      );

      // Keep only last 1000 messages per chat
      await this.redisClient.ltrim(
        `${this.MESSAGE_HISTORY_PREFIX}${deviceId}:${chat.id._serialized}`,
        0,
        999
      );

      // Update chat statistics
      await this.updateChatStats(deviceId, chat, messageAnalytics);

      // Store daily statistics
      await this.updateDailyStats(deviceId, messageAnalytics);

    } catch (error) {
      logger.error('Error tracking message:', error);
    }
  }

  /**
   * Generate comprehensive analytics dashboard
   */
  async generateDashboard(deviceId: string, options: {
    includeAI?: boolean;
    timeRange?: number; // days
    includeHistorical?: boolean;
  } = {}): Promise<AnalyticsDashboard> {
    const device = this.deviceManager.getDevice(deviceId);
    if (!device || device.status !== 'ready') {
      throw new Error('Device not ready');
    }

    const chats = await device.client.getChats();
    const timeRange = options.timeRange || 30; // Default 30 days
    const cutoffTime = Date.now() - (timeRange * 24 * 60 * 60 * 1000);

    // Get all chat analytics
    const chatAnalytics: ChatAnalytics[] = [];
    for (const chat of chats) {
      const analytics = await this.analyzeChatDetailed(deviceId, chat, cutoffTime);
      if (analytics) {
        chatAnalytics.push(analytics);
      }
    }

    // Calculate overview statistics
    const totalMessages = chatAnalytics.reduce((sum, chat) => sum + chat.totalMessages, 0);
    const unreadChats = chatAnalytics.filter(chat => chat.unreadCount > 0);
    const totalUnreadMessages = unreadChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

    // Find oldest unread message
    const oldestUnread = await this.findOldestUnreadMessage(deviceId, chats);

    // Calculate top senders
    const topSenders = chatAnalytics
      .filter(chat => !chat.isGroup || chat.totalMessages > 5) // Filter low-activity groups
      .sort((a, b) => b.totalMessages - a.totalMessages)
      .slice(0, 10)
      .map(chat => ({
        name: chat.name,
        chatId: chat.id,
        isGroup: chat.isGroup,
        messageCount: chat.totalMessages,
        lastMessage: '', // Will be filled by getLastMessage
        lastMessageTime: chat.lastMessageTime,
        avgMessagesPerDay: chat.totalMessages / timeRange,
      }));

    // Calculate conversation health
    const healthyConversations = chatAnalytics.filter(chat => chat.engagementScore > 0.7).length;
    const oneWayConversations = chatAnalytics.filter(chat => chat.responseRate < 0.2).length;
    const neglectedChats = chatAnalytics.filter(chat => 
      Date.now() - chat.lastActivity > (7 * 24 * 60 * 60 * 1000) // 7 days
    ).length;

    // Calculate time patterns
    const timePatterns = await this.analyzeTimePatterns(deviceId, timeRange);

    // Generate AI insights if requested
    let aiInsights: any = {
      summary: '',
      recommendations: [],
      sentimentOverview: { positive: 0, negative: 0, neutral: 0 },
      communicationStyle: '',
    };

    if (options.includeAI) {
      aiInsights = await this.generateAIInsights(deviceId, chatAnalytics, timeRange);
    }

    return {
      overview: {
        totalChats: chatAnalytics.length,
        totalMessages,
        unreadChats: unreadChats.length,
        unreadMessages: totalUnreadMessages,
        avgDailyMessages: totalMessages / timeRange,
        responseRate: this.calculateOverallResponseRate(chatAnalytics),
        oldestUnreadMessage: oldestUnread,
      },
      topSenders,
      conversationHealth: {
        healthyConversations,
        oneWayConversations,
        neglectedChats,
        avgEngagementScore: chatAnalytics.reduce((sum, chat) => sum + chat.engagementScore, 0) / chatAnalytics.length,
      },
      timePatterns,
      aiInsights,
    };
  }

  /**
   * Helper function to find the last actual message timestamp (excluding system events)
   */
  private async getLastActualMessageTimestamp(chat: any): Promise<number | null> {
    try {
      // Fetch recent messages from the chat
      const messages = await chat.fetchMessages({ limit: 20 });
      
      // Filter out system messages and find the most recent actual message
      for (const message of messages) {
        // Skip system notifications, group events, etc.
        if (message.type === 'chat' && (message.body || message.hasMedia)) {
          return message.timestamp;
        }
      }
      
      return null; // No actual messages found
    } catch (error) {
      // If we can't fetch messages, fall back to chat.lastMessage timestamp
      return chat.lastMessage?.timestamp || null;
    }
  }

  /**
   * Get detailed unread messages analysis
   */
  async getUnreadAnalysis(deviceId: string, limit: number = 20): Promise<{
    summary: {
      totalUnreadChats: number;
      totalUnreadMessages: number;
      oldestUnreadDays: number;
      priorityContacts: number;
    };
    unreadChats: Array<{
      chatId: string;
      name: string;
      isGroup: boolean;
      unreadCount: number;
      lastMessage: string;
      lastMessageTime: number;
      daysSinceLastMessage: number;
      priority: 'high' | 'medium' | 'low';
      sentiment: 'positive' | 'negative' | 'neutral' | 'unknown';
    }>;
    recommendations: string[];
  }> {
    const device = this.deviceManager.getDevice(deviceId);
    if (!device || device.status !== 'ready') {
      throw new Error('Device not ready');
    }

    const chats = await device.client.getChats();
    const unreadChats = chats.filter(chat => chat.unreadCount > 0);

    const unreadAnalysis = [];
    let oldestUnreadDays = 0;

    for (const chat of unreadChats) {
      // Get the actual last message timestamp (not system events)
      const actualLastMessageTime = await this.getLastActualMessageTimestamp(chat);
      const daysSince = actualLastMessageTime 
        ? Math.floor((Date.now() - actualLastMessageTime * 1000) / (24 * 60 * 60 * 1000))
        : 999999; // Very high number if no actual messages
      
      if (daysSince < 999999) {
        oldestUnreadDays = Math.max(oldestUnreadDays, daysSince);
      }

      // Determine priority based on message count, recency, and contact type
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (!chat.isGroup && chat.unreadCount > 3) priority = 'high';
      else if (chat.unreadCount > 5) priority = 'high';
      else if (chat.unreadCount > 2 || daysSince < 1) priority = 'medium';

      // Get sentiment from last message using AI (temporarily disabled)
      let sentiment: 'positive' | 'negative' | 'neutral' | 'unknown' = 'neutral'; // Default for testing

      unreadAnalysis.push({
        chatId: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage?.body || '',
        lastMessageTime: actualLastMessageTime ? actualLastMessageTime * 1000 : 0,
        daysSinceLastMessage: daysSince === 999999 ? null : daysSince,
        priority,
        sentiment,
      });
    }

    // Sort by priority and recency, then limit results
    unreadAnalysis.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
    });
    
    // Apply limit to results while preserving summary stats for all unread chats
    const limitedUnreadAnalysis = unreadAnalysis.slice(0, limit);

    const recommendations = await this.generateUnreadRecommendations(limitedUnreadAnalysis);

    return {
      summary: {
        totalUnreadChats: unreadChats.length,
        totalUnreadMessages: unreadChats.reduce((sum, chat) => sum + chat.unreadCount, 0),
        oldestUnreadDays: oldestUnreadDays === 0 ? 0 : oldestUnreadDays,
        priorityContacts: unreadAnalysis.filter(chat => chat.priority === 'high').length,
        displayedChats: limitedUnreadAnalysis.length,
        limitApplied: limit < unreadAnalysis.length,
      },
      unreadChats: limitedUnreadAnalysis,
      recommendations,
    };
  }

  /**
   * Analyze conversation health and relationship patterns
   */
  async analyzeConversationHealth(deviceId: string, timeRange: number = 30): Promise<{
    overallHealth: number;
    relationshipInsights: Array<{
      chatId: string;
      name: string;
      isGroup: boolean;
      healthScore: number;
      issues: string[];
      strengths: string[];
      recommendations: string[];
      conversationPattern: 'mutual' | 'one-way-in' | 'one-way-out' | 'declining' | 'growing';
      avgResponseTime: number;
      messageFrequency: 'daily' | 'weekly' | 'monthly' | 'rare';
    }>;
    aiAnalysis: string;
  }> {
    const device = this.deviceManager.getDevice(deviceId);
    if (!device || device.status !== 'ready') {
      throw new Error('Device not ready');
    }

    const chats = await device.client.getChats();
    const cutoffTime = Date.now() - (timeRange * 24 * 60 * 60 * 1000);
    const relationshipInsights = [];

    for (const chat of chats.slice(0, ANALYTICS_DEFAULTS.DEFAULT_LIMIT)) { // Analyze default number of active chats
      const analytics = await this.analyzeChatDetailed(deviceId, chat, cutoffTime);
      if (!analytics || analytics.totalMessages < 5) continue;

      const issues = [];
      const strengths = [];
      const recommendations = [];

      // Analyze conversation patterns
      let conversationPattern: any = 'mutual';
      if (analytics.responseRate < 0.2) {
        conversationPattern = 'one-way-out';
        issues.push('Low response rate - messages not being replied to');
        recommendations.push('Consider reducing message frequency or checking if contact prefers different communication method');
      } else if (analytics.sentByMe / analytics.totalMessages < 0.2) {
        conversationPattern = 'one-way-in';
        issues.push('Mostly receiving messages - low engagement from your side');
        recommendations.push('Increase your participation in the conversation');
      } else if (analytics.sentByMe / analytics.totalMessages > 0.8) {
        conversationPattern = 'one-way-out';
        issues.push('Mostly sending messages - low engagement from contact');
      }

      // Analyze response times
      if (analytics.avgResponseTime > 24 * 60 * 60 * 1000) { // More than 24 hours
        issues.push('Slow response times');
        recommendations.push('Consider setting up notifications or checking messages more frequently');
      } else if (analytics.avgResponseTime < 60 * 60 * 1000) { // Less than 1 hour
        strengths.push('Quick response times');
      }

      // Analyze message frequency
      const dailyAvg = analytics.totalMessages / timeRange;
      let messageFrequency: any = 'rare';
      if (dailyAvg >= 1) messageFrequency = 'daily';
      else if (dailyAvg >= 0.25) messageFrequency = 'weekly';
      else if (dailyAvg >= 0.05) messageFrequency = 'monthly';

      // Calculate health score
      let healthScore = 0.5; // Base score
      if (analytics.responseRate > 0.7) healthScore += 0.2;
      if (analytics.avgResponseTime < 4 * 60 * 60 * 1000) healthScore += 0.15; // Less than 4 hours
      if (Math.abs(analytics.sentByMe / analytics.totalMessages - 0.5) < 0.2) healthScore += 0.15; // Balanced conversation
      if (analytics.totalMessages > 50) healthScore += 0.1; // Active conversation
      healthScore = Math.min(1.0, healthScore);

      relationshipInsights.push({
        chatId: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        healthScore,
        issues,
        strengths,
        recommendations,
        conversationPattern,
        avgResponseTime: analytics.avgResponseTime,
        messageFrequency,
      });
    }

    const overallHealth = relationshipInsights.reduce((sum, insight) => sum + insight.healthScore, 0) / relationshipInsights.length;

    // Generate AI analysis
    const aiAnalysis = await this.generateHealthAnalysisAI(relationshipInsights, overallHealth);

    return {
      overallHealth,
      relationshipInsights: relationshipInsights.sort((a, b) => b.healthScore - a.healthScore),
      aiAnalysis,
    };
  }

  /**
   * Get time-based activity patterns with AI insights
   */
  async getActivityPatterns(deviceId: string, timeRange: number = 30): Promise<{
    hourlyDistribution: { [hour: number]: number };
    dailyDistribution: { [day: string]: number };
    weeklyTrends: Array<{ week: string; messages: number; avgResponseTime: number }>;
    peakHours: number[];
    quietHours: number[];
    recommendations: string[];
    aiInsights: string;
  }> {
    const patterns = await this.analyzeTimePatterns(deviceId, timeRange);
    
    // Generate AI insights about activity patterns
    const aiInsights = await this.generateTimePatternInsights(patterns);
    
    const recommendations = [
      `Your peak messaging hours are ${patterns.peakHours.join(', ')}:00`,
      `Consider scheduling important messages during your most active times`,
      `Your average response time is ${Math.round(patterns.avgResponseTimeMinutes)} minutes`,
    ];

    return {
      ...patterns,
      recommendations,
      aiInsights,
    };
  }

  /**
   * Flush all analytics data for a device
   */
  async flushDeviceData(deviceId: string, options: {
    includeMessages?: boolean;
    includeChatStats?: boolean;
    includeDailyStats?: boolean;
  } = {}): Promise<{
    deletedKeys: number;
    categories: string[];
  }> {
    const { includeMessages = true, includeChatStats = true, includeDailyStats = true } = options;
    const deletedCategories = [];
    let totalDeleted = 0;

    try {
      // Delete message history
      if (includeMessages) {
        const messageKeys = await this.redisClient.keys(`${this.MESSAGE_HISTORY_PREFIX}${deviceId}:*`);
        if (messageKeys.length > 0) {
          totalDeleted += await this.redisClient.del(...messageKeys);
          deletedCategories.push('message_history');
        }
      }

      // Delete chat statistics
      if (includeChatStats) {
        const chatStatsKeys = await this.redisClient.keys(`${this.CHAT_STATS_PREFIX}${deviceId}:*`);
        if (chatStatsKeys.length > 0) {
          totalDeleted += await this.redisClient.del(...chatStatsKeys);
          deletedCategories.push('chat_statistics');
        }
      }

      // Delete daily statistics
      if (includeDailyStats) {
        const dailyStatsKeys = await this.redisClient.keys(`${this.ANALYTICS_PREFIX}daily:${deviceId}:*`);
        if (dailyStatsKeys.length > 0) {
          totalDeleted += await this.redisClient.del(...dailyStatsKeys);
          deletedCategories.push('daily_statistics');
        }
      }

      // Delete cached analytics
      const cacheKeys = await this.redisClient.keys(`${this.ANALYTICS_PREFIX}cache:${deviceId}:*`);
      if (cacheKeys.length > 0) {
        totalDeleted += await this.redisClient.del(...cacheKeys);
        deletedCategories.push('cached_analytics');
      }

      logger.info(`Flushed analytics data for device ${deviceId}: ${totalDeleted} keys deleted`);

      return {
        deletedKeys: totalDeleted,
        categories: deletedCategories,
      };

    } catch (error) {
      logger.error('Error flushing device data:', error);
      throw new Error('Failed to flush device analytics data');
    }
  }

  // Private helper methods
  private async analyzeChatDetailed(deviceId: string, chat: Chat, cutoffTime: number): Promise<ChatAnalytics | null> {
    try {
      // First try to get stored messages, if none exist, analyze from WhatsApp directly
      let messages = await this.getStoredMessages(deviceId, chat.id._serialized, cutoffTime);
      
      if (messages.length === 0) {
        // Fallback to analyzing current chat data from WhatsApp
        return await this.analyzeFromWhatsAppChat(chat, cutoffTime);
      }

      const sentByMe = messages.filter(msg => msg.fromMe).length;
      const receivedFromThem = messages.length - sentByMe;
      
      const messageTypes = {
        text: messages.filter(msg => msg.messageType === 'chat').length,
        media: messages.filter(msg => msg.hasMedia).length,
        audio: messages.filter(msg => msg.messageType === 'ptt' || msg.messageType === 'audio').length,
        document: messages.filter(msg => msg.messageType === 'document').length,
        sticker: messages.filter(msg => msg.messageType === 'sticker').length,
        location: messages.filter(msg => msg.messageType === 'location').length,
      };

      // Calculate response times
      const responseTimes = messages
        .filter(msg => msg.responseTime && msg.responseTime > 0)
        .map(msg => msg.responseTime!);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Calculate engagement score
      const balanceScore = 1 - Math.abs(0.5 - (sentByMe / messages.length)) * 2;
      const activityScore = Math.min(1, messages.length / 100);
      const responseScore = responseTimes.length > 0 ? Math.min(1, 3600000 / (avgResponseTime || 3600000)) : 0.5;
      const engagementScore = (balanceScore + activityScore + responseScore) / 3;

      return {
        id: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        phoneNumber: chat.isGroup ? undefined : chat.id.user,
        totalMessages: messages.length,
        unreadCount: chat.unreadCount,
        lastMessageTime: messages[0]?.timestamp || 0,
        firstMessageTime: messages[messages.length - 1]?.timestamp || 0,
        avgResponseTime,
        sentByMe,
        receivedFromThem,
        messageTypes,
        conversationGaps: [], // Would calculate gaps between message clusters
        lastActivity: messages[0]?.timestamp || 0,
        engagementScore,
        responseRate: responseTimes.length / Math.max(1, receivedFromThem),
      };
    } catch (error) {
      logger.error(`Error analyzing chat ${chat.id._serialized}:`, error);
      return null;
    }
  }
  private async analyzeFromWhatsAppChat(chat: Chat, cutoffTime: number): Promise<ChatAnalytics | null> {
    // This is a simplified analysis based on available chat data
    const lastMessageTime = (chat.lastMessage?.timestamp || 0) * 1000;
    if (lastMessageTime < cutoffTime) return null;

    // Estimate total messages - use unread count as minimum, but add some historical estimate
    const estimatedTotalMessages = Math.max(chat.unreadCount, 1); // At least 1 if we have activity
    
    return {
      id: chat.id._serialized,
      name: chat.name || chat.id.user || 'Unknown',
      isGroup: chat.isGroup,
      phoneNumber: chat.isGroup ? undefined : chat.id.user,
      totalMessages: estimatedTotalMessages,
      unreadCount: chat.unreadCount,
      lastMessageTime,
      firstMessageTime: chat.timestamp ? chat.timestamp * 1000 : lastMessageTime,
      avgResponseTime: 3600000, // Default 1 hour
      sentByMe: Math.floor(estimatedTotalMessages * 0.5), // Estimate 50/50 split
      receivedFromThem: Math.ceil(estimatedTotalMessages * 0.5),
      messageTypes: { 
        text: Math.floor(estimatedTotalMessages * 0.8), 
        media: Math.floor(estimatedTotalMessages * 0.15),
        audio: Math.floor(estimatedTotalMessages * 0.03),
        document: Math.floor(estimatedTotalMessages * 0.01),
        sticker: Math.floor(estimatedTotalMessages * 0.01),
        location: 0
      },
      conversationGaps: [],
      lastActivity: lastMessageTime,
      engagementScore: 0.6, // Slightly better default for active chats
      responseRate: 0.5, // Default moderate response rate
    };
  }

  private async getStoredMessages(deviceId: string, chatId: string, cutoffTime: number): Promise<MessageAnalytics[]> {
    const messageStrings = await this.redisClient.lrange(`${this.MESSAGE_HISTORY_PREFIX}${deviceId}:${chatId}`, 0, -1);
    return messageStrings
      .map(str => JSON.parse(str) as MessageAnalytics)
      .filter(msg => msg.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  private async updateChatStats(deviceId: string, chat: Chat, message: MessageAnalytics): Promise<void> {
    const key = `${this.CHAT_STATS_PREFIX}${deviceId}:${chat.id._serialized}`;
    await this.redisClient.hincrby(key, 'totalMessages', 1);
    await this.redisClient.hincrby(key, message.fromMe ? 'sentByMe' : 'receivedFromThem', 1);
    await this.redisClient.hset(key, 'lastMessageTime', message.timestamp);
    await this.redisClient.hset(key, 'chatName', chat.name || chat.id.user || 'Unknown');
    await this.redisClient.expire(key, 90 * 24 * 60 * 60); // Expire after 90 days
  }

  private async updateDailyStats(deviceId: string, message: MessageAnalytics): Promise<void> {
    const date = new Date(message.timestamp).toISOString().split('T')[0];
    const key = `${this.ANALYTICS_PREFIX}daily:${deviceId}:${date}`;
    await this.redisClient.hincrby(key, 'totalMessages', 1);
    await this.redisClient.hincrby(key, message.fromMe ? 'sent' : 'received', 1);
    await this.redisClient.expire(key, 90 * 24 * 60 * 60); // Expire after 90 days
  }

  private async getLastMessageFromMe(deviceId: string, chatId: string): Promise<MessageAnalytics | null> {
    const messages = await this.redisClient.lrange(`${this.MESSAGE_HISTORY_PREFIX}${deviceId}:${chatId}`, 0, 50);
    for (const msgStr of messages) {
      const msg = JSON.parse(msgStr) as MessageAnalytics;
      if (msg.fromMe) return msg;
    }
    return null;
  }

  private async findOldestUnreadMessage(deviceId: string, chats: Chat[]): Promise<any> {
    let oldest: any = null;
    let oldestTime = Date.now();

    for (const chat of chats) {
      if (chat.unreadCount > 0 && chat.lastMessage) {
        const messageTime = chat.lastMessage.timestamp * 1000;
        if (messageTime < oldestTime) {
          oldestTime = messageTime;
          oldest = {
            chatName: chat.name || chat.id.user || 'Unknown',
            timestamp: messageTime,
            daysSince: Math.floor((Date.now() - messageTime) / (24 * 60 * 60 * 1000)),
          };
        }
      }
    }

    return oldest;
  }

  private calculateOverallResponseRate(chatAnalytics: ChatAnalytics[]): number {
    const totalReceived = chatAnalytics.reduce((sum, chat) => sum + chat.receivedFromThem, 0);
    const totalResponses = chatAnalytics.reduce((sum, chat) => sum + (chat.responseRate * chat.receivedFromThem), 0);
    return totalReceived > 0 ? totalResponses / totalReceived : 0;
  }

  private async analyzeTimePatterns(deviceId: string, timeRange: number): Promise<any> {
    // Implementation would analyze message timestamps to find patterns
    // This is a simplified version
    return {
      peakHours: [9, 10, 11, 19, 20, 21],
      mostActiveDay: 'Monday',
      avgResponseTimeMinutes: 45,
    };
  }

  private async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      const response = await this.aiService.generateCompletion({
        provider: 'openrouter',
        model: 'mistralai/mistral-nemo',
        messages: [{
          role: 'user',
          content: `Analyze the sentiment of this message and respond with only one word: positive, negative, or neutral.\n\nMessage: "${text}"`
        }],
        temperature: 0.1,
      });
      
      const responseText = response.choices[0]?.message?.content || 'neutral';
      
      const sentiment = responseText.toLowerCase().trim();
      if (['positive', 'negative', 'neutral'].includes(sentiment)) {
        return sentiment as 'positive' | 'negative' | 'neutral';
      }
      return 'neutral';
    } catch (error) {
      return 'neutral';
    }
  }

  private async generateAIInsights(deviceId: string, chatAnalytics: ChatAnalytics[], timeRange: number): Promise<any> {
    const summary = `Analyzed ${chatAnalytics.length} conversations over ${timeRange} days`;
    const totalMessages = chatAnalytics.reduce((sum, chat) => sum + chat.totalMessages, 0);
    
    try {
      const prompt = `You are a communication analytics expert. Analyze this WhatsApp usage data and provide insights:

Total conversations: ${chatAnalytics.length}
Total messages: ${totalMessages}
Time period: ${timeRange} days
Top 5 most active chats: ${chatAnalytics.slice(0, 5).map(c => `${c.name} (${c.totalMessages} messages)`).join(', ')}

Provide a brief summary (2-3 sentences) and 3 actionable recommendations for better communication habits.`;

      const response = await this.aiService.generateCompletion({
        provider: 'openrouter',
        model: 'mistralai/mistral-nemo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const responseText = response.choices[0]?.message?.content || summary;
      const lines = responseText.split('\n').filter(line => line.trim());
      const summaryLines = lines.slice(0, 3).join(' ');
      const recommendations = lines.slice(3).filter(line => line.includes('-') || line.includes('•')).slice(0, 3);

      return {
        summary: summaryLines,
        recommendations,
        sentimentOverview: { positive: 60, negative: 15, neutral: 25 }, // Placeholder
        communicationStyle: 'Balanced communicator with good response rates',
      };
    } catch (error) {
      return {
        summary,
        recommendations: ['Check unread messages regularly', 'Maintain balanced conversations', 'Respond within reasonable time frames'],
        sentimentOverview: { positive: 50, negative: 20, neutral: 30 },
        communicationStyle: 'Active communicator',
      };
    }
  }

  private async generateUnreadRecommendations(unreadAnalysis: any[]): Promise<string[]> {
    const highPriority = unreadAnalysis.filter(chat => chat.priority === 'high');
    const oldMessages = unreadAnalysis.filter(chat => chat.daysSinceLastMessage > 7);
    
    const recommendations = [];
    
    if (highPriority.length > 0) {
      recommendations.push(`You have ${highPriority.length} high-priority unread conversations that need immediate attention`);
    }
    
    if (oldMessages.length > 0) {
      recommendations.push(`${oldMessages.length} conversations have been unread for over a week - consider reviewing or archiving`);
    }
    
    if (unreadAnalysis.filter(chat => chat.sentiment === 'negative').length > 0) {
      recommendations.push('Some unread messages have negative sentiment - prioritize addressing these concerns');
    }
    
    return recommendations;
  }

  private async generateHealthAnalysisAI(insights: any[], overallHealth: number): Promise<string> {
    try {
      const prompt = `As a relationship communication expert, analyze these conversation health metrics:

Overall health score: ${(overallHealth * 100).toFixed(1)}%
Number of conversations analyzed: ${insights.length}
Healthy conversations: ${insights.filter(i => i.healthScore > 0.7).length}
One-way conversations: ${insights.filter(i => i.conversationPattern.includes('one-way')).length}

Provide a brief analysis (3-4 sentences) about the communication patterns and relationship health.`;

      const response = await this.aiService.generateCompletion({
        provider: 'openrouter',
        model: 'mistralai/mistral-nemo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content || `Your overall communication health score is ${(overallHealth * 100).toFixed(1)}%. This indicates ${overallHealth > 0.7 ? 'healthy' : overallHealth > 0.5 ? 'moderate' : 'needs improvement'} conversation patterns across your relationships.`;
    } catch (error) {
      return `Your overall communication health score is ${(overallHealth * 100).toFixed(1)}%. This indicates ${overallHealth > 0.7 ? 'healthy' : overallHealth > 0.5 ? 'moderate' : 'needs improvement'} conversation patterns across your relationships.`;
    }
  }

  private async generateTimePatternInsights(patterns: any): Promise<string> {
    try {
      const prompt = `Analyze these communication time patterns and provide insights:

Peak messaging hours: ${patterns.peakHours?.join(', ') || 'Not available'}
Most active day: ${patterns.mostActiveDay || 'Not available'}
Average response time: ${patterns.avgResponseTimeMinutes || 'Not available'} minutes

Provide 2-3 sentences about what these patterns reveal about communication habits and productivity.`;

      const response = await this.aiService.generateCompletion({
        provider: 'openrouter',
        model: 'mistralai/mistral-nemo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content || 'Your messaging patterns show consistent activity with good response times, indicating engaged communication habits.';
    } catch (error) {
      return 'Your messaging patterns show consistent activity with good response times, indicating engaged communication habits.';
    }
  }
}
