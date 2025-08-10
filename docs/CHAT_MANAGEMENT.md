# Chat Management API Guide

## 🔍 Finding Chat IDs - The Key to Success!

**Before sending any messages, you must find the correct Chat ID!** WhatsApp doesn't use simple phone numbers - it uses specific ID formats.

### Chat ID Formats
- **Individual chats**: `923009401404@c.us` (phone number + @c.us)
- **Groups**: `923001234567-1642634400@g.us` (number + timestamp + @g.us)

---

## 🛠️ Three Easy Ways to Find Chat IDs

### Method 1: Helper Script (Recommended) 🎯

The fastest way! Use our included helper script:

```bash
# Make it executable (one time setup)
chmod +x ./find-chat.sh

# Search by name
./find-chat.sh "Wife"
./find-chat.sh "John Doe" 
./find-chat.sh "Project Team"

# Search by phone number
./find-chat.sh "923009401404"
./find-chat.sh "923001234567"

# Search by partial name
./find-chat.sh "Muhammad"
```

**Example Output:**
```
🔍 Searching for chats containing: 'Wife'
---
✅ Found 1 chat(s):

📱 Chat ID: 923009401404@c.us
👤 Name: Wife
🏠 Type: Private
📬 Unread: 1
⏰ Last message: Hello there
---
💡 Quick command to get full chat details:
curl -sS "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us" -H "x-api-key: your-api-key" | jq
```

### Method 2: Search API 🚀

**Endpoint**: `GET /api/v1/devices/{deviceId}/chats/search`

```bash
# Search by name
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/search?q=Wife&limit=5" \
  -H "x-api-key: your-api-key" | jq

# Search by phone number
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/search?q=923009401404" \
  -H "x-api-key: your-api-key" | jq

# Search in message content
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/search?q=meeting" \
  -H "x-api-key: your-api-key" | jq
```

**Response:**
```json
{
  "success": true,
  "query": "Wife",
  "found": 1,
  "total": 1,
  "results": [
    {
      "id": "923009401404@c.us",
      "name": "Wife",
      "type": "private",
      "unread": 1,
      "lastMessage": "Hello there",
      "timestamp": 1754750700,
      "getDetailsUrl": "/api/v1/devices/device123/chats/923009401404@c.us"
    }
  ]
}
```

### Method 3: List with Search Filter 📋

**Endpoint**: `GET /api/v1/devices/{deviceId}/chats`

```bash
# List all chats with search
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats?search=Wife&summary=true&limit=10" \
  -H "x-api-key: your-api-key" | jq

# Filter by type
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats?filter=unread&summary=true" \
  -H "x-api-key: your-api-key" | jq

# Search in groups only
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats?search=team&filter=groups" \
  -H "x-api-key: your-api-key" | jq
```

**Filters Available:**
- `all` - All chats (default)
- `unread` - Chats with unread messages
- `groups` - Group chats only
- `private` - Individual chats only
- `archived` - Archived chats

---

## 📱 Chat Management Operations

### Get Chat Details

Once you have a Chat ID, get full details:

```bash
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us" \
  -H "x-api-key: your-api-key" | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": {
      "server": "c.us",
      "user": "923009401404",
      "_serialized": "923009401404@c.us"
    },
    "name": "Wife",
    "isGroup": false,
    "isReadOnly": false,
    "unreadCount": 1,
    "timestamp": 1754750700,
    "archived": false,
    "pinned": false,
    "isMuted": false,
    "lastMessage": {
      // Full message object
    }
  }
}
```

### Send Message to Chat

```bash
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats" \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "923009401404@c.us",
    "text": "Hello from the API!"
  }'
```

### Send Location

```bash
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats/location" \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "923009401404@c.us",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "Times Square, New York"
  }'
```

### Get Chat Messages

```bash
# Get recent messages
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/messages?limit=20" \
  -H "x-api-key: your-api-key" | jq

# Get messages before a specific message
curl -X GET "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/messages?limit=20&before=message_id" \
  -H "x-api-key: your-api-key" | jq
```

### Chat Actions

```bash
# Archive chat
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/archive" \
  -H "x-api-key: your-api-key"

# Unarchive chat
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/unarchive" \
  -H "x-api-key: your-api-key"

# Clear all messages in chat
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/clear" \
  -H "x-api-key: your-api-key"

# Delete chat
curl -X DELETE "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us" \
  -H "x-api-key: your-api-key"
```

### Forward Message

```bash
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/messages/forward" \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "message_id_to_forward",
    "to": "923001234567@c.us"
  }'
```

### Delete Message

```bash
curl -X POST "http://localhost:3000/api/v1/devices/device123/chats/923009401404@c.us/messages/delete" \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "message_id_to_delete",
    "forEveryone": true
  }'
```

---

## 🎯 Quick Reference Commands

Set up environment variables for easier use:

```bash
export BASE_URL="http://localhost:3000"
export API_KEY="your-api-key"
export DEVICE_ID="your-device-id"
```

### Common Operations

```bash
# 1. Find chat ID
./find-chat.sh "Wife"

# 2. Get chat details
curl -sS "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/923009401404@c.us" \
  -H "x-api-key: $API_KEY" | jq

# 3. Send message
curl -sS -X POST "$BASE_URL/api/v1/devices/$DEVICE_ID/chats" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "923009401404@c.us", "text": "Hello!"}' | jq

# 4. Get recent messages
curl -sS "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/923009401404@c.us/messages?limit=10" \
  -H "x-api-key: $API_KEY" | jq
```

---

## 🔧 Advanced Search Examples

### Search Multiple Terms
```bash
# Search for chats containing specific words
curl -X GET "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/search?q=Muhammad&limit=10" \
  -H "x-api-key: $API_KEY" | jq '.results[] | {id, name, type}'

# Search for phone numbers
curl -X GET "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/search?q=9230&limit=5" \
  -H "x-api-key: $API_KEY" | jq '.results[] | {id, name}'
```

### Find All Unread Chats
```bash
curl -X GET "$BASE_URL/api/v1/devices/$DEVICE_ID/chats?filter=unread&summary=true" \
  -H "x-api-key: $API_KEY" | jq '.data[] | {id, name, unreadCount}'
```

### Find Group Chats
```bash
curl -X GET "$BASE_URL/api/v1/devices/$DEVICE_ID/chats?filter=groups&summary=true&limit=20" \
  -H "x-api-key: $API_KEY" | jq '.data[] | {id, name, type: "group"}'
```

---

## ⚠️ Important Notes

1. **Always Use Full Chat IDs**: Never use just phone numbers. Always use the full format like `923009401404@c.us`

2. **URL Encoding**: If Chat IDs contain special characters, make sure to URL encode them:
   ```bash
   # For chat IDs with special characters
   CHAT_ID=$(echo "923009401404@c.us" | sed 's/@/%40/g')
   curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID" -H "x-api-key: $API_KEY"
   ```

3. **Case Sensitive**: Search is case-insensitive for names but exact for phone numbers

4. **Caching**: Search results are cached for 5 minutes for better performance

5. **Rate Limiting**: Don't search too frequently to avoid hitting rate limits

---

## 🚀 Getting Started Workflow

1. **Create and authenticate device**
2. **Use helper script to find Chat IDs**: `./find-chat.sh "Contact Name"`
3. **Copy the Chat ID from the results**
4. **Use the Chat ID in your message/chat operations**
5. **Get chat details if needed for more information**

**That's it! You now have everything you need to manage chats effectively! 🎉**
