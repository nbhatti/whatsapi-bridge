import { Router } from 'express';
import { ChatController, AIController } from '../controllers';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/v1/devices/{id}/chats:
 *   get:
 *     summary: List all chats for a device
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, unread, groups, private, archived]
 *           default: all
 *         description: Filter chats by type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of chats to return
 *       - in: query
 *         name: summary
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return chat summary (ID, name, last message) instead of full chat objects
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search chats by name, phone number, or last message content
 *     responses:
 *       200:
 *         description: List of chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.get('/', validate(schemas.listChats, 'query'), ChatController.listChats);

/**
 * @swagger
 * /api/v1/devices/{id}/chats:
 *   post:
 *     summary: Send a message to a chat
 *     tags: [Chats]
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
 *                 description: Chat ID or phone number
 *               text:
 *                 type: string
 *                 description: Message text (required if no media)
 *               media:
 *                 type: object
 *                 properties:
 *                   mimetype:
 *                     type: string
 *                     example: "image/jpeg"
 *                   data:
 *                     type: string
 *                     description: Base64 encoded media data
 *                   filename:
 *                     type: string
 *                     example: "image.jpg"
 *               quotedMessageId:
 *                 type: string
 *                 description: ID of message to quote
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of phone numbers to mention
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 40.7128
 *                     description: Latitude coordinate
 *                   longitude:
 *                     type: number
 *                     example: -74.0060
 *                     description: Longitude coordinate
 *                   description:
 *                     type: string
 *                     example: "New York City"
 *                     description: Optional location description
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.post('/', validate(schemas.sendChatMessage), ChatController.sendMessage);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}:
 *   get:
 *     summary: Get chat details by ID
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat details retrieved successfully
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.get('/:chatId', validate(schemas.chatId, 'params'), ChatController.getChatById);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}:
 *   delete:
 *     summary: Delete a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:chatId', validate(schemas.chatId, 'params'), ChatController.deleteChat);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/clear:
 *   post:
 *     summary: Clear all messages in a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat cleared successfully
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chatId/clear', validate(schemas.chatId, 'params'), ChatController.clearChat);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/archive:
 *   post:
 *     summary: Archive a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat archived successfully
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chatId/archive', validate(schemas.chatId, 'params'), ChatController.archiveChat);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/unarchive:
 *   post:
 *     summary: Unarchive a chat
 *     tags: [Chats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat unarchived successfully
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chatId/unarchive', validate(schemas.chatId, 'params'), ChatController.unarchiveChat);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/messages:
 *   get:
 *     summary: Fetch messages from a chat
 *     tags: [Chats, Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of messages to fetch
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Fetch messages before this message ID
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Fetch messages after this message ID
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.get('/:chatId/messages', 
  validate(schemas.chatId, 'params'), 
  validate(schemas.fetchChatMessages, 'query'), 
  ChatController.fetchMessages
);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/messages/forward:
 *   post:
 *     summary: Forward a message from a chat
 *     tags: [Chats, Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
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
 *     responses:
 *       200:
 *         description: Message forwarded successfully
 *       404:
 *         description: Device, chat or message not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chatId/messages/forward',
  validate(schemas.chatId, 'params'),
  validate(schemas.forwardMessage, 'body'),
  ChatController.forwardMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/messages/delete:
 *   post:
 *     summary: Delete a message from a chat
 *     tags: [Chats, Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
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
 *                 description: ID of the message to delete
 *               forEveryone:
 *                 type: boolean
 *                 default: false
 *                 description: Delete for everyone (if possible)
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Device, chat or message not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chatId/messages/delete',
  validate(schemas.chatId, 'params'),
  validate(schemas.deleteMessage, 'body'),
  ChatController.deleteMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/location:
 *   post:
 *     summary: Send location message
 *     tags: [Chats, Messages]
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
 *               - latitude
 *               - longitude
 *             properties:
 *               to:
 *                 type: string
 *                 description: Chat ID or phone number
 *               latitude:
 *                 type: number
 *                 example: 40.7128
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate (-90 to 90)
 *               longitude:
 *                 type: number
 *                 example: -74.0060
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate (-180 to 180)
 *               description:
 *                 type: string
 *                 example: "Times Square, New York"
 *                 description: Optional location description
 *     responses:
 *       200:
 *         description: Location message sent successfully
 *       400:
 *         description: Invalid coordinates or request data
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.post('/location', ChatController.sendLocation);

/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/analyze:
 *   post:
 *     summary: Analyze a chat with AI
 *     tags: [Chats, AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/analyzeChatAI'
 *     responses:
 *       200:
 *         description: Chat analysis successful
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Device or chat not found
 *       500:
 *         description: Internal server error
 */
router.post('/:chatId/analyze',
  validate(schemas.chatId, 'params'),
  validate(schemas.analyzeChatAI, 'body'),
  AIController.analyzeChat
);

export default router;
