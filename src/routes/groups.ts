import { Router } from 'express';
import { GroupsController } from '../controllers/groups.controller';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true }); // mergeParams to access parent route params

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/join:
 *   post:
 *     summary: Join a WhatsApp group using invite link or code
 *     tags: [Groups]
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
 *         description: Group ID (for reference, actual joining uses invite code/link)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 description: Group invite code
 *               inviteLink:
 *                 type: string
 *                 format: uri
 *                 description: Full group invite link
 *             oneOf:
 *               - required: [inviteCode]
 *               - required: [inviteLink]
 *           examples:
 *             inviteCode:
 *               summary: Join using invite code
 *               value:
 *                 inviteCode: "ABC123DEF456"
 *             inviteLink:
 *               summary: Join using invite link
 *               value:
 *                 inviteLink: "https://chat.whatsapp.com/ABC123DEF456"
 *     responses:
 *       200:
 *         description: Successfully joined the group
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
 *                     deviceId:
 *                       type: string
 *                     groupId:
 *                       type: string
 *                     message:
 *                       type: string
 *                     result:
 *                       type: object
 *       400:
 *         description: Bad request (invalid invite, already member, etc.)
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.post('/:groupId/join', 
  validate(schemas.groupId, 'params'), 
  validate(schemas.joinGroup, 'body'), 
  GroupsController.joinGroup
);

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/leave:
 *   post:
 *     summary: Leave a WhatsApp group
 *     tags: [Groups]
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
 *         description: Group ID to leave
 *     responses:
 *       200:
 *         description: Successfully left the group
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
 *                     deviceId:
 *                       type: string
 *                     groupId:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Bad request (not a member, group not found, etc.)
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.post('/:groupId/leave', 
  validate(schemas.groupId, 'params'), 
  GroupsController.leaveGroup
);

// Future stub endpoints
/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/participants/add:
 *   post:
 *     summary: Add participants to a group (Future stub)
 *     tags: [Groups, Future]
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
 *       501:
 *         description: Not implemented yet
 */
router.post('/:groupId/participants/add', 
  validate(schemas.groupId, 'params'), 
  GroupsController.addParticipants
);

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/participants/remove:
 *   post:
 *     summary: Remove participants from a group (Future stub)
 *     tags: [Groups, Future]
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
 *       501:
 *         description: Not implemented yet
 */
router.post('/:groupId/participants/remove', 
  validate(schemas.groupId, 'params'), 
  GroupsController.removeParticipants
);

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/subject:
 *   put:
 *     summary: Set group subject/name (Future stub)
 *     tags: [Groups, Future]
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
 *       501:
 *         description: Not implemented yet
 */
router.put('/:groupId/subject', 
  validate(schemas.groupId, 'params'), 
  GroupsController.setGroupSubject
);

/**
 * @swagger
 * /api/v1/devices/{id}/groups/{groupId}/description:
 *   put:
 *     summary: Set group description (Future stub)
 *     tags: [Groups, Future]
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
 *       501:
 *         description: Not implemented yet
 */
router.put('/:groupId/description', 
  validate(schemas.groupId, 'params'), 
  GroupsController.setGroupDescription
);

export default router;
