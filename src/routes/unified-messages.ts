import { Router } from 'express';
import * as UnifiedMessageController from '../controllers/unified-message.controller';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Unified Messages
 *   description: All-in-one message operations with proper forwarding, media, and location support
 */

/**
 * @swagger
 * /api/v1/devices/{id}/messages/send:
 *   post:
 *     summary: Unified message sending (text, media, location)
 *     tags: [Unified Messages]
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
 *             $ref: '#/components/schemas/sendUnifiedMessage'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request or device not ready
 *       500:
 *         description: Failed to send message
 */
router.post('/send', 
  validate(schemas.sendUnifiedMessage, 'body'),
  UnifiedMessageController.sendUnifiedMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/forward:
 *   post:
 *     summary: Forward a message with proper indicator
 *     tags: [Unified Messages]
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
 *             $ref: '#/components/schemas/forwardUnifiedMessage'
 *     responses:
 *       200:
 *         description: Message forwarded successfully
 *       404:
 *         description: Message not found
 */
router.post('/forward', 
  validate(schemas.forwardUnifiedMessage, 'body'),
  UnifiedMessageController.forwardMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/delete:
 *   post:
 *     summary: Delete a message for yourself or everyone
 *     tags: [Unified Messages]
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
 *             $ref: '#/components/schemas/deleteUnifiedMessage'
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Message not found
 */
router.post('/delete', 
  validate(schemas.deleteUnifiedMessage, 'body'),
  UnifiedMessageController.deleteMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/edit:
 *   post:
 *     summary: Edit a message (if supported)
 *     tags: [Unified Messages]
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
 *             $ref: '#/components/schemas/editUnifiedMessage'
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       400:
 *         description: Editing not supported or failed
 */
router.post('/edit', 
  validate(schemas.editUnifiedMessage, 'body'),
  UnifiedMessageController.editMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/search:
 *   get:
 *     summary: Search for messages across chats
 *     tags: [Unified Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum results
 *       - in: query
 *         name: chatId
 *         schema:
 *           type: string
 *         description: Optional chat ID to search within
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', UnifiedMessageController.searchMessages);

export default router;
