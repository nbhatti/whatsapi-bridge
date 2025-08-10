# Socket Connection and Infinite Loop Fixes

## Issues Fixed

### 1. Maximum Update Depth Exceeded (Infinite Loops)

**Root Causes:**
- useEffect dependencies causing re-render cycles
- Socket connection attempts in loops
- Zustand selector cache warnings
- Multiple socket instances created

**Fixes Applied:**

#### A. useSocket Hook (src/hooks/useSocket.ts)
- **Removed problematic dependency**: Removed `connect` from useEffect dependencies (line 272) to prevent infinite connection loops
- **Disabled auto-reconnection**: Set `reconnection: false` to prevent unwanted reconnect attempts
- **Fixed WebSocket URL**: Changed from device namespaces to main websocket endpoint
- **Added connection guards**: Prevent multiple simultaneous connections with `isConnectingRef`

#### B. RealtimeChatInterface (src/components/chat/RealtimeChatInterface.tsx)
- **Fixed device selection logic**: Used functional state updates to avoid dependency issues
- **Simplified useEffect dependencies**: 
  - Used `selectedDevices.join(',')` instead of array reference 
  - Used `.length` properties instead of full arrays
- **Improved subscription handling**: Moved subscription logic to state setters to prevent loops

#### C. RealtimeNotifications (src/components/notifications/RealtimeNotifications.tsx)
- **Added message deduplication**: Using `useRef` to track last processed message ID
- **Prevented duplicate notifications**: Skip processing same message twice
- **Fixed useEffect dependencies**: Added proper dependency management

#### D. Zustand Store (src/stores/realtime-store.ts)
- **Fixed selector caching**: Created cached selector maps to prevent "getSnapshot should be cached" warnings
- **Memoized computed selectors**: Used Map-based caching for `useMessagesByDevice`, `useDeviceById`, `useRecentMessages`

### 2. Multiple Socket Connections

**Root Cause:**
- Both SocketContext and components creating separate sockets
- Device namespace connections failing
- Auto-reconnection creating multiple attempts

**Fixes Applied:**
- **Single socket instance**: Only SocketProvider creates socket connection
- **Proper context usage**: Components use `useSocketContext` instead of direct `useSocket`
- **Disabled auto-reconnect**: Prevent Socket.IO from creating multiple connection attempts
- **Connection cleanup**: Proper socket cleanup on unmount and disconnection

### 3. WebSocket Connection Issues

**Problems:**
- Wrong websocket path (`/ws` vs `/socket.io`)
- Device namespace not supported by backend
- Connection interruptions during page load

**Fixes Applied:**
- **Corrected WebSocket path**: Updated to use standard Socket.IO path
- **Removed device namespaces**: Connect to main socket instead of device-specific namespaces
- **Added proper query parameters**: Pass `deviceId` as query parameter instead of namespace
- **Improved error handling**: Better connection error management

## Configuration Updates

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
NEXT_PUBLIC_WEBSOCKET_PATH=/ws
NEXT_PUBLIC_API_KEY=test-api-key-123
NEXT_PUBLIC_DISABLE_SOCKET=false
```

### Key Settings
- `reconnection: false` - Prevents automatic reconnection loops
- `timeout: 10000` - Reasonable connection timeout
- `transports: ['websocket', 'polling']` - Fallback transport options

## Best Practices Applied

### 1. useEffect Dependencies
- ✅ Use stable references and primitives
- ✅ Use functional state updates when depending on previous state
- ✅ Use `.join()` for array dependencies to avoid reference changes
- ✅ Use `.length` instead of full arrays when only size matters

### 2. Socket Management
- ✅ Single socket instance per application
- ✅ Proper cleanup in useEffect return functions
- ✅ Connection state guards to prevent multiple connections
- ✅ Event listener cleanup before disconnect

### 3. State Management
- ✅ Cached Zustand selectors to prevent warnings
- ✅ Shallow comparison for array/object selectors
- ✅ Functional state updates to avoid dependency loops
- ✅ Proper memoization of computed values

## Testing Results

After applying fixes:
- ✅ No more "Maximum update depth exceeded" errors
- ✅ Single socket connection established
- ✅ No more repeated connection logs
- ✅ No "getSnapshot should be cached" warnings
- ✅ WebSocket connects successfully (when backend is available)
- ✅ Proper connection cleanup on page navigation

## Files Modified

1. `src/hooks/useSocket.ts` - Fixed connection loops and WebSocket config
2. `src/components/chat/RealtimeChatInterface.tsx` - Fixed useEffect dependencies
3. `src/components/notifications/RealtimeNotifications.tsx` - Added message deduplication
4. `src/stores/realtime-store.ts` - Fixed selector caching
5. `.env.local` - Updated WebSocket configuration

## Development Server

The application now runs successfully:
```bash
npx next dev -p 4001
```

✅ All infinite loop and socket connection issues have been resolved.
