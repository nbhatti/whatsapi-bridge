# TypeScript Types Directory

This directory contains all TypeScript type definitions and interfaces for the WhatsApp Web API wrapper application.

## File Structure

```
src/types/
├── index.ts           # Main export file for all types
├── api.types.ts       # API request/response types
├── device.types.ts    # Device management types
├── message.types.ts   # Message handling types
├── session.types.ts   # Session & Redis storage types
├── socket.types.ts    # Socket.IO event types
├── common.types.ts    # Common/shared types
└── README.md         # This documentation file
```

## Type Categories

### 1. API Types (`api.types.ts`)
- **ApiResponse<T>**: Generic API response wrapper
- **SendMessageDto**: Request body for sending messages
- **JoinGroupDto**: Request body for joining groups
- **Response types**: Typed responses for various API endpoints

### 2. Device Types (`device.types.ts`)
- **Device**: Core device interface with WhatsApp client
- **DeviceStatus**: Enumeration of possible device states
- **DeviceConfig**: Configuration options for device creation
- **DeviceEvent**: Event data structure for device events
- **DeviceStats**: Device statistics and metrics

### 3. Message Types (`message.types.ts`)
- **Message**: Core message interface abstracted from whatsapp-web.js
- **MessageType**: Enumeration of message types (text, media, etc.)
- **SendMessageOptions**: Options for message sending
- **MessageAckEvent**: Message acknowledgment events

### 4. Session Types (`session.types.ts`)
- **SessionData**: Redis-stored session information
- **SessionInfo**: API-friendly session information
- **RedisSessionCredentials**: Authentication data for Redis storage

### 5. Socket Types (`socket.types.ts`)
- **SOCKET_EVENTS**: Constants for all socket event names
- **ServerToClientEvents**: Type-safe server-to-client event interface
- **ClientToServerEvents**: Type-safe client-to-server event interface
- **Various payload interfaces**: Typed payloads for each socket event

### 6. Common Types (`common.types.ts`)
- **PaginatedResponse<T>**: Generic pagination wrapper
- **KeyValuePair**: Flexible key-value object type
- **AppError**: Standardized error structure
- **Environment**: Application environment enumeration

## Usage Examples

### Importing Types
```typescript
// Import specific types
import { Device, DeviceStatus } from '../types/device.types';
import { SendMessageDto, ApiResponse } from '../types/api.types';

// Import all types from main export
import { Device, SendMessageDto, SOCKET_EVENTS } from '../types';
```

### Using API Types
```typescript
// API endpoint with typed response
app.post('/api/messages', async (req: Request, res: Response) => {
  const messageDto: SendMessageDto = req.body;
  
  const response: ApiResponse<Message> = {
    success: true,
    data: await sendMessage(messageDto)
  };
  
  res.json(response);
});
```

### Using Socket Types
```typescript
// Type-safe socket event emission
import { SOCKET_EVENTS, DeviceStatusPayload } from '../types';

const payload: DeviceStatusPayload = {
  deviceId: 'device-123',
  status: 'ready',
  timestamp: Date.now()
};

io.emit(SOCKET_EVENTS.DEVICE_STATUS, payload);
```

### Using Device Types
```typescript
// Device management with proper typing
import { Device, DeviceConfig, DeviceStatus } from '../types';

class DeviceManager {
  async createDevice(config: DeviceConfig): Promise<Device> {
    // Implementation with full type safety
  }
}
```

## Type Safety Benefits

1. **Compile-time checks**: Catch type errors before runtime
2. **IDE support**: Better autocomplete and IntelliSense
3. **Refactoring safety**: Changes propagate through the codebase
4. **Documentation**: Types serve as living documentation
5. **API consistency**: Ensures consistent data structures across the application

## Extending Types

When adding new features:

1. Add new types to the appropriate file
2. Export them from the main `index.ts`
3. Update this README if adding new categories
4. Use generic types where appropriate to maintain flexibility

## Best Practices

1. Use specific types over `any`
2. Prefer interfaces for object shapes
3. Use enums for fixed sets of values
4. Include optional properties where appropriate
5. Add JSDoc comments for complex types
6. Keep types focused and cohesive within each file
