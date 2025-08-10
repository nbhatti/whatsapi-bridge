# Message Pagination Guide

## 🔄 Enhanced Message Fetching with Pagination

The message fetching functionality has been significantly improved to provide proper pagination support using cursor-based navigation.

## 🚀 Quick Start

### Basic Usage

```bash
# Fetch recent messages (default: 20)
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages" -H "x-api-key: $API_KEY"

# Fetch specific number of messages
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=50" -H "x-api-key: $API_KEY"
```

### Pagination Navigation

```bash
# Get older messages (use 'before' parameter)
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=20&before=MESSAGE_ID" -H "x-api-key: $API_KEY"

# Get newer messages (use 'after' parameter) 
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=20&after=MESSAGE_ID" -H "x-api-key: $API_KEY"
```

## 📋 Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of messages to return (1-100) |
| `before` | string | - | Get messages before this message ID (older messages) |
| `after` | string | - | Get messages after this message ID (newer messages) |

**⚠️ Note**: `offset` parameter is **not supported** due to WhatsApp Web.js limitations.

## 📊 Response Format

The API returns enhanced pagination information:

```json
{
  "success": true,
  "data": [
    {
      "id": {
        "_serialized": "false_923009401404@c.us_MESSAGE_ID_HERE",
        "fromMe": false,
        "remote": "923009401404@c.us",
        "id": "MESSAGE_ID_HERE"
      },
      "body": "Hello there!",
      "type": "chat",
      "timestamp": 1754750700,
      "from": "923009401404@c.us",
      "to": "923008449347:79@c.us",
      "deviceType": "android",
      "isForwarded": false,
      "fromMe": false,
      "hasMedia": false
    }
  ],
  "pagination": {
    "total": 45,
    "returned": 20,
    "requestedLimit": 20,
    "hasMore": true,
    "referenceFound": true,
    "referenceType": null,
    "referenceId": null,
    "cursors": {
      "newer": {
        "after": "false_923009401404@c.us_FIRST_MESSAGE_ID",
        "url": "/api/v1/devices/device123/chats/923009401404@c.us/messages?limit=20&after=false_923009401404@c.us_FIRST_MESSAGE_ID"
      },
      "older": {
        "before": "false_923009401404@c.us_LAST_MESSAGE_ID",
        "url": "/api/v1/devices/device123/chats/923009401404@c.us/messages?limit=20&before=false_923009401404@c.us_LAST_MESSAGE_ID"
      }
    }
  }
}
```

## 🎯 Pagination Fields Explained

### Core Pagination Info
- **`total`**: Total messages in the filtered result set
- **`returned`**: Number of messages actually returned
- **`requestedLimit`**: The limit you requested  
- **`hasMore`**: Whether more messages are available

### Reference Tracking
- **`referenceFound`**: Whether the reference message was found (for `before`/`after` queries)
- **`referenceType`**: Type of reference used (`"before"`, `"after"`, or `null`)
- **`referenceId`**: The message ID used as reference

### Navigation Cursors
- **`cursors.newer`**: Use this to get newer messages (more recent)
- **`cursors.older`**: Use this to get older messages (further back in time)
- Each cursor provides both the message ID and a ready-to-use URL

## 🔍 Usage Examples

### 1. Basic Message Browsing

```bash
# Step 1: Get recent messages
RESPONSE=$(curl -s "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=10" -H "x-api-key: $API_KEY")

# Step 2: Extract older cursor for pagination
OLDER_URL=$(echo "$RESPONSE" | jq -r '.pagination.cursors.older.url // empty')

# Step 3: Get older messages if available
if [ -n "$OLDER_URL" ]; then
  curl -s "$BASE_URL$OLDER_URL" -H "x-api-key: $API_KEY"
fi
```

### 2. Walking Through Message History

