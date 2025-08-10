# WebSocket Gateway Documentation

This document describes the WebSocket (Socket.io) gateway implementation that provides real-time communication for WhatsApp device management.

## Overview

The WebSocket gateway is implemented using Socket.io and provides:
- Real-time device events (QR codes, authentication status, messages, etc.)
- Device-specific namespaces (`/device/:deviceId`)
- API key authentication for WebSocket connections
- Events for: `qr`, `ready`, `authenticated`, `message`, `state`, `disconnected`

## Connection

### Endpoint
The WebSocket server is available at `/ws` path on the same HTTP server.

### Authentication
All WebSocket connections require API key authentication via query parameter. The API key must match the one configured in your `.env` file:

```bash
# In your .env file
API_KEY=your-super-secure-api-key-change-this-immediately
```

Then use it in the connection:
```
?apiKey=your-super-secure-api-key-change-this-immediately
```

⚠️ **Security Note**: Never expose your API key in client-side code in production. Consider using a backend proxy for WebSocket connections in production environments.

### Device Namespace
Each device has its own namespace following the pattern `/device/:deviceId` where `deviceId` is a UUID generated when creating a WhatsApp device session:

```
# Real device ID examples (UUIDs)
/device/a1b2c3d4-e5f6-7890-abcd-ef1234567890
/device/device-123e4567-e89b-12d3-a456-426614174000
/device/my-whatsapp-session-uuid-here
```

**Device ID Format**: Device IDs are typically UUIDs (v4) but can be any alphanumeric string you specify when creating a device via the REST API.

## Client Connection Example

### JavaScript (Socket.io Client)
```javascript
import { io } from 'socket.io-client';

const deviceId = 'your-device-id-here';
const apiKey = 'your-api-key-here';

const socket = io(`http://localhost:3000/device/${deviceId}`, {
  path: '/ws',
  query: {
    apiKey: apiKey
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to device namespace:', socket.id);
});

// Listen for device events
socket.on('qr', (data) => {
  console.log('QR Code received:', data);
  // data: { deviceId, qr, timestamp }
});

socket.on('ready', (data) => {
  console.log('Device ready:', data);
  // data: { deviceId, phoneNumber?, timestamp }
});

socket.on('authenticated', (data) => {
  console.log('Device authenticated:', data);
  // data: { deviceId, phoneNumber, clientName, timestamp }
});

socket.on('message', (data) => {
  console.log('Message received:', data);
  // data: { deviceId, message, timestamp }
});

socket.on('state', (data) => {
  console.log('Device state changed:', data);
  // data: { deviceId, status, timestamp }
});

