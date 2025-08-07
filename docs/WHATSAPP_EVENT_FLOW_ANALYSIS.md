# WhatsApp Web.js Event Flow Analysis & Hook Points

## Overview

This document identifies where `whatsapp-web.js` emits `message`, `message_create`, and `message_ack` events in the wrapper codebase, and documents the payload fields required for privacy-friendly analytics.

## Current Event Hook Points

### 1. Incoming Messages (`message` event)

**Location:** `src/services/DeviceManager.ts` - Line 340-355

```typescript
client.on('message', async (message) => {
    // Current implementation:
    // - Logs message reception (debug level)
    // - Updates device lastSeen timestamp
    // - Emits message via Socket.IO
    // - Tracks message for analytics (full message data)
    
    device.lastSeen = Date.now();
    this.updateDeviceInRedis(device);
    emitMessage(id, message); // Socket.IO emission
    
    // Analytics tracking (currently includes full message body)
    const chat = await message.getChat();
    const analyticsService = new AnalyticsService();
    await analyticsService.trackMessage(id, message, chat);
});
```

**Hook Point for Analytics:** This is the primary entry point for incoming messages. Currently tracks full message data including body content.

### 2. Outbound Messages (`message_create` event)

**Location:** `src/config/whatsapp.ts` - Line 157-166

```typescript
client.on('message_create', async (message) => {
    if (message.fromMe) {
        // Current implementation:
        // - Logs outbound messages (debug level)
        // - Updates client lastActivity
        // - No analytics tracking for outbound messages
        
        clientInstance.lastActivity = new Date();
    }
});
```

**Note:** The main `DeviceManager` class does **NOT** currently handle `message_create` events. This is only implemented in the older `whatsapp.ts` config file which appears to be an alternative implementation.

**Missing Hook Point:** The primary DeviceManager should have a `message_create` handler for comprehensive analytics.

### 3. Message Acknowledgments (`message_ack` event)

**Status:** **NOT CURRENTLY IMPLEMENTED**

The codebase does not currently handle `message_ack` events from whatsapp-web.js. This is a missing feature that should be implemented for complete message lifecycle tracking.

## Available Message Fields (whatsapp-web.js Message Object)

Based on the current analytics implementation in `src/services/AnalyticsService.ts`, the following fields are available:

### Core Message Properties
- `id._serialized` - Unique message identifier
- `from` - Sender identifier 
- `to` - Recipient identifier
- `timestamp` - Message timestamp (seconds, needs *1000 for milliseconds)
- `type` - Message type (`text`, `image`, `audio`, `video`, `document`, etc.)
- `fromMe` - Boolean indicating if message is from the device owner
- `hasMedia` - Boolean indicating media presence
- `isForwarded` - Boolean indicating forwarded message
- `hasQuotedMsg` - Boolean indicating reply to another message
- `mentionedIds` - Array of mentioned user IDs
- `body` - Message text content (**EXCLUDED for privacy**)

### Chat Context
- `chat.id._serialized` - Chat/conversation identifier
- `chat.isGroup` - Boolean indicating group chat
- `chat.name` - Chat display name

## Privacy-Friendly Analytics Fields

The `LightMessageMeta` interface excludes sensitive content while preserving analytical value:

```typescript
interface LightMessageMeta {
  messageId: string;        // message.id._serialized
  chatId: string;          // chat.id._serialized  
  sender: string;          // message.from
  timestamp: number;       // message.timestamp * 1000
  type: string;           // message.type
  meta: {
    fromMe: boolean;       // message.fromMe
    isGroup: boolean;      // chat.isGroup
    hasMedia: boolean;     // message.hasMedia
    isForwarded: boolean;  // message.isForwarded
    isReply: boolean;      // !!message.hasQuotedMsg
    mentionCount: number;  // message.mentionedIds?.length || 0
    deviceId: string;      // device identifier
  };
}
```

