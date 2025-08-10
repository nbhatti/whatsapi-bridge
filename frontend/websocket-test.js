const { io } = require('socket.io-client');

// Test WebSocket connection
const deviceId = '1924149b-b98c-4c84-bec7-22aebf2701d8';
const socket = io('http://localhost:3000', {
  path: '/ws',
  query: {
    apiKey: 'test-api-key-123',
    deviceId: deviceId
  },
  transports: ['websocket', 'polling'],
  timeout: 10000
});

console.log('🔌 Testing WebSocket connection...');

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('⏰ WebSocket connection timed out');
  socket.disconnect();
  process.exit(1);
}, 10000);
