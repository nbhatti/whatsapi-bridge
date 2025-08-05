import { Router, Request, Response } from 'express';
import {
  strictRateLimiter,
  messageRateLimiter,
  uploadRateLimiter,
  optionalApiKeyAuth,
  validate,
} from '../middlewares';
import { schemas } from '../config/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Examples
 *   description: Example endpoints demonstrating middleware usage
 */

/**
 * @swagger
 * /api/v1/examples/public:
 *   get:
 *     summary: A public endpoint with optional authentication
 *     tags: [Examples]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/public', optionalApiKeyAuth, (req: Request, res: Response) => {
  const authenticated = (req as any).authenticated;
  res.json({
    success: true,
    message: 'This is a public endpoint.',
    authenticated,
  });
});

/**
 * @swagger
 * /api/v1/examples/protected:
 *   get:
 *     summary: A protected endpoint requiring API key authentication
 *     tags: [Examples]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.get('/protected', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is a protected endpoint. API key is valid.',
  });
});

/**
 * @swagger
 * /api/v1/examples/strict:
 *   post:
 *     summary: A strictly rate-limited endpoint
 *     tags: [Examples]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       429:
 *         description: Too many requests
 */
router.post('/strict', strictRateLimiter, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is a strictly rate-limited endpoint.',
  });
});

/**
 * @swagger
 * /api/v1/examples/messaging:
 *   post:
 *     summary: A messaging endpoint with message rate limiting
 *     tags: [Examples]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       429:
 *         description: Too many requests
 */
router.post('/messaging', messageRateLimiter, validate(schemas.exampleMessage), (req: Request, res: Response) => {
  const { message, priority } = req.body;
  res.json({
    success: true,
    message: 'This is a messaging endpoint with per-user rate limiting.',
    data: {
      receivedMessage: message,
      priority,
    },
  });
});

/**
 * @swagger
 * /api/v1/examples/upload:
 *   post:
 *     summary: An upload endpoint with upload rate limiting
 *     tags: [Examples]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       429:
 *         description: Too many requests
 */
router.post('/upload', uploadRateLimiter, validate(schemas.exampleUpload), (req: Request, res: Response) => {
  const { fileName, fileType, fileSize } = req.body;
  res.json({
    success: true,
    message: 'This is an upload endpoint with upload rate limiting.',
    data: {
      fileName,
      fileType,
      fileSize,
      uploadedAt: new Date().toISOString(),
    },
  });
});

export default router;

