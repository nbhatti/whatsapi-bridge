import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { DeviceManager } from '../services/DeviceManager';
import { logger } from '../config';

const analyticsService = new AnalyticsService();
const deviceManager = DeviceManager.getInstance();

/**
 * GET /api/v1/devices/:id/analytics/dashboard
 * Comprehensive analytics dashboard with AI insights
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { includeAI = 'true', timeRange = '30', includeHistorical = 'true' } = req.query;

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready' });
      return;
    }

    const dashboard = await analyticsService.generateDashboard(id, {
      includeAI: includeAI === 'true',
      timeRange: parseInt(timeRange as string),
      includeHistorical: includeHistorical === 'true',
    });

    res.json({
      success: true,
      data: dashboard,
      metadata: {
        generatedAt: new Date().toISOString(),
        timeRange: `${timeRange} days`,
        includesAI: includeAI === 'true',
      },
    });
  } catch (error) {
    logger.error('Error generating dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to generate analytics dashboard' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/unread-detective
 * Detailed analysis of unread messages with AI prioritization
 */
export const getUnreadDetective = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const unreadAnalysis = await analyticsService.getUnreadAnalysis(id);

    res.json({
      success: true,
      data: {
        ...unreadAnalysis,
        detective: {
          urgentAlerts: unreadAnalysis.unreadChats.filter(chat => 
            chat.priority === 'high' && chat.daysSinceLastMessage < 2
          ).length,
          ghostedConversations: unreadAnalysis.unreadChats.filter(chat => 
            chat.daysSinceLastMessage > 14
          ),
          sentimentAlerts: unreadAnalysis.unreadChats.filter(chat => 
            chat.sentiment === 'negative'
          ).length,
          vipNeglected: unreadAnalysis.unreadChats.filter(chat => 
            !chat.isGroup && chat.priority === 'high'
          ),
        },
      },
      insights: {
        title: "Unread Messages Detective Report",
        summary: `Found ${unreadAnalysis.summary.totalUnreadChats} unread conversations with ${unreadAnalysis.summary.totalUnreadMessages} pending messages`,
        action_required: unreadAnalysis.summary.priorityContacts > 0,
      },
    });
  } catch (error) {
    logger.error('Error in unread detective:', error);
    res.status(500).json({ success: false, error: 'Detective investigation failed' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/chatterboxes
 * Find who talks the most - top senders analysis
 */
export const getChatterboxes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { timeRange = '30', includeGroups = 'true', limit = '10' } = req.query;

    const dashboard = await analyticsService.generateDashboard(id, {
      timeRange: parseInt(timeRange as string),
      includeAI: true,
    });

    const chatterboxes = dashboard.topSenders
      .filter(sender => includeGroups === 'true' || !sender.isGroup)
      .slice(0, parseInt(limit as string))
      .map((sender, index) => ({
        ...sender,
        rank: index + 1,
        chattiness: sender.avgMessagesPerDay > 10 ? 'extreme' : 
                   sender.avgMessagesPerDay > 5 ? 'high' : 
                   sender.avgMessagesPerDay > 2 ? 'moderate' : 'low',
        badge: index === 0 ? 'Ultimate Chatterbox' : 
               index === 1 ? 'Silver Talker' : 
               index === 2 ? 'Bronze Babbler' : 
               sender.isGroup ? 'Group Champion' : 'Regular Chatter',
      }));

    res.json({
      success: true,
      data: {
        chatterboxes,
        leaderboard: {
          champion: chatterboxes[0],
          totalCompetitors: chatterboxes.length,
          timeframe: `${timeRange} days`,
        },
        stats: {
          averageMessagesPerDay: chatterboxes.reduce((sum, c) => sum + c.avgMessagesPerDay, 0) / chatterboxes.length,
          topGroupChatter: chatterboxes.find(c => c.isGroup),
          topPersonalChatter: chatterboxes.find(c => !c.isGroup),
        },
      },
      insights: {
        title: "The Chatterbox Championship",
        winner: chatterboxes[0]?.name || 'No active chats',
        competition_level: chatterboxes.length > 5 ? 'fierce' : 'casual',
      },
    });
  } catch (error) {
    logger.error('Error finding chatterboxes:', error);
    res.status(500).json({ success: false, error: 'Chatterbox analysis failed' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/conversation-health-check
 * Deep relationship analysis with health scores
 */
export const getConversationHealthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { timeRange = '30' } = req.query;

    const healthAnalysis = await analyticsService.analyzeConversationHealth(id, parseInt(timeRange as string));

    const healthCategories = {
      excellent: healthAnalysis.relationshipInsights.filter(r => r.healthScore > 0.8),
      good: healthAnalysis.relationshipInsights.filter(r => r.healthScore > 0.6 && r.healthScore <= 0.8),
      needsAttention: healthAnalysis.relationshipInsights.filter(r => r.healthScore > 0.4 && r.healthScore <= 0.6),
      critical: healthAnalysis.relationshipInsights.filter(r => r.healthScore <= 0.4),
    };

    res.json({
      success: true,
      data: {
        ...healthAnalysis,
        healthReport: {
          overallGrade: healthAnalysis.overallHealth > 0.8 ? 'A+' : 
                      healthAnalysis.overallHealth > 0.7 ? 'A' :
                      healthAnalysis.overallHealth > 0.6 ? 'B' :
                      healthAnalysis.overallHealth > 0.5 ? 'C' : 'D',
          categories: {
            excellent: { count: healthCategories.excellent.length, percentage: (healthCategories.excellent.length / healthAnalysis.relationshipInsights.length * 100).toFixed(1) },
            good: { count: healthCategories.good.length, percentage: (healthCategories.good.length / healthAnalysis.relationshipInsights.length * 100).toFixed(1) },
            needsAttention: { count: healthCategories.needsAttention.length, percentage: (healthCategories.needsAttention.length / healthAnalysis.relationshipInsights.length * 100).toFixed(1) },
            critical: { count: healthCategories.critical.length, percentage: (healthCategories.critical.length / healthAnalysis.relationshipInsights.length * 100).toFixed(1) },
          },
          topIssues: healthAnalysis.relationshipInsights.flatMap(r => r.issues).reduce((acc: any, issue) => {
            acc[issue] = (acc[issue] || 0) + 1;
            return acc;
          }, {}),
        },
      },
      diagnosis: {
        title: "Conversation Health Checkup",
        overallHealth: `${(healthAnalysis.overallHealth * 100).toFixed(1)}% - ${healthAnalysis.overallHealth > 0.7 ? 'Healthy' : 'Needs Improvement'}`,
        urgentCare: healthCategories.critical.length,
        prescription: healthAnalysis.relationshipInsights.flatMap(r => r.recommendations).slice(0, 3),
      },
    });
  } catch (error) {
    logger.error('Error in health check:', error);
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/time-traveler
 * Time-based activity patterns with AI insights
 */
export const getTimeTraveler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { timeRange = '30' } = req.query;

    const patterns = await analyticsService.getActivityPatterns(id, parseInt(timeRange as string));

    res.json({
      success: true,
      data: {
        ...patterns,
        timeProfile: {
          chronotype: patterns.peakHours.some((hour: number) => hour >= 6 && hour <= 12) ? 
                     'morning-person' : 
                     patterns.peakHours.some((hour: number) => hour >= 22 || hour <= 6) ? 
                     'night-owl' : 'all-day-chatter',
          responsiveness: patterns.recommendations[2]?.includes('minutes') ? 
                         parseInt(patterns.recommendations[2].match(/\d+/)?.[0] || '60') < 60 ? 'lightning-fast' :
                         parseInt(patterns.recommendations[2].match(/\d+/)?.[0] || '60') < 240 ? 'prompt' : 'laid-back' : 'unknown',
        },
        insights: {
          title: "Time Travel Analysis",
          personality: patterns.peakHours?.length > 6 ? 'Always Available' : 'Focused Communicator',
          bestTimeToReach: `${patterns.peakHours?.[0] || 9}:00 - ${patterns.peakHours?.[patterns.peakHours.length - 1] || 21}:00`,
        },
      },
    });
  } catch (error) {
    logger.error('Error in time traveler:', error);
    res.status(500).json({ success: false, error: 'Time travel analysis failed' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/conversation-archaeology
 * Analyze oldest messages, conversations, and historical patterns
 */
export const getConversationArchaeology = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { deepDig = 'true' } = req.query;

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready' });
      return;
    }

    const chats = await device.client.getChats();
    
    // Find oldest conversations
    const archaeology = {
      ancientChats: chats
        .filter(chat => chat.timestamp && chat.timestamp > 0)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        .slice(0, 5)
        .map(chat => ({
          chatId: chat.id._serialized,
          name: chat.name || chat.id.user || 'Unknown',
          isGroup: chat.isGroup,
          firstMessage: new Date((chat.timestamp || 0) * 1000).toISOString(),
          daysSinceFirst: Math.floor((Date.now() - (chat.timestamp || 0) * 1000) / (24 * 60 * 60 * 1000)),
          archaeological_era: Math.floor((Date.now() - (chat.timestamp || 0) * 1000) / (365 * 24 * 60 * 60 * 1000)) > 3 ? 'ancient' :
                              Math.floor((Date.now() - (chat.timestamp || 0) * 1000) / (365 * 24 * 60 * 60 * 1000)) > 1 ? 'historical' : 'recent',
        })),
      
      forgottenRealms: await Promise.all(
        chats
          .slice(0, 20) // Limit to avoid performance issues
          .map(async (chat) => {
            const lastActualMessageTime = await getLastActualMessageTimestamp(chat);
            const daysSinceLastActivity = lastActualMessageTime 
              ? Math.floor((Date.now() - lastActualMessageTime * 1000) / (24 * 60 * 60 * 1000))
              : 999999;
            return { chat, daysSinceLastActivity, lastActualMessageTime };
          })
      ).then(results => 
        results
          .filter(({ daysSinceLastActivity }) => daysSinceLastActivity > 365) // Over a year old
          .slice(0, 10)
          .map(({ chat, daysSinceLastActivity, lastActualMessageTime }) => ({
            chatId: chat.id._serialized,
            name: chat.name || chat.id.user || 'Unknown',
            isGroup: chat.isGroup,
            lastSeen: lastActualMessageTime ? new Date(lastActualMessageTime * 1000).toISOString() : null,
            daysSinceLastMessage: daysSinceLastActivity === 999999 ? null : daysSinceLastActivity,
            tombstone: "RIP - Lost to Time",
          }))
      ),

      historicalStats: {
        totalConversations: chats.length,
        oldestConversationDays: Math.max(...chats.map(chat => 
          Math.floor((Date.now() - (chat.timestamp || Date.now() / 1000) * 1000) / (24 * 60 * 60 * 1000))
        )),
        ghostTownChats: chats.filter(chat => {
          const daysSince = Math.floor((Date.now() - (chat.lastMessage?.timestamp || 0) * 1000) / (24 * 60 * 60 * 1000));
          return daysSince > 90;
        }).length,
      }
    };

    res.json({
      success: true,
      data: archaeology,
      expedition: {
        title: "Conversation Archaeological Expedition",
        artifacts_discovered: archaeology.ancientChats.length,
        lost_civilizations: archaeology.forgottenRealms.length,
        historical_significance: archaeology.historicalStats.oldestConversationDays > 1000 ? 'Legendary' : 
                               archaeology.historicalStats.oldestConversationDays > 365 ? 'Historic' : 'Modern',
        curator_notes: `Discovered ${archaeology.ancientChats.length} ancient conversations and ${archaeology.forgottenRealms.length} forgotten realms`,
      },
    });
  } catch (error) {
    logger.error('Error in conversation archaeology:', error);
    res.status(500).json({ success: false, error: 'Archaeological expedition failed' });
  }
};

/**
 * Helper function to find the last actual message timestamp (excluding system events)
 */
const getLastActualMessageTimestamp = async (chat: any): Promise<number | null> => {
  try {
    // Fetch recent messages from the chat
    const messages = await chat.fetchMessages({ limit: 50 });
    
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
};

/**
 * GET /api/v1/devices/:id/analytics/social-butterfly
 * Group participation and social network analysis
 */
export const getSocialButterfly = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready' });
      return;
    }

    const chats = await device.client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    const individuals = chats.filter(chat => !chat.isGroup);

    // Get actual message timestamps for groups (this might take a moment)
    const groupInsightsWithRealTimestamps = await Promise.all(
      groups.slice(0, 15).map(async (group) => {
        const lastActualMessageTime = await getLastActualMessageTimestamp(group);
        return {
          group,
          lastActualMessageTime,
          daysSinceLastMessage: lastActualMessageTime 
            ? Math.floor((Date.now() - lastActualMessageTime * 1000) / (24 * 60 * 60 * 1000))
            : 999999, // Very high number for groups with no messages
        };
      })
    );

    // Sort by actual message time and take top 10
    const sortedGroups = groupInsightsWithRealTimestamps
      .sort((a, b) => (b.lastActualMessageTime || 0) - (a.lastActualMessageTime || 0))
      .slice(0, 10);

    const socialAnalysis = {
      networkOverview: {
        totalGroups: groups.length,
        totalIndividualChats: individuals.length,
        socialRatio: groups.length > 0 ? (individuals.length / groups.length).toFixed(2) : 'infinity',
        networkSize: chats.length,
      },
      
      groupInsights: sortedGroups.map(({ group, lastActualMessageTime, daysSinceLastMessage }) => ({
        groupId: group.id._serialized,
        name: group.name || 'Unnamed Group',
        unreadCount: group.unreadCount,
        lastActivity: lastActualMessageTime ? new Date(lastActualMessageTime * 1000).toISOString() : null,
        activityLevel: group.unreadCount > 20 ? 'very-active' : 
                      group.unreadCount > 5 ? 'active' : 
                      group.unreadCount > 0 ? 'moderate' : 
                      daysSinceLastMessage < 7 ? 'recent' : 'quiet',
        daysSinceLastMessage: daysSinceLastMessage === 999999 ? null : daysSinceLastMessage,
      })),
      
      socialPersonality: {
        type: groups.length > individuals.length ? 'group-lover' : 
              individuals.length > groups.length * 2 ? 'one-on-one-preferrer' : 'balanced-socializer',
        groupParticipation: groups.filter(g => g.unreadCount === 0).length / Math.max(groups.length, 1) * 100,
        activeGroups: groups.filter(g => g.unreadCount > 0).length,
        silentGroups: groups.filter(g => g.unreadCount === 0).length,
      },
    };

    res.json({
      success: true,
      data: socialAnalysis,
      butterfly: {
        title: "Social Butterfly Analysis",
        wings: `${socialAnalysis.networkOverview.totalGroups} group wings, ${socialAnalysis.networkOverview.totalIndividualChats} individual wings`,
        social_style: socialAnalysis.socialPersonality.type,
        flutter_factor: socialAnalysis.socialPersonality.activeGroups > 5 ? 'very-fluttery' : 'gentle-flutter',
      },
    });
  } catch (error) {
    logger.error('Error in social butterfly analysis:', error);
    res.status(500).json({ success: false, error: 'Social butterfly analysis failed' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/ai-therapist
 * AI-powered communication insights and recommendations
 */
export const getAITherapist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sessionType = 'full', timeRange = '30' } = req.query;

    const dashboard = await analyticsService.generateDashboard(id, {
      includeAI: true,
      timeRange: parseInt(timeRange as string),
    });

    const healthAnalysis = await analyticsService.analyzeConversationHealth(id, parseInt(timeRange as string));
    const unreadAnalysis = await analyticsService.getUnreadAnalysis(id);

    const therapy = {
      session: {
        type: sessionType,
        duration: `${timeRange} days analysis`,
        patientProfile: {
          communicationStyle: dashboard.aiInsights.communicationStyle,
          overallHealth: `${(healthAnalysis.overallHealth * 100).toFixed(1)}%`,
          responseRate: `${(dashboard.overview.responseRate * 100).toFixed(1)}%`,
          socialActivity: dashboard.overview.avgDailyMessages > 20 ? 'high' : 
                         dashboard.overview.avgDailyMessages > 10 ? 'moderate' : 'low',
        },
      },
      
      diagnosis: {
        primaryConcerns: [
          ...(unreadAnalysis.summary.totalUnreadChats > 10 ? ['Unread message anxiety'] : []),
          ...(healthAnalysis.overallHealth < 0.6 ? ['Relationship communication issues'] : []),
          ...(dashboard.overview.responseRate < 0.3 ? ['Low engagement patterns'] : []),
        ],
        strengths: [
          ...(dashboard.overview.responseRate > 0.7 ? ['Good response consistency'] : []),
          ...(healthAnalysis.overallHealth > 0.7 ? ['Healthy relationship patterns'] : []),
          ...(unreadAnalysis.summary.priorityContacts === 0 ? ['Good message management'] : []),
        ],
      },
      
      prescription: {
        immediate: dashboard.aiInsights.recommendations.slice(0, 2),
        longTerm: [
          'Practice active listening in conversations',
          'Set boundaries for digital communication',
          'Regular digital detox sessions',
        ],
        follow_up: 'Check back in 2 weeks for progress evaluation',
      },
      
      aiAnalysis: dashboard.aiInsights.summary,
    };

    res.json({
      success: true,
      data: therapy,
      session_notes: {
        title: "AI Communication Therapist Session",
        patient_id: id,
        session_date: new Date().toISOString(),
        next_appointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        therapist_signature: "Dr. AI WhatsApp",
      },
    });
  } catch (error) {
    logger.error('Error in AI therapist session:', error);
    res.status(500).json({ success: false, error: 'Therapy session failed' });
  }
};

/**
 * POST /api/v1/devices/:id/analytics/flush-memories
 * Flush analytics data with options
 */
export const flushMemories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      includeMessages = true, 
      includeChatStats = true, 
      includeDailyStats = true,
      confirmationPhrase 
    } = req.body;

    // Safety check
    if (confirmationPhrase !== 'flush-my-memories') {
      res.status(400).json({ 
        success: false, 
        error: 'Please provide confirmationPhrase: "flush-my-memories" to proceed with data deletion' 
      });
      return;
    }

    const result = await analyticsService.flushDeviceData(id, {
      includeMessages,
      includeChatStats,
      includeDailyStats,
    });

    res.json({
      success: true,
      data: {
        ...result,
        memoryWipe: {
          status: 'complete',
          timestamp: new Date().toISOString(),
          dataCategories: result.categories,
          keysDeleted: result.deletedKeys,
          message: 'Analytics memories have been wiped clean',
        },
      },
      warning: "All analytics data for this device has been permanently deleted. This action cannot be undone.",
    });
  } catch (error) {
    logger.error('Error flushing memories:', error);
    res.status(500).json({ success: false, error: 'Memory wipe failed' });
  }
};

