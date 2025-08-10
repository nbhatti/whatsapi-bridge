# Enhanced Swagger Documentation Updates

## Updated Message Fetching Endpoint

Replace the existing `/api/v1/devices/{id}/chats/{chatId}/messages` documentation with this enhanced version:

```yaml
/**
 * @swagger
 * /api/v1/devices/{id}/chats/{chatId}/messages:
 *   get:
 *     summary: Fetch messages from a chat with enhanced media details and cursor-based pagination
 *     description: |
 *       Fetch messages from a specific chat with comprehensive media information including:
 *       - Download URLs for media files (images, videos, audio, documents)
 *       - Thumbnail URLs for images
 *       - Media metadata (duration, dimensions, file sizes)
 *       - Location information for location messages
 *       - Quoted message details for replies
 *       - Message reactions, mentions, and links
 *       
 *       Supports cursor-based pagination using `before` and `after` parameters.
 *     tags: [Chats, Messages, Media]
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
 *         description: Chat ID (e.g., "923009401404@c.us")
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of messages to fetch
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Fetch messages before this message ID (older messages)
 *         example: "false_923009401404@c.us_MESSAGE_ID_HERE"
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Fetch messages after this message ID (newer messages)
 *         example: "false_923009401404@c.us_MESSAGE_ID_HERE"
 *     responses:
 *       200:
 *         description: Messages fetched successfully with enhanced media details and pagination info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnhancedMessagesResponse'
 *             examples:
 *               text_message:
 *                 summary: Text message example
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "message_123"
 *                       chatId: "923009401404@c.us"
 *                       body: "Hello, how are you?"
 *                       type: "text"
 *                       timestamp: 1699123456789
 *                       fromMe: false
 *                       hasMedia: false
 *                       isForwarded: false
 *                       isStarred: false
 *                   pagination:
 *                     total: 1
 *                     returned: 1
 *                     hasMore: false
 *               image_message:
 *                 summary: Image message with media details
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "message_456"
 *                       chatId: "923009401404@c.us"
 *                       body: "Check out this photo!"
 *                       type: "image"
 *                       timestamp: 1699123456789
 *                       fromMe: true
 *                       hasMedia: true
 *                       isForwarded: false
 *                       isStarred: false
 *                       mediaInfo:
 *                         mimetype: "image/jpeg"
 *                         mediaType: "image"
 *                         downloadUrl: "/api/v1/devices/device-id/messages/message_456/media/download"
 *                         thumbnailUrl: "/api/v1/devices/device-id/messages/message_456/media/thumbnail"
 *                         dimensions:
 *                           width: 1920
 *                           height: 1080
 *                   pagination:
 *                     total: 1
 *                     returned: 1
 *                     hasMore: false
 *               voice_message:
 *                 summary: Voice message with duration
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "message_789"
 *                       chatId: "923009401404@c.us"
 *                       body: ""
 *                       type: "ptt"
 *                       timestamp: 1699123456789
 *                       fromMe: false
 *                       hasMedia: true
 *                       isForwarded: false
 *                       isStarred: false
 *                       mediaInfo:
 *                         mimetype: "audio/ogg"
 *                         mediaType: "audio"
 *                         downloadUrl: "/api/v1/devices/device-id/messages/message_789/media/download"
 *                         duration: 15.5
 *                   pagination:
 *                     total: 1
 *                     returned: 1
 *                     hasMore: false
 *       404:
 *         description: Device or chat not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

## Message Search Endpoint Updates

Update the message search endpoint documentation:

```yaml
/**
 * @swagger
 * /api/v1/devices/{id}/messages/search:
 *   get:
 *     summary: Search messages across chats with enhanced media details
 *     description: |
 *       Search for messages across all chats or within a specific chat.
 *       Returns enhanced message objects with complete media information.
 *     tags: [Messages, Media]
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
 *         description: Search query text
 *         example: "photo"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of results to return
 *       - in: query
 *         name: chatId
 *         schema:
 *           type: string
 *         description: Optional chat ID to search within specific chat
 *         example: "923009401404@c.us"
 *     responses:
 *       200:
 *         description: Search results with enhanced message details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaSearchResponse'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

## Additional Schema Definitions

The following schemas should be added to the Swagger definition:

1. **EnhancedMessage** - Complete message object with media details
2. **MediaInfo** - Media file information and download URLs
3. **LocationInfo** - GPS coordinates and location details
4. **QuotedMessage** - Information about replied-to messages
5. **MessageReaction** - Message reaction details
6. **MessageLink** - Detected links in messages
7. **EnhancedMessagesResponse** - Response format for message lists
8. **MediaInfoResponse** - Response format for media info endpoint
9. **MediaSearchResponse** - Response format for message search
10. **ErrorResponse** - Standard error response format

These schemas provide comprehensive documentation for all the enhanced media functionality, making it easy for API consumers to understand the rich data structure returned by your enhanced WhatsApp API.

## Testing the Documentation

After implementing these updates:

1. Start your development server: `npm run dev`
2. Visit the Swagger docs at: `http://localhost:3000/docs`
3. Look for the new "Media" tag in the API documentation
4. Test the enhanced message endpoints to see the rich response format
5. Use the media download URLs to fetch actual media files

The documentation now properly reflects the enhanced media capabilities of your API, making it much easier for developers to integrate with your WhatsApp media functionality.
