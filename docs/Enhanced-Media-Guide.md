# Enhanced Media Guide

Your WhatsApp Web.js REST API wrapper now provides comprehensive media support with detailed file information for all media types including images, videos, audio files, documents, and more.

## Overview

When fetching messages, non-text messages (media files) are now presented with detailed information that makes it easy to identify, display, and download the media content.

## Enhanced Message Format

### Text Messages
```json
{
  "id": "messageId",
  "chatId": "chatId",
  "body": "Hello, how are you?",
  "type": "text",
  "timestamp": 1699123456789,
  "fromMe": false,
  "hasMedia": false,
  "isForwarded": false,
  "isStarred": false
}
```

### Media Messages
```json
{
  "id": "messageId",
  "chatId": "chatId", 
  "body": "Check out this photo!",
  "type": "image",
  "timestamp": 1699123456789,
  "fromMe": true,
  "hasMedia": true,
  "isForwarded": false,
  "isStarred": false,
  "mediaInfo": {
    "mimetype": "image/jpeg",
    "mediaType": "image",
    "downloadUrl": "/api/v1/devices/device-id/messages/message-id/media/download",
    "thumbnailUrl": "/api/v1/devices/device-id/messages/message-id/media/thumbnail",
    "filename": "photo.jpg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### Audio/Voice Messages
```json
{
  "id": "messageId",
  "chatId": "chatId",
  "body": "",
  "type": "ptt",
  "timestamp": 1699123456789,
  "fromMe": false,
  "hasMedia": true,
  "mediaInfo": {
    "mimetype": "audio/ogg",
    "mediaType": "audio",
    "downloadUrl": "/api/v1/devices/device-id/messages/message-id/media/download",
    "duration": 15.5
  }
}
```

### Video Messages
```json
{
  "id": "messageId",
  "chatId": "chatId",
  "body": "Check this video!",
  "type": "video",
  "timestamp": 1699123456789,
  "fromMe": true,
  "hasMedia": true,
  "mediaInfo": {
    "mimetype": "video/mp4",
    "mediaType": "video",
    "downloadUrl": "/api/v1/devices/device-id/messages/message-id/media/download",
    "thumbnailUrl": "/api/v1/devices/device-id/messages/message-id/media/thumbnail",
    "duration": 30.2,
    "dimensions": {
      "width": 1280,
      "height": 720
    }
  }
}
```

### Document Messages
```json
{
  "id": "messageId",
  "chatId": "chatId",
  "body": "Here's the document you requested",
  "type": "document",
  "timestamp": 1699123456789,
  "fromMe": true,
  "hasMedia": true,
  "mediaInfo": {
    "mimetype": "application/pdf",
    "mediaType": "document",
    "downloadUrl": "/api/v1/devices/device-id/messages/message-id/media/download",
    "filename": "report.pdf",
    "filesize": 1048576
  }
}
```

## Media Types Supported

| Type | Description | Has Thumbnail | Duration Info | Dimensions |
|------|-------------|---------------|---------------|------------|
| `image` | Photos, pictures | ✅ | ❌ | ✅ |
| `video` | Video files | ✅* | ✅ | ✅ |
| `audio` | Regular audio files | ❌ | ✅ | ❌ |
| `ptt` | Voice messages (Push-to-Talk) | ❌ | ✅ | ❌ |
| `document` | Files, PDFs, etc. | ❌ | ❌ | ❌ |
| `sticker` | WhatsApp stickers | ❌ | ❌ | ❌ |

*Video thumbnails are planned but not yet implemented.

## Media API Endpoints

### 1. Download Media
Download the full media file:
```
GET /api/v1/devices/{deviceId}/messages/{messageId}/media/download
```

**Response:** Binary file with appropriate headers:
- `Content-Type`: The media MIME type
- `Content-Disposition`: Filename for download
- `Content-Length`: File size in bytes

### 2. Get Thumbnail
Get a thumbnail for images (videos planned):
```
GET /api/v1/devices/{deviceId}/messages/{messageId}/media/thumbnail
```

**Response:** Image thumbnail (JPEG/PNG)

### 3. Get Media Info
Get media information without downloading:
```
GET /api/v1/devices/{deviceId}/messages/{messageId}/media/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "messageId",
    "hasMedia": true,
    "type": "image",
    "downloadUrl": "/api/v1/devices/device-id/messages/message-id/media/download",
    "thumbnailUrl": "/api/v1/devices/device-id/messages/message-id/media/thumbnail",
    "infoUrl": "/api/v1/devices/device-id/messages/message-id/media/info",
    "duration": null
  }
}
```

## Enhanced Features

### Location Messages
```json
{
  "id": "messageId",
  "type": "location",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "New York City"
  }
}
```

### Quoted Messages (Replies)
```json
{
  "id": "messageId",
  "quotedMessage": {
    "id": "originalMessageId",
    "body": "Original message text",
    "author": "1234567890@c.us",
    "type": "text"
  }
}
```

### Message Reactions
```json
{
  "id": "messageId",
  "reactions": [
    {
      "id": "reactionId",
      "aggregateEmoji": "👍",
      "hasReactionByMe": false
    }
  ]
}
```

### Mentions and Links
```json
{
  "id": "messageId",
  "mentionedIds": ["1234567890@c.us", "0987654321@c.us"],
  "links": [
    {
      "link": "https://example.com",
      "isSuspicious": false
    }
  ]
}
```

## Usage Examples

### Fetch Messages with Media Details
```bash
curl "http://localhost:3000/api/v1/devices/device-id/chats/chat-id/messages?limit=20"
```

### Download Image from Message
```bash
curl "http://localhost:3000/api/v1/devices/device-id/messages/message-id/media/download" \
  -o downloaded_image.jpg
