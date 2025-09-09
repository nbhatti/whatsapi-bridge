# 📖 Mark as Read API Documentation

This document describes the Mark as Read functionality implemented using WhatsApp Web.js `sendSeen()` methods.

## 🎯 Overview

The Mark as Read API allows you to mark WhatsApp messages and chats as read, reducing unread counts and updating the seen status. This is useful for:

- **Automated chat management**: Automatically mark messages as read
- **Customer service**: Mark support chats as read after processing
- **Bot responses**: Mark user messages as read after processing
- **Unread count management**: Keep unread counts accurate

## 🔗 Available Endpoints

### 1. Mark Chat as Read

```http
POST /api/v1/devices/{deviceId}/chats/{chatId}/markRead
```

Marks **all unread messages** in the specified chat as read.

#### Parameters
- `deviceId` (path): The WhatsApp device ID
- `chatId` (path): The chat ID (e.g., "1234567890@c.us" for individual or "1234567890-5678@g.us" for group)

#### Response
```json
{
  "success": true,
  "message": "Chat marked as read successfully",
  "data": {
    "chatId": "1234567890@c.us",
    "unreadCount": 0,
    "markedAt": "2024-01-10T15:30:00.000Z"
  }
}
```

### 2. Mark Specific Message as Read

```http
POST /api/v1/devices/{deviceId}/chats/{chatId}/messages/{messageId}/markRead
```

**Note**: Due to WhatsApp Web.js limitations, this endpoint marks **all messages in the chat as read**, not just the specific message.

#### Parameters
- `deviceId` (path): The WhatsApp device ID
- `chatId` (path): The chat ID
- `messageId` (path): The message ID (used for verification only)

#### Response
```json
{
  "success": true,
  "message": "Message marked as read successfully (all messages in chat marked as read)",
  "data": {
    "chatId": "1234567890@c.us",
    "messageId": "false_1234567890@c.us_ABC123",
    "markedAt": "2024-01-10T15:30:00.000Z",
    "note": "WhatsApp Web.js marks all messages in chat as read, not individual messages"
  }
}
```

## 🛠️ Usage Examples

### Using cURL

```bash
# Mark entire chat as read
curl -X POST http://localhost:3000/api/v1/devices/your-device-id/chats/1234567890@c.us/markRead

# Mark specific message as read (actually marks whole chat)
curl -X POST http://localhost:3000/api/v1/devices/your-device-id/chats/1234567890@c.us/messages/false_1234567890@c.us_ABC123/markRead
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const deviceId = 'your-device-id';
const chatId = '1234567890@c.us';

// Mark chat as read
async function markChatAsRead() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/devices/${deviceId}/chats/${chatId}/markRead`
    );
    console.log('Chat marked as read:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Mark specific message as read
async function markMessageAsRead(messageId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/devices/${deviceId}/chats/${chatId}/messages/${messageId}/markRead`
    );
    console.log('Message marked as read:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Using Python

```python
import requests

BASE_URL = 'http://localhost:3000'
device_id = 'your-device-id'
chat_id = '1234567890@c.us'

# Mark chat as read
def mark_chat_as_read():
    url = f"{BASE_URL}/api/v1/devices/{device_id}/chats/{chat_id}/markRead"
    response = requests.post(url)
    
    if response.status_code == 200:
        print("Chat marked as read:", response.json())
    else:
        print("Error:", response.json())

# Mark message as read
def mark_message_as_read(message_id):
    url = f"{BASE_URL}/api/v1/devices/{device_id}/chats/{chat_id}/messages/{message_id}/markRead"
    response = requests.post(url)
    
    if response.status_code == 200:
        print("Message marked as read:", response.json())
    else:
        print("Error:", response.json())
```

## 🔍 Checking Unread Messages

To see which chats have unread messages and verify the mark-as-read functionality:

```bash
# Get all unread chats
curl "http://localhost:3000/api/v1/devices/your-device-id/chats?filter=unread&summary=true"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890@c.us",
      "name": "Contact Name",
      "isGroup": false,
      "unreadCount": 3,
      "lastMessage": {
        "body": "Hello, are you there?",
        "timestamp": 1704902400,
        "fromMe": false
      }
    }
  ]
}
```

## ⚠️ Important Notes

### WhatsApp Web.js Limitations
1. **No Individual Message Marking**: WhatsApp Web.js doesn't support marking individual messages as read. The `markMessageAsRead` endpoint marks the entire chat as read.

2. **Chat-Level Operation**: The `chat.sendSeen()` method marks all unread messages in a chat as seen, not selective messages.

3. **Real-time Updates**: After marking as read, the `unreadCount` should immediately reflect as 0 for that chat.

### Best Practices

1. **Use Chat-Level Marking**: For most use cases, use `/markRead` (chat-level) instead of `/messages/{messageId}/markRead`.

2. **Check Device Status**: Ensure the device is in `ready` status before calling mark-as-read endpoints.

3. **Handle Errors**: Always handle potential errors like device not found, chat not found, or device not ready.

4. **Rate Limiting**: Don't call these endpoints too frequently to avoid potential WhatsApp rate limiting.

## 📊 Error Responses

### Device Not Found (404)
```json
{
  "success": false,
  "error": "Device not found"
}
```

### Device Not Ready (400)
```json
{
  "success": false,
  "error": "Device is not ready. Current status: initializing",
  "currentStatus": "initializing"
}
```

### Chat Not Found (500)
```json
{
  "success": false,
  "error": "Failed to mark chat as read",
  "details": "Chat not found or inaccessible"
}
```

### Message Not Found (404)
```json
{
  "success": false,
  "error": "Message not found"
}
```

## 🧪 Testing

Use the provided test script to verify the functionality:

```bash
node test-mark-read.js
```

Make sure to update the script with real device ID, chat ID, and message ID values.

## 🔄 Integration Workflow

A typical workflow for using mark-as-read functionality:

1. **Get Unread Chats**: Use `/chats?filter=unread` to see which chats have unread messages
2. **Process Messages**: Fetch and process messages from unread chats
3. **Mark as Read**: Call `/markRead` to mark the chat as read after processing
4. **Verify**: Check that `unreadCount` is now 0

This creates a complete automated message processing system with proper read status management.
