import { Router } from 'express';
import * as MentionsGroupsController from '../controllers/mentions-groups.controller';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Mentions & Groups
 *   description: User mentions and group operations
 */

/**
 * @swagger
 * /api/v1/devices/{id}/groups:
 *   get:
 *     summary: Get all groups the device is part of
 *     tags: [Mentions & Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: includeParticipants
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include participants list in response
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *       400:
 *         description: Device not ready
 */
router.get('/groups', MentionsGroupsController.getGroups);

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/participants:
 *   get:
 *     summary: Get participants of a specific group
 *     tags: [Mentions & Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group participants retrieved successfully
 *       400:
 *         description: Device not ready or chat is not a group
 */
router.get('/groups/:groupId/participants', MentionsGroupsController.getGroupParticipants);

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/mention:
 *   post:
 *     summary: Send a message with mentions to a group
 *     tags: [Mentions & Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/mentionGroupMessage'
 *     responses:
 *       200:
 *         description: Message with mentions sent successfully
 *       400:
 *         description: Invalid request or device not ready
 */
router.post('/groups/:groupId/mention', 
  validate(schemas.mentionGroupMessage, 'body'),
  MentionsGroupsController.mentionUsersInGroup
);

/**
 * @swagger
 * /api/v1/devices/{id}/mentions/send:
 *   post:
 *     summary: Send a message with mentions to any chat
 *     tags: [Mentions & Groups]
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
 *             $ref: '#/components/schemas/mentionMessage'
 *     responses:
 *       200:
 *         description: Message with mentions sent successfully
 *       400:
 *         description: Invalid request or device not ready
 */
router.post('/mentions/send', 
  validate(schemas.mentionMessage, 'body'),
  MentionsGroupsController.sendMentionMessage
);

/**
 * @swagger
 * /api/v1/devices/{id}/contacts/mentionable:
 *   get:
 *     summary: Get contacts that can be mentioned
 *     tags: [Mentions & Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for contact name or number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of contacts to return
 *     responses:
 *       200:
 *         description: Mentionable contacts retrieved successfully
 *       400:
 *         description: Device not ready
 */
router.get('/contacts/mentionable', MentionsGroupsController.getMentionableContacts);

export default router;
