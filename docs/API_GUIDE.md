# WhatsApp API Guide

## 🚀 Overview

This is a clean, unified WhatsApp API that combines reliability, advanced features, and complete message and chat management in one system.

## 🔍 Finding Chat IDs (Important!)

Before sending messages, you need to find the correct Chat ID. WhatsApp uses specific ID formats:
- **Individual chats**: `923009401404@c.us`
- **Groups**: `923009401404-1234567890@g.us`

### **Method 1: Helper Script (Recommended)**
```bash
# Make it executable once
chmod +x ./find-chat.sh

# Search by name or phone number
./find-chat.sh "Wife"
./find-chat.sh "923009401404"
./find-chat.sh "Project Team"
```

### **Method 2: Chat Search API**
```
GET /api/v1/devices/{deviceId}/chats/search?q={searchTerm}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/search?q=Wife&limit=5" \
  -H "x-api-key: your-api-key" | jq
```

**Response:**
```json
{
  "success": true,
  "query": "Wife",
  "found": 1,
  "results": [
    {
      "id": "923009401404@c.us",
      "name": "Wife",
      "type": "private",
      "unread": 1,
      "lastMessage": "Hello there",
      "getDetailsUrl": "/api/v1/devices/device123/chats/923009401404@c.us"
    }
  ]
}
```

### **Method 3: List All Chats with Search**
```
GET /api/v1/devices/{deviceId}/chats?search={term}&summary=true
```

## 💬 Chat Management

### **Get Chat Details**
```
GET /api/v1/devices/{deviceId}/chats/{chatId}
```

### **List All Chats**
```
GET /api/v1/devices/{deviceId}/chats
```

### **Search Chats**
```
GET /api/v1/devices/{deviceId}/chats?search={term}&filter={type}&limit={count}
```

Filters: `all`, `unread`, `groups`, `private`, `archived`

## 🎯 Message Endpoints

### **Send Messages**
```
POST /api/v1/devices/{deviceId}/messages/send
```

**Features:**
- ✅ Text, media, and location messages
- ✅ Queue system for reliability
- ✅ Device health protection
- ✅ Message quotes and mentions
- ✅ Priority queues and typing indicators

### **Forward Messages**
```
POST /api/v1/devices/{deviceId}/messages/forward
```

### **Delete Messages**
```
POST /api/v1/devices/{deviceId}/messages/delete
```

### **Search Messages**
```
GET /api/v1/devices/{deviceId}/messages/search
```

### **Queue Status**
```
GET /api/v1/devices/{deviceId}/messages/status
```

## 📝 Examples

### **Basic Text Message**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "923009401404@c.us",
  "text": "Hello World!",
  "useQueue": true,
  "priority": "normal"
}
```

⚠️ **Important**: Always use the full Chat ID format (`923009401404@c.us`), not just the phone number!

### **Media Message with Caption**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "923009401404@c.us",
  "text": "Check this photo!",
  "media": {
    "mimetype": "image/jpeg",
    "data": "base64encodeddata...",
    "filename": "photo.jpg"
  },
  "useQueue": true
}
```

### **Location Message**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "923009401404@c.us",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "New York City"
  },
  "useQueue": true,
  "priority": "high"
}
```

### **Send Location via Chat Route (Alternative)**
```json
POST /api/v1/devices/device123/chats/location
{
  "to": "923009401404@c.us",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Times Square, New York"
}
```

### **Reply to Message**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "923009401404@c.us",
  "text": "Great idea!",
  "quotedMessageId": "message_id_to_reply_to",
  "useQueue": true
}
```

### **Message with Mentions**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "923001234567-1642634400@g.us",
  "text": "Hello @John and @Jane!",
  "mentions": ["923001234567@c.us", "923007654321@c.us"],
  "useQueue": true
}
```

### **Send Message via Chat Route (Alternative)**
```json
POST /api/v1/devices/device123/chats
{
  "to": "923009401404@c.us",
  "text": "Hello from chat route!"
}
```

## ⚙️ Key Options

### **useQueue** (boolean, default: true)
- `true`: Reliable delivery with health protection (**recommended**)
- `false`: Immediate sending without protection

### **priority** (string, default: "normal")
- `"high"`: Urgent messages sent first
- `"normal"`: Default priority  
- `"low"`: Bulk messages sent last

### **enableTyping** (boolean, default: true)
- Shows typing indicator for natural conversation flow

## 🔍 Message Search
```json
GET /api/v1/devices/device123/messages/search?query=meeting&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "messageId": "msg_123",
      "chatId": "1234567890@c.us",
      "chatName": "John Doe", 
      "body": "Let's schedule a meeting",
      "timestamp": 1642634400
    }
  ]
}
```

## 📊 Queue Status Monitoring
```json
GET /api/v1/devices/device123/messages/status

Response:
{
  "success": true,
  "data": {
    "deviceId": "device123",
    "queue": {
      "pending": 5,
      "processing": 1
    },
    "health": {
      "status": "healthy",
      "score": 85
    },
    "safety": {
      "safe": true,
      "reason": "Device is healthy"
    }
  }
}
```

## 📋 Response Codes

- **201 Created**: Message sent immediately (`useQueue: false`)
- **202 Accepted**: Message queued successfully (`useQueue: true`)  
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Device or message not found
- **429 Too Many Requests**: Device health protection active
- **500 Internal Error**: Server error

## 💡 Best Practices

### **Production Use:**
```json
{
  "useQueue": true,
  "priority": "normal",
  "enableTyping": true
}
```

### **Bulk Messaging:**
```json
{
  "useQueue": true,
  "priority": "low", 
  "enableTyping": false
}
```

### **Urgent Messages:**
```json
{
  "useQueue": true,
  "priority": "high",
  "enableTyping": true
}
```

### **Development/Testing:**
```json
{
  "useQueue": false  // For immediate feedback
}
```

## 🛡️ Device Health Protection

The system automatically protects your devices from being banned by:

- **Smart Delays**: Human-like timing between messages
- **Rate Limiting**: Prevents sending too many messages too quickly
- **Health Monitoring**: Blocks sending when device shows warning signs
- **Retry Logic**: Automatically retries failed messages

Monitor device health with: `GET /api/v1/devices/{deviceId}/messages/status`

## 🚀 Getting Started

1. **Create a device**: `POST /api/v1/devices`
2. **Get QR code**: `GET /api/v1/devices/{deviceId}/qr`
3. **Check status**: `GET /api/v1/devices/{deviceId}/status` 
4. **Send messages**: `POST /api/v1/devices/{deviceId}/messages/send`

**The unified system gives you reliability, features, and simplicity all in one! 🎉**