/**
 * GET /api/v1/devices/:id/analytics/quick-stats
 * Quick overview statistics
 */
export const getQuickStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready' });
      return;
    }

    const chats = await device.client.getChats();
    const unreadChats = chats.filter(chat => chat.unreadCount > 0);
    const groups = chats.filter(chat => chat.isGroup);

    const quickStats = {
      totalChats: chats.length,
      unreadChats: unreadChats.length,
      unreadMessages: unreadChats.reduce((sum, chat) => sum + chat.unreadCount, 0),
      totalGroups: groups.length,
      activeGroups: groups.filter(g => g.unreadCount > 0).length,
      oldestUnreadDays: unreadChats.length > 0 ? Math.max(...unreadChats.map(chat => 
        Math.floor((Date.now() - (chat.lastMessage?.timestamp || 0) * 1000) / (24 * 60 * 60 * 1000))
      )) : 0,
      topSender: chats
        .filter(chat => chat.lastMessage)
        .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0))[0]?.name || 'None',
    };

    res.json({
      success: true,
      data: quickStats,
      snapshot: {
        title: "Quick Stats Snapshot",
        timestamp: new Date().toISOString(),
        status: quickStats.unreadMessages > 50 ? 'busy' : quickStats.unreadMessages > 10 ? 'active' : 'calm',
      },
    });
  } catch (error) {
    logger.error('Error getting quick stats:', error);
    res.status(500).json({ success: false, error: 'Quick stats failed' });
  }
};
