/**
 * @swagger
 * components:
 *   schemas:
 *     MediaInfo:
 *       type: object
 *       properties:
 *         mimetype:
 *           type: string
 *           description: MIME type of the media file
 *           example: "image/jpeg"
 *         filesize:
 *           type: integer
 *           description: File size in bytes
 *           example: 1048576
 *         filename:
 *           type: string
 *           description: Original filename
 *           example: "photo.jpg"
 *         mediaType:
 *           type: string
 *           enum: [image, video, audio, document, sticker]
 *           description: Type of media content
 *           example: "image"
 *         downloadUrl:
 *           type: string
 *           description: URL to download the full media file
 *           example: "/api/v1/devices/device-id/messages/message-id/media/download"
 *         thumbnailUrl:
 *           type: string
 *           description: URL to get media thumbnail (images only)
 *           example: "/api/v1/devices/device-id/messages/message-id/media/thumbnail"
 *         duration:
 *           type: number
 *           description: Duration in seconds (audio/video only)
 *           example: 30.5
 *         dimensions:
 *           type: object
 *           description: Media dimensions (images/videos only)
 *           properties:
 *             width:
 *               type: integer
 *               example: 1920
 *             height:
 *               type: integer
 *               example: 1080
 * 
 *     LocationInfo:
 *       type: object
 *       properties:
 *         latitude:
 *           type: number
 *           description: GPS latitude coordinate
 *           example: 40.7128
 *         longitude:
 *           type: number
 *           description: GPS longitude coordinate
 *           example: -74.0060
 *         description:
 *           type: string
 *           description: Location description
 *           example: "New York City"
 * 
 *     QuotedMessage:
 *       type: object
 *       description: Information about quoted/replied message
 *       properties:
 *         id:
 *           type: string
 *           description: ID of the quoted message
 *           example: "quoted_message_id"
 *         body:
 *           type: string
 *           description: Text content of quoted message
 *           example: "Original message content"
 *         author:
 *           type: string
 *           description: Author of the quoted message
 *           example: "1234567890@c.us"
 *         type:
 *           type: string
 *           description: Type of the quoted message
 *           example: "text"
 * 
 *     MessageReaction:
 *       type: object
 *       description: Message reaction information
 *       properties:
 *         id:
 *           type: string
 *           description: Reaction ID
 *           example: "reaction_id"
 *         aggregateEmoji:
 *           type: string
 *           description: Reaction emoji
 *           example: "👍"
 *         hasReactionByMe:
 *           type: boolean
 *           description: Whether the current device/user reacted
 *           example: false
 * 
 *     MessageLink:
 *       type: object
 *       description: Detected link in message
 *       properties:
 *         link:
 *           type: string
 *           description: The detected URL
 *           example: "https://example.com"
 *         isSuspicious:
 *           type: boolean
 *           description: Whether the link is flagged as suspicious
 *           example: false
 * 
 *     EnhancedMessage:
 *       type: object
 *       description: Enhanced message object with comprehensive media and metadata information
 *       properties:
 *         id:
 *           type: string
 *           description: Unique message identifier
 *           example: "message_id_12345"
 *         chatId:
 *           type: string
 *           description: Chat/conversation identifier
 *           example: "1234567890@c.us"
 *         body:
 *           type: string
 *           description: Message text content
 *           example: "Hello, check out this image!"
 *         type:
 *           type: string
 *           description: Message type
 *           enum: [text, image, video, audio, ptt, document, sticker, location, vcard]
 *           example: "image"
 *         timestamp:
 *           type: integer
 *           description: Message timestamp in milliseconds
 *           example: 1699123456789
 *         fromMe:
 *           type: boolean
 *           description: Whether the message was sent by the current device
 *           example: true
 *         author:
 *           type: string
 *           description: Message author (for group messages)
 *           example: "1234567890@c.us"
 *         hasMedia:
 *           type: boolean
 *           description: Whether the message contains media
 *           example: true
 *         isForwarded:
 *           type: boolean
 *           description: Whether the message was forwarded
 *           example: false
 *         isStarred:
 *           type: boolean
 *           description: Whether the message is starred
 *           example: false
 *         mediaInfo:
 *           $ref: '#/components/schemas/MediaInfo'
 *         location:
 *           $ref: '#/components/schemas/LocationInfo'
 *         vCards:
 *           type: array
 *           description: vCard contact information
 *           items:
 *             type: object
 *         mentionedIds:
 *           type: array
 *           description: IDs of mentioned users
 *           items:
 *             type: string
 *           example: ["1234567890@c.us", "0987654321@c.us"]
 *         links:
 *           type: array
 *           description: Detected links in the message
 *           items:
 *             $ref: '#/components/schemas/MessageLink'
 *         quotedMessage:
 *           $ref: '#/components/schemas/QuotedMessage'
 *         reactions:
 *           type: array
 *           description: Message reactions
 *           items:
 *             $ref: '#/components/schemas/MessageReaction'
 * 
 *     MediaInfoResponse:
 *       type: object
 *       description: Response from media info endpoint
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             messageId:
 *               type: string
 *               description: Message ID
 *               example: "message_id_12345"
 *             hasMedia:
 *               type: boolean
 *               description: Whether message contains media
 *               example: true
 *             type:
 *               type: string
 *               enum: [image, video, audio, document, sticker, ptt]
 *               description: Type of media
 *               example: "image"
 *             downloadUrl:
 *               type: string
 *               description: URL to download the full media
 *               example: "/api/v1/devices/device-id/messages/message-id/media/download"
 *             thumbnailUrl:
 *               type: string
 *               description: URL to get media thumbnail
 *               example: "/api/v1/devices/device-id/messages/message-id/media/thumbnail"
 *             infoUrl:
 *               type: string
 *               description: URL to get this media info
 *               example: "/api/v1/devices/device-id/messages/message-id/media/info"
 *             duration:
 *               type: number
 *               nullable: true
 *               description: Duration in seconds (for audio/video)
 *               example: 15.5
 * 
 *     EnhancedMessagesResponse:
 *       type: object
 *       description: Response containing enhanced messages with pagination
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EnhancedMessage'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of messages found
 *               example: 150
 *             returned:
 *               type: integer
 *               description: Number of messages returned in this response
 *               example: 20
 *             requestedLimit:
 *               type: integer
 *               description: Requested limit
 *               example: 20
 *             hasMore:
 *               type: boolean
 *               description: Whether more messages are available
 *               example: true
 *             referenceFound:
 *               type: boolean
 *               description: Whether pagination reference was found
 *               example: true
 *             referenceType:
 *               type: string
 *               nullable: true
 *               enum: [before, after]
 *               description: Type of pagination reference
 *               example: "before"
 *             referenceId:
 *               type: string
 *               nullable: true
 *               description: Pagination reference message ID
 *               example: "ref_message_id"
 *             cursors:
 *               type: object
 *               properties:
 *                 newer:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     after:
 *                       type: string
 *                       example: "newer_message_id"
 *                     url:
 *                       type: string
 *                       example: "/api/v1/devices/device-id/chats/chat-id/messages?limit=20&after=newer_message_id"
 *                 older:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     before:
 *                       type: string
 *                       example: "older_message_id"
 *                     url:
 *                       type: string
 *                       example: "/api/v1/devices/device-id/chats/chat-id/messages?limit=20&before=older_message_id"
 * 
 *     MediaSearchResponse:
 *       type: object
 *       description: Response from message search with media details
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/EnhancedMessage'
 *               - type: object
 *                 properties:
 *                   chatName:
 *                     type: string
 *                     description: Name of the chat where message was found
 *                     example: "John Doe"
 *         query:
 *           type: string
 *           description: Search query used
 *           example: "photo"
 *         totalResults:
 *           type: integer
 *           description: Total number of results found
 *           example: 5
 *         searchScope:
 *           type: string
 *           enum: [single_chat, all_chats]
 *           description: Scope of the search
 *           example: "all_chats"
 * 
 *     ErrorResponse:
 *       type: object
 *       description: Standard error response
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Message not found or not accessible"
 *         details:
 *           type: string
 *           description: Additional error details (development only)
 *           example: "Detailed error information"
 *         code:
 *           type: string
 *           description: Error code for programmatic handling
 *           example: "MEDIA_NOT_FOUND"
 */

// This file contains Swagger schemas for media functionality
// The schemas are defined in JSDoc format and will be automatically
// picked up by swagger-jsdoc when processing the routes

export const mediaSchemas = {
  // This export ensures the file is treated as a module
  // The actual schemas are defined in the JSDoc comments above
};
