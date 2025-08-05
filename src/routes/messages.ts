import { Router } from 'express';
import { MessageController } from '../controllers';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true }); // mergeParams allows access to device :id param

/**
 * @swagger
 * /api/v1/devices/{id}/messages:
 *   post:
 *     summary: Send a message from a device
 *     tags: [Messages]
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
 *               - to
 *               - type
 *             properties:
 *               to:
 *                 type: string
 *                 pattern: '^\\d{10,15}$'
 *                 description: Recipient phone number with country code
 *               type:
 *                 type: string
 *                 enum: [text, image, video, audio, document, sticker]
 *                 default: text
 *                 description: Message type
 *               text:
 *                 type: string
 *                 description: Message text (required for text messages)
 *               mediaBase64:
 *                 type: string
 *                 description: Base64 encoded media (for non-text messages)
 *               quotedId:
 *                 type: string
 *                 description: ID of message to quote
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of phone numbers to mention
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or device not ready
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  validate(schemas.deviceId, 'params'),
  validate(schemas.sendMessage, 'body'),
  MessageController.sendMessage
);

// Message fetching is now handled by the chat routes at /api/v1/devices/{id}/chats/{chatId}/messages

export default router;
