# Chat Management Examples

This document provides examples of how to manage WhatsApp chats using the REST API.

## Prerequisites

1. Ensure your device is ready and authenticated
2. Have your API key ready (`test-api-key-123` in examples)
3. Replace `{DEVICE_ID}` with your actual device ID

## Chat Listing

### 1. Get Full Chat Details (Default)

Get complete chat objects with all properties:

```bash
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats"
```

Response includes full chat objects with all WhatsApp Web.js properties.

### 2. Get Chat Summary (NEW!)

Get a clean, lightweight summary of chats - perfect for displaying chat lists in UI:

```bash
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats?summary=true"
```

**Summary Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "923008449347@c.us",
      "name": "John Doe",
      "isGroup": false,
      "unreadCount": 3,
      "lastMessage": {
        "body": "Thanks for your help!",
        "timestamp": 1754433757,
        "fromMe": false
      },
      "timestamp": 1754433757,
      "archived": false,
      "pinned": true,
      "muted": false
    },
    {
      "id": "120363022222222222@g.us",
      "name": "Team Discussion",
      "isGroup": true,
      "unreadCount": 0,
      "lastMessage": {
        "body": "Meeting at 3 PM",
        "timestamp": 1754433650,
        "fromMe": true
      },
      "timestamp": 1754433650,
      "archived": false,
      "pinned": false,
      "muted": true
    }
  ],
  "total": 25,
  "returned": 2
}
```

### 3. Limit Number of Chats

```bash
# Get summary of first 10 chats
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats?summary=true&limit=10"
```

### 4. Filter Chats by Type

```bash
# Get only group chats summary
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats?summary=true&filter=groups"

# Get only unread chats
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats?summary=true&filter=unread"

# Get archived chats
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats?summary=true&filter=archived"
```

## Chat Summary Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | WhatsApp chat ID (e.g., "923008449347@c.us") |
| `name` | string | Chat name (contact name or group name) |
| `isGroup` | boolean | True if this is a group chat |
| `unreadCount` | number | Number of unread messages |
| `lastMessage.body` | string | Text of the last message |
| `lastMessage.timestamp` | number | Unix timestamp of last message |
| `lastMessage.fromMe` | boolean | True if last message was sent by you |
| `timestamp` | number | Unix timestamp of chat's last activity |
| `archived` | boolean | True if chat is archived |
| `pinned` | boolean | True if chat is pinned |
| `muted` | boolean | True if chat notifications are muted |

## Use Cases for Chat Summary

### Mobile App Chat List
Perfect for building WhatsApp-like chat interfaces:

```javascript
// Fetch chat list for mobile app
const chatList = await fetch('/api/v1/devices/123/chats?summary=true&limit=50');
const chats = await chatList.json();

// Display in UI
chats.data.forEach(chat => {
  displayChatItem({
    id: chat.id,
    name: chat.name,
    lastMessage: chat.lastMessage.body,
    unreadBadge: chat.unreadCount,
    isGroup: chat.isGroup,
    timestamp: new Date(chat.lastMessage.timestamp * 1000)
  });
});
```

### Chat Search and Filtering
Quick filtering without heavy data:

```bash
# Get only chats with unread messages
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats?summary=true&filter=unread"
```

### Analytics Dashboard
Monitor chat activity:

```javascript
const response = await fetch('/api/v1/devices/123/chats?summary=true');
const { data } = await response.json();

const analytics = {
  totalChats: data.length,
  unreadCount: data.reduce((sum, chat) => sum + chat.unreadCount, 0),
  groupChats: data.filter(chat => chat.isGroup).length,
  mutedChats: data.filter(chat => chat.muted).length,
  pinnedChats: data.filter(chat => chat.pinned).length
};
```

### Performance Benefits

**Full Chat Response:** ~15KB per chat (includes all WhatsApp metadata)
**Summary Response:** ~200 bytes per chat (essential info only)

**75x smaller** for large chat lists!

## Chat Management Operations

### Get Specific Chat Details

```bash
curl -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/923008449347@c.us"
```

### Archive Chat

```bash
curl -X POST -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/923008449347@c.us/archive"
```

### Unarchive Chat

```bash
curl -X POST -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/923008449347@c.us/unarchive"
```

### Clear Chat Messages

```bash
curl -X POST -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/923008449347@c.us/clear"
```

### Delete Chat

```bash
curl -X DELETE -H "x-api-key: test-api-key-123" \
  "http://localhost:3000/api/v1/devices/{DEVICE_ID}/chats/923008449347@c.us"
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `summary` | boolean | false | Return lightweight summary instead of full objects |
| `limit` | integer | 50 | Number of chats to return (1-100) |
| `filter` | string | "all" | Filter type: "all", "unread", "groups", "private", "archived" |

## Integration Examples

### React Component
```jsx
import { useState, useEffect } from 'react';

function ChatList({ deviceId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          `/api/v1/devices/${deviceId}/chats?summary=true&limit=30`,
          {
            headers: { 'x-api-key': 'test-api-key-123' }
          }
        );
        const { data } = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [deviceId]);

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="chat-list">
      {chats.map(chat => (
        <div key={chat.id} className="chat-item">
          <div className="chat-name">
            {chat.name} {chat.isGroup && '(Group)'}
          </div>
          <div className="last-message">{chat.lastMessage.body}</div>
          {chat.unreadCount > 0 && (
            <span className="unread-badge">{chat.unreadCount}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Python Dashboard
```python
import requests
from datetime import datetime

def get_chat_analytics(device_id):
    response = requests.get(
        f'http://localhost:3000/api/v1/devices/{device_id}/chats?summary=true',
        headers={'x-api-key': 'test-api-key-123'}
    )
    
    chats = response.json()['data']
    
    return {
        'total_chats': len(chats),
        'unread_messages': sum(chat['unreadCount'] for chat in chats),
        'active_groups': len([c for c in chats if c['isGroup'] and c['unreadCount'] > 0]),
        'recent_activity': len([
            c for c in chats 
            if c['timestamp'] > (datetime.now().timestamp() - 86400)  # Last 24h
        ])
    }
```

This chat summary feature is perfect for building responsive WhatsApp-like interfaces while keeping API responses fast and lightweight!
