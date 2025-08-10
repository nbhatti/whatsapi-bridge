# Socket.IO Real-time Integration

This document outlines the Socket.IO client integration for real-time updates in the WhatsApp Web.js REST API frontend.

## Overview

The integration provides real-time updates for:
- **Message events**: New messages, status updates
- **Device events**: Connection status, QR codes, authentication
- **Statistics updates**: Real-time metrics and analytics

## Architecture

### Components

1. **`useSocket.ts`** - React hook for Socket.IO connection management
2. **`realtime-store.ts`** - Zustand store for real-time data management
3. **`SocketContext.tsx`** - React context for global socket state
4. **`socket.ts`** - TypeScript types for Socket.IO events
5. **`RealtimeExample.tsx`** - Example component demonstrating usage

### Data Flow

```
Socket.IO Server → useSocket Hook → Zustand Store → React Components
```

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 2. Provider Setup

Wrap your app with the `SocketProvider`:

```tsx
// src/app/layout.tsx
import { SocketProvider } from '../contexts/SocketContext'
import { AuthProvider } from '../contexts/auth-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SocketProvider autoConnect={true}>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 3. Using in Components

```tsx
// Example component usage
import { useSocketContext } from '../contexts/SocketContext'
import { useMessages, useDevices, useStats } from '../stores/realtime-store'

function MyComponent() {
  const { isConnected, emit } = useSocketContext()
  const messages = useMessages()
  const devices = useDevices()
  const stats = useStats()

  // Send a message
  const sendMessage = () => {
    emit('message:send', {
      deviceId: 'device_id',
      to: '1234567890',
      message: 'Hello World!',
      type: 'text'
    })
  }

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Messages: {messages.length}</p>
      <p>Active Devices: {devices.filter(d => d.status === 'connected').length}</p>
    </div>
  )
}
```

## Socket Events

### Server to Client Events

- `message:new` - New message received
- `message:update` - Message status update
- `device:update` - Device status change
- `device:connected` - Device connected
- `device:disconnected` - Device disconnected
- `device:qr` - QR code for authentication
- `stats:update` - Statistics update
- `stats:realtime` - Real-time metrics

### Client to Server Events

- `message:send` - Send a message
- `message:markRead` - Mark message as read
- `device:subscribe` - Subscribe to device updates
- `device:unsubscribe` - Unsubscribe from device updates
- `stats:subscribe` - Subscribe to statistics
- `stats:unsubscribe` - Unsubscribe from statistics

## Authentication

The socket connection uses query parameters for authentication:

```typescript
const socket = io('http://localhost:3000', {
  query: {
    'API-key': process.env.NEXT_PUBLIC_API_KEY,
    'access-token': user.id
  }
})
```

## Store Structure

### Messages
- `messages: Message[]` - Array of messages
- `addMessage(message)` - Add or update message
- `updateMessage(id, updates)` - Update specific message
- `removeMessage(id)` - Remove message
- `clearMessages()` - Clear all messages

### Devices
- `devices: Device[]` - Array of devices
- `updateDevice(device)` - Add or update device
- `removeDevice(id)` - Remove device
- `clearDevices()` - Clear all devices

### Statistics
- `stats: Stats | null` - Current statistics
- `updateStats(stats)` - Update statistics
- `clearStats()` - Clear statistics

## Selectors

Use provided selectors for optimized performance:

```typescript
// Get specific data
const messages = useMessages()
const devices = useDevices() 
const activeDevices = useActiveDevices()
const stats = useStats()

// Get filtered data
const deviceMessages = useMessagesByDevice('device_id')
const device = useDeviceById('device_id')
const recentMessages = useRecentMessages(50)
```

## Error Handling

The integration includes comprehensive error handling:

```typescript
const { isConnected, connectionStatus } = useSocketContext()

// Connection statuses: 'connecting' | 'connected' | 'disconnected' | 'error'
if (connectionStatus === 'error') {
  // Handle connection error
}
```

## Performance Considerations

1. **Message Limit**: Store keeps only last 1000 messages for performance
2. **Selective Subscriptions**: Subscribe only to needed device/stat updates
3. **Optimized Selectors**: Use specific selectors to minimize re-renders
4. **Connection Management**: Automatic cleanup on component unmount

## Development

### Testing Real-time Events

Use the `RealtimeExample` component to test the integration:

```tsx
import RealtimeExample from '../components/RealtimeExample'

function TestPage() {
  return <RealtimeExample />
}
```

### Debugging

Enable Socket.IO debug logs:

```javascript
// In browser console
localStorage.debug = 'socket.io-client:socket'
```

## Type Safety

All Socket.IO events are fully typed:

```typescript
import { ServerToClientEvents, ClientToServerEvents } from '../types/socket'

// Type-safe event emission
emit('message:send', {
  deviceId: string,
  to: string,
  message: string,
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
})
```

## Next Steps

1. Integrate with your existing UI components
2. Add error boundaries for connection failures
3. Implement offline/online status handling
4. Add notification system for new messages
5. Create admin dashboard with real-time stats

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if Socket.IO server is running on port 3000
   - Verify API key and access token are correct
   - Check CORS settings on server

2. **Events Not Received**
   - Ensure proper authentication
   - Check if subscribed to correct events
   - Verify user permissions

3. **Performance Issues**
   - Use selective selectors
   - Implement message pagination
   - Limit real-time updates frequency

### Debug Commands

```bash
# Check socket connection
curl -X GET http://localhost:3000/socket.io/?transport=polling

# Test WebSocket connection
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```
