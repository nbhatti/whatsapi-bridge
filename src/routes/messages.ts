import { Router } from 'express';
import * as MessageController from '../controllers/message.controller';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Unified message operations with queue reliability, advanced features, and complete message management
 */

/**
 * @swagger
 * /api/v1/devices/{id}/messages/send:
 *   post:
 *     summary: Send messages (text, media, location) with queue reliability
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
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number or chat ID
 *               text:
 *                 type: string
 *                 description: Message text
 *               media:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     description: Base64 encoded media data
 *                   mimetype:
 *                     type: string
 *                     example: "image/jpeg"
 *                   filename:
 *                     type: string
 *                     example: "photo.jpg"
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 40.7128
 *                   longitude:
 *                     type: number
 *                     example: -74.0060
 *                   description:
 *                     type: string
 *                     example: "New York City"
 *               quotedMessageId:
 *                 type: string
 *                 description: ID of message to quote/reply to
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of phone numbers to mention
 *               priority:
 *                 type: string
 *                 enum: [high, normal, low]
 *                 default: normal
 *                 description: Message priority (when using queue)
 *               useQueue:
 *                 type: boolean
 *                 default: true
 *                 description: Use queue system for reliability (recommended)
 *               enableTyping:
 *                 type: boolean
 *                 default: true
 *                 description: Show typing indicator (when using queue)
 *     responses:
 *       201:
 *         description: Message sent immediately (useQueue=false)
 *       202:
 *         description: Message queued successfully (useQueue=true)
 *       400:
 *         description: Invalid request or device not ready
 *       429:
 *         description: Device health protection - sending blocked
 *       500:
 *         description: Failed to send message
 */
router.post('/send', 
  validate(schemas.sendUnifiedMessage, 'body'),
  MessageController.sendMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/forward:
 *   post:
 *     summary: Forward messages with queue option
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
 *               - messageId
 *               - to
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to forward
 *               to:
 *                 type: string
 *                 description: Recipient chat ID or phone number
 *               fromChatId:
 *                 type: string
 *                 description: Optional source chat ID for faster lookup
 *               useQueue:
 *                 type: boolean
 *                 default: false
 *                 description: Use queue system for forwarding
 *     responses:
 *       200:
 *         description: Message forwarded successfully
 *       202:
 *         description: Forward operation queued
 *       404:
 *         description: Message not found
 */
router.post('/forward', 
  validate(schemas.forwardUnifiedMessage, 'body'),
  MessageController.forwardMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/delete:
 *   post:
 *     summary: Delete messages
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
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of message to delete
 *               forEveryone:
 *                 type: boolean
 *                 default: false
 *                 description: Delete for everyone (if possible)
 *               fromChatId:
 *                 type: string
 *                 description: Optional chat ID for faster lookup
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Message not found
 */
router.post('/delete', 
  validate(schemas.deleteUnifiedMessage, 'body'),
  MessageController.deleteMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/search:
 *   get:
 *     summary: Search messages across chats
 *     tags: [Messages]
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
 *           maximum: 100
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
router.get('/search', MessageController.searchMessages);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/status:
 *   get:
 *     summary: Get message queue and device status
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: messageId
 *         schema:
 *           type: string
 *         description: Optional message ID to check
 *     responses:
 *       200:
 *         description: Status information
 */
router.get('/status', MessageController.getMessageStatus);

export default router;
