import { Router } from 'express';
import { CacheController } from '../controllers';
import { MetricsService } from '../config/metrics';

const router = Router();

/**
 * @swagger
 * /api/v1/cache:
 *   delete:
 *     summary: Flush WhatsApp message cache
 *     tags: [Cache]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Cache flushed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flushed:
 *                   type: boolean
 *                   example: true
 *                 keysRemoved:
 *                   type: number
 *                   example: 2
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to flush cache"
 *                 flushed:
 *                   type: boolean
 *                   example: false
 *                 keysRemoved:
 *                   type: number
 *                   example: 0
 */
router.delete('/', CacheController.flushCache);

/**
 * @swagger
 * /api/v1/cache/health:
 *   get:
 *     summary: Get cache health status
 *     tags: [Cache]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Cache health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 redis:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: true
 *                     pingLatencyMs:
 *                       type: number
 *                       example: 5
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                 cache:
 *                   type: object
 *                   properties:
 *                     listSizes:
 *                       type: object
 *                       properties:
 *                         in:
 *                           type: number
 *                           example: 150
 *                         out:
 *                           type: number
 *                           example: 75
 *                     syncIntervalMs:
 *                       type: number
 *                       example: 5000
 *                     maxListLength:
 *                       type: number
 *                       example: 1000
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Cache unhealthy
 */
router.get('/health', CacheController.cacheHealth);

/**
 * @swagger
 * /api/v1/cache/metrics:
 *   get:
 *     summary: Get Prometheus metrics for cache
 *     tags: [Cache]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Prometheus metrics in text format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await MetricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
