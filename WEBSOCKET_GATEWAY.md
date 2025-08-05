# WebSocket Gateway Documentation

This document describes the WebSocket (Socket.io) gateway implementation that provides real-time communication for WhatsApp device management.

## Overview

The WebSocket gateway is implemented using Socket.io and provides:
- Real-time device events (QR codes, authentication status, messages, etc.)
- Device-specific namespaces (`/device/:id`)
- API key authentication for WebSocket connections
- Events for: `qr`, `ready`, `authenticated`, `message`, `state`, `disconnected`

## Connection

### Endpoint
The WebSocket server is available at `/ws` path on the same HTTP server.

### Authentication
All WebSocket connections require API key authentication via query parameter:
```
?apiKey=your-api-key-here
```

### Device Namespace
Each device has its own namespace following the pattern `/device/:deviceId`:
```
/device/12345678-1234-1234-1234-123456789abc
```

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

## Scaling

The WebSocket gateway supports Redis adapter for horizontal scaling across multiple server instances. This is automatically enabled in production mode when Redis is configured.
