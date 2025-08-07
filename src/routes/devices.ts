import { Router } from 'express';
import { DeviceController } from '../controllers';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';
import messageRoutes from './messages';
import groupRoutes from './groups';
import chatRoutes from './chats';
import analyticsRoutes from './analytics';
import mentionsGroupsRoutes from './mentions-groups';

const router = Router();

// --- Main API v1 Routes ---

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     summary: Create a new WhatsApp device
 *     tags: [Devices]
 *     responses:
 *       201:
 *         description: Device created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/', DeviceController.createDevice);

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: List all devices
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: List of devices
 *       500:
 *         description: Internal server error
 */
router.get('/', DeviceController.listDevices);

/**
 * @swagger
 * /api/v1/devices/delete-all:
 *   delete:
 *     summary: Delete all devices (Admin)
 *     tags: [Admin, Devices]
 *     responses:
 *       200:
 *         description: All devices deleted
 */
router.delete('/delete-all', DeviceController.deleteAllDevices);

/**
 * @swagger
 * /api/v1/devices/{id}/status:
 *   get:
 *     summary: Get device status
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device status, with QR data URL if applicable
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/status', validate(schemas.deviceId, 'params'), DeviceController.getDeviceStatus);

// Chat routes for each device
router.use('/:id/chats', chatRoutes);

// Messages - All message operations with queue reliability, advanced features, and management
router.use('/:id/messages', messageRoutes);

// Group routes for each device
router.use('/:id/groups', groupRoutes);

// Mentions and Groups functionality
import mentionsGroupsRoutes from './mentions-groups';
router.use('/:id', mentionsGroupsRoutes);

// Analytics routes for each device
router.use('/:id/analytics', analyticsRoutes);

/**
 * @swagger
 * /api/v1/devices/{id}/contacts:
 *   post:
 *     summary: Get contacts for a device with optional filtering
 *     tags: [Devices, Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/deviceId/properties/id'
 *         description: Device ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/getContacts'
 *     responses:
 *       200:
 *         description: Contact list retrieved successfully
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1234567890@c.us"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       number:
 *                         type: string
 *                         example: "1234567890"
 *                       profilePicUrl:
 *                         type: string
 *                         example: "https://example.com/pic.jpg"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/contacts', validate(schemas.deviceId, 'params'), validate(schemas.getContacts, 'body'), DeviceController.getContacts);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   delete:
 *     summary: Gracefully logout and cleanup a device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device logged out and cleaned up successfully
 *       404:
 *         description: Device not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', validate(schemas.deviceId, 'params'), DeviceController.deleteDevice);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details
 *       404:
 *         description: Device not found
 */
router.get('/:id', validate(schemas.deviceId, 'params'), DeviceController.getDevice);

/**
 * @swagger
 * /api/v1/devices/{id}/qr:
 *   get:
 *     summary: Get QR code for device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code data
 *       404:
 *         description: Device not found or no QR code
 */
router.get('/:id/qr', validate(schemas.deviceId, 'params'), DeviceController.getDeviceQR);

/**
 * @swagger
 * /api/v1/devices/{id}/qr.png:
 *   get:
 *     summary: Get QR code as PNG image
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code as PNG image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Device not found or no QR code
 */
router.get('/:id/qr.png', validate(schemas.deviceId, 'params'), DeviceController.getDeviceQRImage);

export default router;