## Recommended Implementation Changes

### 1. Add Message Create Handler to DeviceManager

```typescript
// Add to DeviceManager.attachEventListeners()
client.on('message_create', async (message) => {
    if (message.fromMe) {
        logger.debug(`Message sent from device ${this.getDeviceDisplayId(device)}`);
        device.lastSeen = Date.now();
        this.updateDeviceInRedis(device);
        
        // Extract privacy-friendly metadata
        const lightMeta = await this.extractLightMessageMeta(message, id);
        
        // Emit for analytics (privacy-friendly)
        emitMessageCreate(id, lightMeta);
        
        // Track for analytics
        const analyticsService = new AnalyticsService();
        await analyticsService.trackOutboundMessage(id, lightMeta);
    }
});
```

### 2. Add Message Acknowledgment Handler

```typescript
// Add to DeviceManager.attachEventListeners()
client.on('message_ack', async (ack) => {
    logger.debug(`Message acknowledgment for device ${this.getDeviceDisplayId(device)}`);
    
    const ackPayload: MessageAckEventPayload = {
        eventType: 'message_ack',
        messageId: ack.id._serialized,
        chatId: ack.to,
        deviceId: id,
        ackStatus: this.mapAckStatus(ack.ack), // Map numeric ack to string
        timestamp: Date.now(),
        recipient: ack.to
    };
    
    // Emit for analytics
    emitMessageAck(id, ackPayload);
    
    // Track for analytics
    const analyticsService = new AnalyticsService();
    await analyticsService.trackMessageAck(id, ackPayload);
});
```

### 3. Update Socket.IO Event Types

Add new socket events in `src/types/socket.types.ts`:

```typescript
export const SOCKET_EVENTS = {
    // ... existing events
    MESSAGE_CREATE: 'message_create',    // For outbound messages
    MESSAGE_ACK: 'message_ack',         // For acknowledgments
} as const;
```

## Socket.IO Emission Points

### Current Implementation
- **Incoming Messages:** `emitMessage(deviceId, message)` in `src/sockets/device.socket.ts:118-128`
- **Outbound Messages:** **Not implemented**
- **Acknowledgments:** **Not implemented**

### Required Socket Handlers

1. `emitMessageCreate(deviceId: string, lightMeta: LightMessageMeta)`
2. `emitMessageAck(deviceId: string, ackPayload: MessageAckEventPayload)`

## Analytics Integration Points

### Current Analytics Tracking
- **File:** `src/services/AnalyticsService.ts`
- **Method:** `trackMessage(deviceId, message, chat)` - Line 113
- **Issue:** Stores full message content including body

### Required Analytics Methods
1. `trackIncomingMessage(deviceId: string, lightMeta: LightMessageMeta)`
2. `trackOutboundMessage(deviceId: string, lightMeta: LightMessageMeta)` 
3. `trackMessageAck(deviceId: string, ackPayload: MessageAckEventPayload)`

## WhatsApp Web.js Event Reference

According to whatsapp-web.js v1.31.0 documentation, the following events are available:

| Event | Description | Payload |
|-------|-------------|---------|
| `message` | Incoming message received | `Message` object |
| `message_create` | Message created (sent/received) | `Message` object |
| `message_ack` | Message acknowledgment changed | `MessageAck` object |
| `message_edit` | Message edited | `Message` object |
| `message_revoke` | Message revoked/deleted | `Message` object |

## Implementation Priority

1. **High Priority:**
   - Add `message_create` handler to DeviceManager
   - Update privacy-friendly analytics tracking for incoming messages
   - Create `LightMessageMeta` extraction utility

2. **Medium Priority:**
   - Implement `message_ack` handler
   - Add corresponding Socket.IO events
   - Update analytics service methods

3. **Low Priority:**
   - Add `message_edit` and `message_revoke` handlers for comprehensive tracking
   - Implement webhook support for analytics events