socket.on('disconnected', (data) => {
  console.log('Device disconnected:', data);
  // data: { deviceId, reason, timestamp }
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

### Python (socketio client)
```python
import socketio

device_id = 'your-device-id-here'
api_key = 'your-api-key-here'

sio = socketio.Client()

@sio.event
def connect():
    print('Connected to device namespace')

@sio.event
def qr(data):
    print('QR Code received:', data)

@sio.event
def ready(data):
    print('Device ready:', data)

@sio.event
def authenticated(data):
    print('Device authenticated:', data)

@sio.event
def message(data):
    print('Message received:', data)

@sio.event
def state(data):
    print('Device state changed:', data)

@sio.event
def disconnected(data):
    print('Device disconnected:', data)

# Connect to device namespace
sio.connect(
    f'http://localhost:3000/device/{device_id}',
    socketio_path='/ws',
    headers={'apiKey': api_key}
)

# Keep connection alive
sio.wait()
```

## Events

### Server-to-Client Events

#### `qr`
Emitted when a QR code is generated for device authentication.
```typescript
interface DeviceQRPayload {
  deviceId: string;
  qr: string; // QR code string
  timestamp: number;
}
```

#### `ready`
Emitted when the device is ready and authenticated.
```typescript
interface DeviceReadyPayload {
  deviceId: string;
  phoneNumber?: string;
  timestamp: number;
}
```

#### `authenticated`
Emitted when the device is successfully authenticated.
```typescript
interface DeviceAuthenticatedPayload {
  deviceId: string;
  phoneNumber: string;
  clientName: string;
  timestamp: number;
}
```

#### `message`
Emitted when a message is received by the device.
```typescript
interface MessageReceivedPayload {
  deviceId: string;
  message: any; // WhatsApp message object
  timestamp: number;
}
```

#### `state`
Emitted when the device state changes.
```typescript
interface DeviceStatePayload {
  deviceId: string;
  status: string;
  timestamp: number;
}
```

#### `disconnected`
Emitted when the device is disconnected.
```typescript
interface DeviceDisconnectedPayload {
  deviceId: string;
  reason: string;
  timestamp: number;
}
```

## Error Handling

### Authentication Errors
If the API key is missing or invalid, the connection will be rejected with an error:
- `"API key is required"`
- `"Invalid API key"`
- `"Server configuration error"`

### Connection Errors
- Invalid device namespace will result in connection failure
- Server errors will be logged and the connection will be terminated

## Usage Workflow

1. **Create a Device**: Use the REST API to create a new device
   ```bash
   POST /api/v1/devices
   ```

2. **Connect to WebSocket**: Connect to the device's namespace using Socket.io
   ```javascript
   const socket = io(`http://localhost:3000/device/${deviceId}`, {
     path: '/ws',
     query: { apiKey: 'your-api-key' }
   });
   ```

3. **Listen for QR Code**: Wait for the `qr` event and display the QR code
   ```javascript
   socket.on('qr', (data) => {
     displayQRCode(data.qr);
   });
   ```

4. **Handle Authentication**: Listen for `authenticated` and `ready` events
   ```javascript
   socket.on('authenticated', (data) => {
     console.log('Authenticated as:', data.phoneNumber);
   });
   
   socket.on('ready', (data) => {
     console.log('Device is ready to use');
   });
   ```

5. **Receive Messages**: Listen for incoming messages
   ```javascript
   socket.on('message', (data) => {
     handleIncomingMessage(data.message);
   });
   ```

## Security Notes

- Always use HTTPS in production
- Keep your API key secure and never expose it in client-side code
- Consider implementing additional authentication layers for production use
- The WebSocket connection inherits CORS settings from the main server configuration

## Testing & Troubleshooting

### Connection Testing

1. **Test Socket.IO Endpoint**:
   ```bash
   curl -s http://localhost:3000/ws/socket.io/
   # Expected response: {"code":0,"message":"Transport unknown"}
   ```

2. **Test with Real API Key**:
   ```bash
   # Check your current API key
   grep API_KEY .env
   ```

3. **Basic Connection Test** (Node.js):
   ```javascript
   const { io } = require('socket.io-client');
   
   const socket = io('http://localhost:3000/device/test-device-123', {
     path: '/ws',
     query: { apiKey: process.env.API_KEY || 'your-api-key' }
   });
   
   socket.on('connect', () => console.log('Connected!'));
   socket.on('connect_error', (err) => console.error('Failed:', err.message));
   ```

### Common Issues

#### Connection Refused
- **Problem**: `ECONNREFUSED` or connection timeout
- **Solution**: Ensure the server is running on the correct port (default: 3000)

#### Authentication Failed
- **Problem**: `Invalid API key` error
- **Solution**: 
  1. Check your `.env` file contains `API_KEY=your-actual-key`
  2. Ensure the key matches exactly (no extra spaces)
  3. Restart the server after changing the API key

#### Transport Unknown
- **Problem**: Server responds with "Transport unknown"
- **Solution**: This is normal for direct HTTP requests. Use a Socket.IO client instead.

#### Device Namespace Not Found
- **Problem**: Cannot connect to device namespace
- **Solution**: Ensure the device exists by creating it via REST API first:
  ```bash
  curl -X POST -H "X-API-KEY: your-api-key" \
       -H "Content-Type: application/json" \
       -d '{"name":"My Device","id":"test-device-123"}' \
       http://localhost:3000/api/devices
  ```

### Environment Configuration

Ensure your `.env` file has the correct WebSocket settings:

```bash
# Socket.IO Configuration
CORS_ORIGIN=http://localhost:3000
SOCKET_IO_CORS_ORIGIN=http://localhost:3000

# Security
API_KEY=your-super-secure-api-key-change-this-immediately

# Server
PORT=3000
NODE_ENV=development
```

### Debug Mode

Enable debug logging for Socket.IO:

```bash
# Server-side debugging
DEBUG=socket.io:* npm start

# Client-side debugging (browser)
localStorage.debug = 'socket.io-client:*';
```

## Scaling

The WebSocket gateway supports Redis adapter for horizontal scaling across multiple server instances. This is automatically enabled in production mode when Redis is configured.

### Redis Configuration for Scaling

```bash
# Enable Redis adapter in production
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

### Load Balancing

When using multiple server instances behind a load balancer, ensure:
- Sticky sessions are enabled (same client always connects to same server)
- OR Redis adapter is configured for cross-server communication

## Performance Considerations

- **Connection Limits**: Default limit is ~1000 concurrent connections per server instance
- **Message Rate**: Device-specific rate limiting applies (10 messages/minute by default)
- **Memory Usage**: Each connection uses ~2-5MB of memory
- **Redis Scaling**: Use Redis for production setups with multiple server instances
