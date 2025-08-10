# Quick Start: Chat Search & Messaging

Get up and running with WhatsApp API in 5 minutes! This guide focuses on finding Chat IDs and sending messages.

## 🚀 Setup (2 minutes)

1. **Start the service**:
   ```bash
   npm run docker:up:api
   # or npm run docker:up:dev (includes frontend)
   ```

2. **Set environment variables**:
   ```bash
   export BASE_URL="http://localhost:3000"
   export API_KEY="test-api-key-123"
   ```

3. **Create a device**:
   ```bash
   curl -X POST "$BASE_URL/api/v1/devices" -H "x-api-key: $API_KEY" | jq
   ```

4. **Get device ID from response and set it**:
   ```bash
   export DEVICE_ID="your-device-id-here"
   ```

5. **Get QR code and scan with WhatsApp**:
   ```bash
   curl "$BASE_URL/api/v1/devices/$DEVICE_ID/qr" -H "x-api-key: $API_KEY" | jq -r '.data.qr'
   ```

## 🔍 Find Chat IDs (The Key Step!)

**WhatsApp uses specific ID formats**, not just phone numbers:
- Individual: `923009401404@c.us` 
- Groups: `923009401404-1234567890@g.us`

### Method 1: Helper Script (Recommended)

```bash
# Make executable once
chmod +x ./find-chat.sh

# Search by name
./find-chat.sh "Mom"
./find-chat.sh "Work Team"

# Search by phone number  
./find-chat.sh "923009401404"
```

**Example Output**:
```
🔍 Searching for chats containing: 'Mom'
---
✅ Found 1 chat(s):

📱 Chat ID: 923009401404@c.us
👤 Name: Mom
🏠 Type: Private
📬 Unread: 2
⏰ Last message: Call me when you're free
```

### Method 2: Search API

```bash
# Quick search
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/search?q=Mom" -H "x-api-key: $API_KEY" | jq

# Search with custom limit
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/search?q=John&limit=5" -H "x-api-key: $API_KEY" | jq '.results[]'
```

### Method 3: List with Filter

```bash
# Find unread chats
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats?filter=unread&summary=true" -H "x-api-key: $API_KEY" | jq '.data[] | {id, name, unread: .unreadCount}'

# Search all chats
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats?search=Mom&summary=true" -H "x-api-key: $API_KEY" | jq '.data[]'
```

## 💬 Send Messages (Once You Have Chat ID)

```bash
# Set the Chat ID from your search results
CHAT_ID="923009401404@c.us"

# Send text message
curl -X POST "$BASE_URL/api/v1/devices/$DEVICE_ID/chats" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$CHAT_ID\",
    \"text\": \"Hello from the API! 👋\"
  }" | jq

# Send location
curl -X POST "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/location" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"$CHAT_ID\",
    \"latitude\": 40.7128,
    \"longitude\": -74.0060,
    \"description\": \"Times Square, NYC\"
  }" | jq
```

## 📋 Essential Commands Cheat Sheet

```bash
# Environment Setup
export BASE_URL="http://localhost:3000"
export API_KEY="test-api-key-123"
export DEVICE_ID="your-device-id"

# 1. Find Chat ID
./find-chat.sh "Contact Name"

# 2. Send Message (use Chat ID from step 1)
curl -X POST "$BASE_URL/api/v1/devices/$DEVICE_ID/chats" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "CHAT_ID_HERE", "text": "Hello!"}' | jq

# 3. Get Chat Details
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/CHAT_ID_HERE" -H "x-api-key: $API_KEY" | jq

# 4. Get Recent Messages
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/CHAT_ID_HERE/messages?limit=10" -H "x-api-key: $API_KEY" | jq

# 5. Search Chats by Different Criteria
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats/search?q=SearchTerm" -H "x-api-key: $API_KEY" | jq
```

## 🎯 Common Use Cases

### Find All Unread Messages
```bash
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats?filter=unread&summary=true" \
  -H "x-api-key: $API_KEY" | \
  jq '.data[] | "\(.name): \(.unreadCount) unread messages (ID: \(.id))"'
```

### Send Message to Multiple Chats
```bash
# Find chats first
./find-chat.sh "John"
./find-chat.sh "Sarah"

# Send to multiple (replace with actual IDs)
for CHAT_ID in "john@c.us" "sarah@c.us"; do
  curl -X POST "$BASE_URL/api/v1/devices/$DEVICE_ID/chats" \
    -H "x-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"to\": \"$CHAT_ID\", \"text\": \"Broadcast message\"}"
done
```

### Find Group Chats
```bash
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/chats?filter=groups&summary=true" \
  -H "x-api-key: $API_KEY" | \
  jq '.data[] | "Group: \(.name) (ID: \(.id))"'
```

## ⚠️ Important Tips

1. **Always use full Chat IDs**: `923009401404@c.us`, never just `923009401404`

2. **Search before messaging**: Always find the correct Chat ID first

3. **URL encode special characters**: 
   ```bash
   CHAT_ID=$(echo "923009401404@c.us" | sed 's/@/%40/g')
   ```

4. **Check device status**: Device must be "ready" to send messages:
   ```bash
   curl "$BASE_URL/api/v1/devices/$DEVICE_ID/status" -H "x-api-key: $API_KEY" | jq '.data.status'
   ```

5. **Use the helper script**: It's the fastest way to find Chat IDs!

## 🚀 Next Steps

- **[Full API Guide](API_GUIDE.md)** - Complete API reference
- **[Chat Management Guide](CHAT_MANAGEMENT.md)** - Detailed chat operations
- **[Architecture Guide](ARCHITECTURE.md)** - System design overview

## 🆘 Troubleshooting

**Device not ready?**
```bash
curl "$BASE_URL/api/v1/devices/$DEVICE_ID/status" -H "x-api-key: $API_KEY" | jq
```

**Can't find chat?**
```bash
# Try different search terms
./find-chat.sh "partial name"
./find-chat.sh "phone number"
```

**Message not sending?**
- Check Chat ID format (`@c.us` ending for individuals)
- Ensure device status is "ready"
- Verify the contact exists in WhatsApp

**You're now ready to use the WhatsApp API efficiently! 🎉**
