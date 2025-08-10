# 🛠️ Real-time WebSocket Troubleshooting Guide

## Issues Fixed

### ✅ **Issue 1: Socket.IO Disabled**
**Error:** `Socket.IO disabled via NEXT_PUBLIC_DISABLE_SOCKET environment variable`

**Cause:** The environment variable `NEXT_PUBLIC_DISABLE_SOCKET` was set to `true`.

**Fix:** Updated `.env.local`:
```env
NEXT_PUBLIC_DISABLE_SOCKET=false
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-super-secure-api-key-change-this-immediately
```

---

### ✅ **Issue 2: React Infinite Loop**
**Error:** `Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate`

**Cause:** Infinite loop in `RealtimeNotifications` component due to `addNotification` being included in useEffect dependencies.

**Fix:** Simplified useEffect dependencies:
```typescript
// Before (causing infinite loop):
useEffect(() => {
  // ... notification logic
}, [messages, isConnected, addNotification]);

// After (fixed):
useEffect(() => {
  // ... notification logic  
}, [messages.length, isConnected]); // Simplified dependencies
```

---

### ✅ **Issue 3: Notification Permission**
**Error:** `The Notification permission may only be requested from inside a short running user-generated event handler`

**Cause:** Trying to request notification permission during component mount instead of on user interaction.

**Fix:** Request permission on user click:
```typescript
const handleToggleNotifications = async () => {
  if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
    }
  } else {
    setNotificationsEnabled(!notificationsEnabled);
  }
};
```

---

## Environment Configuration

### Required Environment Variables

Create or update your `.env.local` file:

```env
# WebSocket Configuration
NEXT_PUBLIC_DISABLE_SOCKET=false
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
NEXT_PUBLIC_WEBSOCKET_PATH=/ws
NEXT_PUBLIC_API_KEY=your-super-secure-api-key-change-this-immediately

# Real-time Features
NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_NOTIFICATION_SOUNDS=true
NEXT_PUBLIC_DEBUG_WEBSOCKET=true
```

## Testing WebSocket Connection

### 1. Test Backend Connection

```bash
node websocket-test.js
```

Expected output:
```
🔌 Testing WebSocket connection...
✅ WebSocket connected successfully! <socket-id>
🔌 WebSocket disconnected: client disconnect
```

### 2. Test Frontend Connection

1. Open browser to `http://localhost:4000/chat`
2. Open browser console (F12)
3. Look for WebSocket connection logs:
   ```
   🔌 Connecting to WebSocket for device: <device-id>
   ✅ Socket connected: <socket-id>
   ```

## Common Issues & Solutions

### ❌ **"WebSocket connection failed"**

**Possible Causes:**
1. Backend server not running on port 3000
2. Wrong API key
3. Firewall blocking connection

**Solutions:**
```bash
# Check if backend is running
curl http://localhost:3000/docs-json

# Check WebSocket endpoint
curl http://localhost:3000/ws

# Verify API key matches between frontend and backend
```

---

### ❌ **"Component keeps re-rendering"**

**Possible Causes:**
1. Missing useCallback wrappers
2. Incorrect useEffect dependencies
3. Object/array dependencies changing reference

**Solutions:**
```typescript
// Wrap callbacks with useCallback
const handleSomething = useCallback(() => {
  // logic here
}, [dependency1, dependency2]);

// Use primitive values in dependencies instead of objects/arrays
useEffect(() => {
  // logic
}, [array.length, object.id]); // Instead of [array, object]
```

---

### ❌ **"Notifications not working"**

**Possible Causes:**
1. Permission not granted
2. HTTPS required (in production)
3. Browser notifications disabled

**Solutions:**
```javascript
// Check permission status
console.log('Notification permission:', Notification.permission);

// Request permission on user interaction
button.onclick = async () => {
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    console.log('Permission granted:', permission === 'granted');
  }
};
```

---

### ❌ **"Messages not updating in real-time"**

**Possible Causes:**
1. WebSocket not connected
2. Device not subscribed to updates
3. Wrong device ID

**Debug Steps:**
```javascript
// Check connection status
console.log('Socket connected:', socket.connected);

// Check subscribed devices
console.log('Subscribed devices:', subscribedDevices);

// Verify device ID
console.log('Device ID:', deviceId);
```

---

## Development Debug Mode

Enable detailed logging:

```env
NEXT_PUBLIC_DEBUG_WEBSOCKET=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

This will show detailed logs like:
```
🔌 Connecting to WebSocket for device: 1924149b...
📱 QR Code received: { deviceId, qr, timestamp }
📨 Message received: { message, deviceId, timestamp }
🔄 Device state changed: { status, deviceId }
```

## Browser DevTools Tips

### 1. **Check Network Tab**
- Look for WebSocket connection in Network tab
- Status should be "101 Switching Protocols"
- Messages should show real-time data flow

### 2. **Check Console Logs**
- Filter by "Socket" or "WebSocket"
- Look for connection success/error messages
- Check for any React warnings

### 3. **Check Application Tab**
- Local Storage should contain auth tokens
- Session Storage for temporary data
- IndexedDB for cached messages (if implemented)

## Production Deployment

### HTTPS Requirements
- WebSocket connections require HTTPS in production
- Notifications require HTTPS
- Update environment variables:

```env
NEXT_PUBLIC_WEBSOCKET_URL=https://your-domain.com
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

### Security Considerations
- Use strong API keys
- Enable CORS properly
- Use WSS (WebSocket Secure) connections
- Validate all WebSocket messages

## Performance Monitoring

### 1. **Connection Health**
```javascript
// Monitor connection quality
socket.on('ping', (latency) => {
  console.log(`WebSocket latency: ${latency}ms`);
});
```

### 2. **Message Queue**
```javascript
// Monitor message queue size
const queueSize = useRealtimeStore(state => state.messageCount);
console.log(`Messages in store: ${queueSize}`);
```

### 3. **Memory Usage**
```javascript
// Check memory usage
if (performance.memory) {
  console.log('Memory usage:', performance.memory);
}
```

## Getting Help

### 1. **Check Logs First**
- Browser console for frontend issues
- Server logs for backend issues
- WebSocket connection logs

### 2. **Common Log Patterns**
- `🔌` = Connection events
- `📱` = Device events
- `📨` = Message events
- `❌` = Error events
- `✅` = Success events

### 3. **Debug Information**
When reporting issues, include:
- Browser and version
- Error messages from console
- Network tab WebSocket status
- Environment variable values (without API keys)

---

## Summary

The real-time WebSocket implementation is now working correctly with:

✅ **WebSocket connections enabled**  
✅ **React infinite loops fixed**  
✅ **Notification permissions handled properly**  
✅ **Environment variables configured**  
✅ **Debug logging enabled**  

Your WhatsApp Web clone now has full real-time capabilities with proper error handling and user experience!
