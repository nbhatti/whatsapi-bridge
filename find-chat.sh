#!/bin/bash

# WhatsApp Chat Finder Script
# Usage: ./find-chat.sh "Wife" or ./find-chat.sh "923009401404"

if [ -z "$1" ]; then
    echo "Usage: $0 <search_term>"
    echo "Example: $0 \"Wife\""
    echo "Example: $0 \"923009401404\""
    exit 1
fi

BASE_URL="http://localhost:3000"
API_KEY="test-api-key-123"
DEVICE_ID="d7172497-d027-4b66-816b-d2dae38b3740"
SEARCH_TERM="$1"

echo "🔍 Searching for chats containing: '$SEARCH_TERM'"
echo "---"

# Get chat list with search
RESPONSE=$(curl -sS -X GET "${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats?search=${SEARCH_TERM}&limit=10" \
    -H "x-api-key: ${API_KEY}")

# Check if successful
if echo "$RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
    CHAT_COUNT=$(echo "$RESPONSE" | jq -r '.returned // 0')
    
    if [ "$CHAT_COUNT" -eq 0 ]; then
        echo "❌ No chats found matching '$SEARCH_TERM'"
        exit 1
    fi
    
    echo "✅ Found $CHAT_COUNT chat(s):"
    echo
    
    # Display results in a nice format
    echo "$RESPONSE" | jq -r '
        .data[] | 
        "📱 Chat ID: \(.id // "N/A")
👤 Name: \(.name // "Unknown")
🏠 Type: \(if .isGroup then "Group" else "Private" end)
📬 Unread: \(.unreadCount // 0)
⏰ Last message: \(.lastMessage.body // "No recent message")
---"
    '
    
    # If there's exactly one result, show a quick command to get details
    if [ "$CHAT_COUNT" -eq 1 ]; then
        CHAT_ID=$(echo "$RESPONSE" | jq -r '.data[0].id // empty')
        if [ -n "$CHAT_ID" ]; then
            echo "💡 Quick command to get full chat details:"
            echo "curl -sS \"${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats/${CHAT_ID}\" -H \"x-api-key: ${API_KEY}\" | jq"
        fi
    fi
    
else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
    echo "❌ Error: $ERROR"
    exit 1
fi
