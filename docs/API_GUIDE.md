# WhatsApp Messages API Guide

## 🚀 Overview

This is a clean, unified WhatsApp messaging API that combines reliability, advanced features, and complete message management in one system.

## 🎯 Core Endpoints

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
  "to": "1234567890",
  "text": "Hello World!",
  "useQueue": true,
  "priority": "normal"
}
```

### **Media Message with Caption**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "1234567890",
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
  "to": "1234567890",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "New York City"
  },
  "useQueue": true,
  "priority": "high"
}
```

### **Reply to Message**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "1234567890",
  "text": "Great idea!",
  "quotedMessageId": "message_id_to_reply_to",
  "useQueue": true
}
```

### **Message with Mentions**
```json
POST /api/v1/devices/device123/messages/send
{
  "to": "group_chat_id",
  "text": "Hello @John and @Jane!",
  "mentions": ["1234567890", "0987654321"],
  "useQueue": true
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
