import { Router } from 'express';
import { downloadMedia, getMediaThumbnail, getMediaInfo } from '../controllers/media.controller';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';

const router = Router({ mergeParams: true }); // mergeParams to access device ID from parent route

/**
 * @swagger
 * /api/v1/devices/{id}/messages/{messageId}/media/download:
 *   get:
 *     summary: Download media from a message
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID containing the media
 *     responses:
 *       200:
 *         description: Media file downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *           video/*:
 *             schema:
 *               type: string
 *               format: binary
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               description: The MIME type of the media file
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               description: Attachment with filename
 *           Content-Length:
 *             schema:
 *               type: integer
 *               description: Size of the media file in bytes
 *       400:
 *         description: Device not ready or message has no media
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
 *                   example: "Message does not contain media"
 *       404:
 *         description: Device or message not found
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
 *                   example: "Message not found or not accessible"
 *       500:
 *         description: Failed to download media
 */
router.get('/:messageId/media/download', downloadMedia);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/{messageId}/media/thumbnail:
 *   get:
 *     summary: Get media thumbnail (for images and videos)
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID containing the media
 *     responses:
 *       200:
 *         description: Media thumbnail returned successfully
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               description: The MIME type of the thumbnail
 *           Cache-Control:
 *             schema:
 *               type: string
 *               description: Caching instructions
 *       400:
 *         description: Media type does not support thumbnails
 *       404:
 *         description: No thumbnail available
 *       501:
 *         description: Thumbnail extraction not implemented for this media type
 */
router.get('/:messageId/media/thumbnail', getMediaThumbnail);

/**
 * @swagger
 * /api/v1/devices/{id}/messages/{messageId}/media/info:
 *   get:
 *     summary: Get media information without downloading
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID containing the media
 *     responses:
 *       200:
 *         description: Media information retrieved successfully
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
 *                     messageId:
 *                       type: string
 *                       description: Message ID
 *                     hasMedia:
 *                       type: boolean
 *                       description: Whether message contains media
 *                     type:
 *                       type: string
 *                       enum: [image, video, audio, document, sticker, ptt]
 *                       description: Type of media
 *                     downloadUrl:
 *                       type: string
 *                       description: URL to download the full media
 *                     thumbnailUrl:
 *                       type: string
 *                       description: URL to get media thumbnail
 *                     infoUrl:
 *                       type: string
 *                       description: URL to get this media info
 *                     duration:
 *                       type: number
 *                       description: Duration in seconds (for audio/video)
 *                       nullable: true
 *       400:
 *         description: Message does not contain media
 *       404:
 *         description: Device or message not found
 */
router.get('/:messageId/media/info', getMediaInfo);

export default router;
