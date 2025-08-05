import { Router } from 'express';
import { AIController } from '../controllers';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/ai/providers:
 *   get:
 *     summary: Get available AI providers
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: List of available AI providers
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
 *                     default:
 *                       type: string
 *                       example: "openrouter"
 *                     available:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           provider:
 *                             type: string
 *                           model:
 *                             type: string
 *                           available:
 *                             type: boolean
 *       500:
 *         description: Internal server error
 */
router.get('/providers', AIController.getProviders);

/**
 * @swagger
 * /api/v1/ai/providers/{provider}/test:
 *   post:
 *     summary: Test an AI provider connection
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [openai, openrouter, xai, custom]
 *         description: AI provider name
 *     responses:
 *       200:
 *         description: Provider test result
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
 *                     success:
 *                       type: boolean
 *                     response:
 *                       type: string
 *                     error:
 *                       type: string
 *       500:
 *         description: Internal server error
 */
router.post('/providers/:provider/test', AIController.testProvider);

export default router;