```

### Get Thumbnail for Preview
```bash
curl "http://localhost:3000/api/v1/devices/device-id/messages/message-id/media/thumbnail" \
  -o thumbnail.jpg
```

### Check Media Info Before Download
```bash
curl "http://localhost:3000/api/v1/devices/device-id/messages/message-id/media/info"
```

## Frontend Integration Examples

### Display Media Messages
```javascript
// Check if message has media
if (message.hasMedia && message.mediaInfo) {
  const { mediaType, downloadUrl, thumbnailUrl, mimetype } = message.mediaInfo;
  
  switch (mediaType) {
    case 'image':
      // Show image with thumbnail preview
      return `<img src="${thumbnailUrl}" onclick="window.open('${downloadUrl}')" />`;
      
    case 'video':
      // Show video player with controls
      return `<video controls><source src="${downloadUrl}" type="${mimetype}"></video>`;
      
    case 'audio':
      // Show audio player
      return `<audio controls><source src="${downloadUrl}" type="${mimetype}"></audio>`;
      
    case 'document':
      // Show download link with filename
      const filename = message.mediaInfo.filename || 'document';
      return `<a href="${downloadUrl}" download="${filename}">📄 ${filename}</a>`;
      
    default:
      // Generic media download
      return `<a href="${downloadUrl}" download>📎 Media File</a>`;
  }
}
```

### React Component Example
```jsx
function MediaMessage({ message }) {
  if (!message.hasMedia || !message.mediaInfo) {
    return <div>{message.body}</div>;
  }

  const { mediaType, downloadUrl, thumbnailUrl, duration } = message.mediaInfo;

  switch (mediaType) {
    case 'image':
      return (
        <div>
          <img 
            src={thumbnailUrl} 
            onClick={() => window.open(downloadUrl)}
            style={{ maxWidth: '300px', cursor: 'pointer' }}
          />
          {message.body && <p>{message.body}</p>}
        </div>
      );

    case 'audio':
      return (
        <div>
          <audio controls>
            <source src={downloadUrl} />
          </audio>
          {duration && <span>Duration: {Math.round(duration)}s</span>}
        </div>
      );

    case 'video':
      return (
        <div>
          <video controls style={{ maxWidth: '400px' }}>
            <source src={downloadUrl} />
          </video>
          {message.body && <p>{message.body}</p>}
        </div>
      );

    default:
      return (
        <div>
          <a href={downloadUrl} download>
            📎 Download {mediaType}
          </a>
          {message.body && <p>{message.body}</p>}
        </div>
      );
  }
}
```

## Performance Considerations

### Efficient Media Loading
1. **Use Thumbnails**: For images, load thumbnails first for quick preview
2. **Lazy Loading**: Only download full media when needed
3. **Caching**: Media downloads are cached with appropriate headers
4. **Batch Processing**: Message formatting is optimized for multiple messages

### Bandwidth Management
- Thumbnails are much smaller than full media files
- Media info endpoint provides details without downloading
- Progressive loading allows users to choose what to download

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Message does not contain media"
}
```

```json
{
  "success": false,
  "error": "Message not found or not accessible"
}
```

```json
{
  "success": false,
  "error": "Media type does not support thumbnails"
}
```

### Best Practices
1. Always check `hasMedia` before accessing `mediaInfo`
2. Handle cases where media download might fail
3. Provide fallback UI for unsupported media types
4. Use appropriate loading states for media downloads

## Security Notes

1. **Access Control**: Media downloads require valid device access
2. **Rate Limiting**: Prevent abuse of download endpoints
3. **Content Validation**: Media is validated before serving
4. **Privacy**: Media URLs include device/message IDs for security

This enhanced media system provides a complete solution for handling WhatsApp media files with detailed information, efficient downloads, and comprehensive frontend integration support.
