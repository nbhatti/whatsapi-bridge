import { Router } from 'express';
import * as AnalyticsController from '../controllers/analytics.controller';
import { validate } from '../middlewares';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/v1/devices/{id}/analytics/dashboard:
 *   get:
 *     summary: Comprehensive analytics dashboard with AI insights
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: includeAI
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include AI-powered insights and analysis
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Time range in days for analysis
 *       - in: query
 *         name: includeHistorical
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include historical data patterns
 *     responses:
 *       200:
 *         description: Complete analytics dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalChats:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         unreadChats:
 *                           type: integer
 *                         unreadMessages:
 *                           type: integer
 *                     topSenders:
 *                       type: array
 *                       items:
 *                         type: object
 *                     conversationHealth:
 *                       type: object
 *                     timePatterns:
 *                       type: object
 *                     aiInsights:
 *                       type: object
 *       400:
 *         description: Device not ready
 *       500:
 *         description: Analytics generation failed
 */
router.get('/dashboard', AnalyticsController.getDashboard);

/**
 * @swagger
 * /api/v1/devices/{id}/analytics/unread-detective:
 *   get:
 *     summary: Detective analysis of unread messages with AI prioritization
 *     tags: [Analytics, Creative]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of unread chats to analyze (default from ANALYTICS_DEFAULT_LIMIT env var)
 *     responses:
 *       200:
 *         description: Unread messages detective report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     unreadChats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chatId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           priority:
 *                             type: string
 *                             enum: [high, medium, low]
 *                           sentiment:
 *                             type: string
 *                             enum: [positive, negative, neutral, unknown]
 *                           unreadCount:
 *                             type: integer
 *                           daysSinceLastMessage:
 *                             type: integer
 *                     detective:
 *                       type: object
 *                       properties:
 *                         urgentAlerts:
 *                           type: integer
 *                         ghostedConversations:
 *                           type: array
 *                         sentimentAlerts:
 *                           type: integer
 *                         vipNeglected:
 *                           type: array
 *                 insights:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Unread Messages Detective Report"
 *                     summary:
 *                       type: string
 *                     action_required:
 *                       type: boolean
 */
router.get('/unread-detective', AnalyticsController.getUnreadDetective);

/**
 * @swagger
 * /api/v1/devices/{id}/analytics/chatterboxes:
 *   get:
 *     summary: Find who talks the most - top senders championship
 *     tags: [Analytics, Creative]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Time range in days
 *       - in: query
 *         name: includeGroups
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include group chats in analysis
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of chatterboxes to return (default from ANALYTICS_DEFAULT_LIMIT env var)
 *     responses:
 *       200:
 *         description: Chatterbox championship leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chatterboxes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           messageCount:
 *                             type: integer
 *                           avgMessagesPerDay:
 *                             type: number
 *                           chattiness:
 *                             type: string
 *                             enum: [extreme, high, moderate, low]
 *                           badge:
 *                             type: string
 *                           example: "Ultimate Chatterbox"
 *                     leaderboard:
 *                       type: object
 *                     stats:
 *                       type: object
 *                 insights:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "The Chatterbox Championship"
 *                     winner:
 *                       type: string
 *                     competition_level:
 *                       type: string
 *                       enum: [fierce, casual]
 */
router.get('/chatterboxes', AnalyticsController.getChatterboxes);


/**
 * @swagger
 * /api/v1/devices/{id}/analytics/time-traveler:
 *   get:
 *     summary: Time-based activity patterns with AI insights
 *     tags: [Analytics, Time]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Time range in days for pattern analysis
 *     responses:
 *       200:
 *         description: Time travel analysis report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hourlyDistribution:
 *                       type: object
 *                       description: Message distribution by hour of day
 *                     dailyDistribution:
 *                       type: object
 *                       description: Message distribution by day of week
 *                     peakHours:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     quietHours:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     timeProfile:
 *                       type: object
 *                       properties:
 *                         chronotype:
 *                           type: string
 *                           enum: [morning-person, night-owl, all-day-chatter]
 *                         responsiveness:
 *                           type: string
 *                           enum: [lightning-fast, prompt, laid-back, unknown]
 *                     insights:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: "Time Travel Analysis"
 *                         personality:
 *                           type: string
 *                         bestTimeToReach:
 *                           type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     aiInsights:
 *                       type: string
 */
router.get('/time-traveler', AnalyticsController.getTimeTraveler);