```bash
#!/bin/bash
# Script to walk through all messages in a chat

get_messages() {
  local before_param="$1"
  local url="$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=20"
  
  if [ -n "$before_param" ]; then
    url="${url}&before=${before_param}"
  fi
  
  curl -s "$url" -H "x-api-key: $API_KEY"
}

# Start with most recent messages
RESPONSE=$(get_messages)
echo "$(echo "$RESPONSE" | jq '.data | length') messages retrieved"

# Continue until no more messages
while true; do
  OLDER_CURSOR=$(echo "$RESPONSE" | jq -r '.pagination.cursors.older.before // empty')
  HAS_MORE=$(echo "$RESPONSE" | jq -r '.pagination.hasMore')
  
  if [ "$HAS_MORE" != "true" ] || [ -z "$OLDER_CURSOR" ]; then
    echo "Reached end of messages"
    break
  fi
  
  RESPONSE=$(get_messages "$OLDER_CURSOR")
  COUNT=$(echo "$RESPONSE" | jq '.data | length')
  echo "$COUNT more messages retrieved"
  
  # Process messages here
  echo "$RESPONSE" | jq '.data[] | {timestamp: .timestamp, body: .body, from: .from}'
done
```

### 3. Real-time Message Updates

```bash
# Get the latest message ID for future polling
LATEST_RESPONSE=$(curl -s "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=1" -H "x-api-key: $API_KEY")
LATEST_MESSAGE_ID=$(echo "$LATEST_RESPONSE" | jq -r '.data[0].id._serialized')

# Later, check for new messages
NEW_MESSAGES=$(curl -s "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=50&after=$LATEST_MESSAGE_ID" -H "x-api-key: $API_KEY")
NEW_COUNT=$(echo "$NEW_MESSAGES" | jq '.pagination.returned')

if [ "$NEW_COUNT" -gt 0 ]; then
  echo "Found $NEW_COUNT new messages!"
  echo "$NEW_MESSAGES" | jq '.data[]'
fi
```

## ⚠️ Important Limitations

### WhatsApp Web.js Constraints

The underlying WhatsApp Web.js library has these limitations:

1. **No native `before`/`after` support**: We simulate this by fetching more messages and filtering
2. **No `offset` parameter**: Traditional offset-based pagination is not supported
3. **Fetch limit**: We fetch up to 3x your requested limit (max 300) to enable filtering
4. **Memory usage**: Large message fetches may consume more memory

### Performance Considerations

1. **Smart fetch sizing**: When using `before`/`after`, we fetch 3x the requested limit for filtering
2. **Maximum fetch limit**: We cap at 300 messages per request to prevent memory issues
3. **Reference message search**: If the reference message isn't in the fetch window, you'll get an empty result

## 🛠️ Troubleshooting

### "Reference message not found"

If you get an empty result with `referenceFound: false`:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "returned": 0,
    "hasMore": false,
    "referenceFound": false,
    "referenceType": "before",
    "referenceId": "your_message_id"
  }
}
```

**Solutions:**
1. **Check message ID format**: Ensure it's the full `_serialized` ID (e.g., `false_923009401404@c.us_MESSAGE_ID`)
2. **Message may be too old**: The message might be outside our fetch window
3. **Use smaller steps**: Paginate with smaller limits to stay within the fetch window

### Getting the correct Message ID

```bash
# Get message ID from any message response
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/$CHAT_ID/messages?limit=1" -H "x-api-key: $API_KEY" | \
jq -r '.data[0].id._serialized'

# Example output: false_923009401404@c.us_3EB0123456789ABCDEF
```

### Performance Tips

1. **Use reasonable limits**: Don't request more than you need
2. **Cache results**: Store pagination cursors to avoid redundant requests
3. **Monitor `hasMore`**: Check this flag to know when you've reached the end
4. **Use the provided URLs**: The cursor URLs are pre-formatted and ready to use

## 🎯 Best Practices

1. **Always check `pagination.hasMore`** before trying to fetch more messages
2. **Use the provided cursor URLs** - they're pre-formatted and include proper encoding
3. **Handle empty results gracefully** when `referenceFound: false`
4. **Store cursors for session continuity** if building a chat interface
5. **Implement exponential backoff** for rapid successive requests

## 📚 Related Documentation

- [Chat Management Guide](CHAT_MANAGEMENT.md) - Finding Chat IDs
- [API Guide](API_GUIDE.md) - Complete API reference
- [Quick Start](QUICKSTART_CHAT_SEARCH.md) - Get started quickly

---

**The enhanced pagination system provides efficient navigation through chat history while working within WhatsApp Web.js limitations! 🚀**
