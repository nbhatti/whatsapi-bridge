import { Router } from 'express';
import * as QueueController from '../controllers/queue.controller';
import { clientOperationRateLimiter, adminRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     QueueStatus:
 *       type: object
 *       properties:
 *         pending:
 *           type: number
 *           description: Number of pending messages in queue
 *         processing:
 *           type: number
 *           description: Number of messages currently being processed
 *         totalQueued:
 *           type: number
 *           description: Total messages in queue system
 *     
 *     DeviceHealth:
 *       type: object
 *       properties:
 *         deviceId:
 *           type: string
 *           description: Device identifier
 *         status:
 *           type: string
 *           enum: [healthy, warning, critical, blocked]
 *           description: Overall device health status
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Health score (0-100, higher is better)
 *         metrics:
 *           type: object
 *           properties:
 *             messagesPerHour:
 *               type: number
 *               description: Messages sent in the last hour
 *             successRate:
 *               type: number
 *               description: Success rate percentage
 *             avgResponseTime:
 *               type: number
 *               description: Average response time in milliseconds
 *             disconnectionCount:
 *               type: number
 *               description: Number of disconnections in last 24h
 *             lastActivity:
 *               type: number
 *               description: Timestamp of last activity
 *             warmupPhase:
 *               type: boolean
 *               description: Whether device is in warmup phase
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of warning messages
 *         lastUpdated:
 *           type: number
 *           description: Timestamp of last health update
 */

/**
 * @swagger
 * /api/v1/queue/status:
 *   get:
 *     summary: Get message queue status
 *     tags: [Queue Management]
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
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
 *                     queue:
 *                       $ref: '#/components/schemas/QueueStatus'
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/status', clientOperationRateLimiter, QueueController.getQueueStatus);

/**
 * @swagger
 * /api/v1/queue/clear:
 *   post:
 *     summary: Clear all queued messages (Admin only)
 *     tags: [Queue Management]
 *     responses:
 *       200:
 *         description: Queue cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     clearedMessages:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.post('/clear', adminRateLimiter, QueueController.clearQueue);

/**
 * @swagger
 * /api/v1/queue/config:
 *   put:
 *     summary: Update queue configuration (Admin only)
 *     tags: [Queue Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minDelay:
 *                 type: number
 *                 description: Minimum delay between messages (ms)
 *               maxDelay:
 *                 type: number
 *                 description: Maximum delay between messages (ms)
 *               maxAttempts:
 *                 type: number
 *                 description: Maximum retry attempts
 *               retryDelay:
 *                 type: number
 *                 description: Delay between retries (ms)
 *               messagesPerMinute:
 *                 type: number
 *                 description: Maximum messages per minute per device
 *               burstLimit:
 *                 type: number
 *                 description: Burst limit for messages
 *               typingDelay:
 *                 type: boolean
 *                 description: Enable typing indicator simulation
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       500:
 *         description: Internal server error
 */
router.put('/config', adminRateLimiter, QueueController.updateQueueConfig);

/**
 * @swagger
 * /api/v1/devices/{id}/health:
 *   get:
 *     summary: Get device health status
 *     tags: [Device Health]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device health retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DeviceHealth'
 *       404:
 *         description: Device not found or no health data
 *       500:
 *         description: Internal server error
 */
router.get('/devices/:id/health', clientOperationRateLimiter, QueueController.getDeviceHealth);

/**
 * @swagger
 * /api/v1/devices/{id}/queue-status:
 *   get:
 *     summary: Get device-specific queue and health status
 *     tags: [Device Health, Queue Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device status retrieved successfully
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
 *                     deviceId:
 *                       type: string
 *                     queue:
 *                       type: object
 *                       properties:
 *                         messagesInLast60s:
 *                           type: number
 *                         lastMessageTime:
 *                           type: number
 *                         queuedMessages:
 *                           type: number
 *                     health:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         score:
 *                           type: number
 *                         warnings:
 *                           type: array
 *                           items:
 *                             type: string
 *                     safety:
 *                       type: object
 *                       properties:
 *                         safe:
 *                           type: boolean
 *                         reason:
 *                           type: string
 *                     recommendedDelay:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/devices/:id/queue-status', clientOperationRateLimiter, QueueController.getDeviceQueueStatus);

/**
 * @swagger
 * /api/v1/devices/{id}/warmup:
 *   post:
 *     summary: Start warmup phase for a device
 *     tags: [Device Health]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Warmup phase started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     deviceId:
 *                       type: string
 *                     warmupStarted:
 *                       type: boolean
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.post('/devices/:id/warmup', clientOperationRateLimiter, QueueController.startDeviceWarmup);

/**
 * @swagger
 * /api/v1/health/devices:
 *   get:
 *     summary: Get health status for all devices
 *     tags: [Device Health]
 *     responses:
 *       200:
 *         description: All devices health retrieved successfully
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
 *                     devices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeviceHealth'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         healthy:
 *                           type: number
 *                         warning:
 *                           type: number
 *                         critical:
 *                           type: number
 *                         blocked:
 *                           type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/health/devices', clientOperationRateLimiter, QueueController.getAllDevicesHealth);

/**
 * @swagger
 * /api/v1/health/attention:
 *   get:
 *     summary: Get devices that need attention
 *     tags: [Device Health]
 *     responses:
 *       200:
 *         description: Devices needing attention retrieved successfully
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
 *                     devices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeviceHealth'
 *                     count:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/health/attention', clientOperationRateLimiter, QueueController.getDevicesNeedingAttention);

/**
 * @swagger
 * /api/v1/blocking-prevention/dashboard:
 *   get:
 *     summary: Get comprehensive blocking prevention dashboard data
 *     tags: [Queue Management, Device Health]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     queue:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: number
 *                         processing:
 *                           type: number
 *                         totalQueued:
 *                           type: number
 *                         throughput:
 *                           type: string
 *                           enum: [Active, Idle]
 *                     health:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         healthy:
 *                           type: number
 *                         warning:
 *                           type: number
 *                         critical:
 *                           type: number
 *                         blocked:
 *                           type: number
 *                         averageScore:
 *                           type: number
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         devicesNeedingAttention:
 *                           type: number
 *                         criticalDevices:
 *                           type: number
 *                         queueBacklog:
 *                           type: boolean
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           score:
 *                             type: number
 *                           messagesPerHour:
 *                             type: number
 *                           successRate:
 *                             type: number
 *                           warnings:
 *                             type: number
 *                           warmupPhase:
 *                             type: boolean
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/blocking-prevention/dashboard', clientOperationRateLimiter, QueueController.getBlockingPreventionDashboard);

export default router;