/**
 * @swagger
 * /api/v1/devices/{id}/analytics/conversation-archaeology:
 *   get:
 *     summary: Archaeological analysis of oldest conversations and messages
 *     tags: [Analytics, History]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: deepDig
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Perform deep archaeological dig
 *     responses:
 *       200:
 *         description: Archaeological expedition report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ancientChats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chatId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           firstMessage:
 *                             type: string
 *                             format: date-time
 *                           daysSinceFirst:
 *                             type: integer
 *                           archaeological_era:
 *                             type: string
 *                             enum: [ancient, historical, recent]
 *                     forgottenRealms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chatId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           lastSeen:
 *                             type: string
 *                             format: date-time
 *                           daysSinceLastMessage:
 *                             type: integer
 *                           tombstone:
 *                             type: string
 *                             example: "RIP - Lost to Time"
 *                     historicalStats:
 *                       type: object
 *                 expedition:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Conversation Archaeological Expedition"
 *                     artifacts_discovered:
 *                       type: integer
 *                     lost_civilizations:
 *                       type: integer
 *                     historical_significance:
 *                       type: string
 *                       enum: [Legendary, Historic, Modern]
 *                     curator_notes:
 *                       type: string
 */
router.get('/conversation-archaeology', AnalyticsController.getConversationArchaeology);

/**
 * @swagger
 * /api/v1/devices/{id}/analytics/social-butterfly:
 *   get:
 *     summary: Group participation and social network analysis
 *     tags: [Analytics, Social]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Social butterfly analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     networkOverview:
 *                       type: object
 *                       properties:
 *                         totalGroups:
 *                           type: integer
 *                         totalIndividualChats:
 *                           type: integer
 *                         socialRatio:
 *                           type: string
 *                         networkSize:
 *                           type: integer
 *                     groupInsights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           groupId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           activityLevel:
 *                             type: string
 *                             enum: [very-active, active, moderate, quiet]
 *                           unreadCount:
 *                             type: integer
 *                     socialPersonality:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [group-lover, one-on-one-preferrer, balanced-socializer]
 *                         groupParticipation:
 *                           type: number
 *                         activeGroups:
 *                           type: integer
 *                         silentGroups:
 *                           type: integer
 *                 butterfly:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Social Butterfly Analysis"
 *                     wings:
 *                       type: string
 *                     social_style:
 *                       type: string
 *                     flutter_factor:
 *                       type: string
 *                       enum: [very-fluttery, gentle-flutter]
 */
router.get('/social-butterfly', AnalyticsController.getSocialButterfly);


/**
 * @swagger
 * /api/v1/devices/{id}/analytics/quick-stats:
 *   get:
 *     summary: Quick overview statistics snapshot
 *     tags: [Analytics, Quick]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Quick stats snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalChats:
 *                       type: integer
 *                     unreadChats:
 *                       type: integer
 *                     unreadMessages:
 *                       type: integer
 *                     totalGroups:
 *                       type: integer
 *                     activeGroups:
 *                       type: integer
 *                     oldestUnreadDays:
 *                       type: integer
 *                     topSender:
 *                       type: string
 *                 snapshot:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Quick Stats Snapshot"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [busy, active, calm]
 */
router.get('/quick-stats', AnalyticsController.getQuickStats);

/**
 * @swagger
 * /api/v1/devices/{id}/analytics/flush-memories:
 *   post:
 *     summary: Flush analytics data with safety confirmation
 *     tags: [Analytics, Data Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmationPhrase
 *             properties:
 *               confirmationPhrase:
 *                 type: string
 *                 example: "flush-my-memories"
 *                 description: Must be exactly "flush-my-memories" to proceed
 *               includeMessages:
 *                 type: boolean
 *                 default: true
 *                 description: Delete message history
 *               includeChatStats:
 *                 type: boolean
 *                 default: true
 *                 description: Delete chat statistics
 *               includeDailyStats:
 *                 type: boolean
 *                 default: true
 *                 description: Delete daily statistics
 *     responses:
 *       200:
 *         description: Memory flush completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedKeys:
 *                       type: integer
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                     memoryWipe:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "complete"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         message:
 *                           type: string
 *                           example: "Analytics memories have been wiped clean"
 *                 warning:
 *                   type: string
 *       400:
 *         description: Invalid confirmation phrase or request
 *       500:
 *         description: Memory flush failed
 */
router.post('/flush-memories', AnalyticsController.flushMemories);

export default router;
