import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { Server as HttpServer } from 'http';
import { getRedisClient } from './redis';
import { createAdapter } from '@socket.io/redis-adapter';
import logger from './logger';
import { socketAuth } from '../middlewares/socket.auth';
import { initializeDeviceNamespace } from '../sockets/device.socket';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types/socket.types';

// CORS origin validation function to support network ranges
function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  
  // Check if CORS_ALLOW_ALL is enabled for debugging
  if (process.env.CORS_ALLOW_ALL === 'true') {
    console.log(`Socket.IO CORS_ALLOW_ALL enabled - allowing origin: ${origin}`);
    return true;
  }
  
  // Parse the origin to get the host
  let hostname: string;
  try {
    const url = new URL(origin);
    hostname = url.hostname;
  } catch {
    return false;
  }
  
  // Allow localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  
  // Allow the custom domain
  if (hostname === 'hd.verp.dev') {
    return true;
  }
  
  // Allow ngrok tunnels (for development)
  if (hostname.endsWith('.ngrok.io') || hostname.endsWith('.ngrok-free.app')) {
    return true;
  }
  
  // Check if hostname is in the 10.2.20.0/22 range (10.2.20.0 to 10.2.23.255)
  const ipRegex = /^10\.2\.(2[0-3]|20|21|22|23)\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/;
  if (ipRegex.test(hostname)) {
    return true;
  }
  
  // Check against explicit CORS origins from environment
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  return allowedOrigins.some(allowed => allowed.trim() === origin);
}

export const socketConfig: Partial<ServerOptions> = {
  path: '/ws',
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Always allow requests without origin (like mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      const allowed = isOriginAllowed(origin);
      callback(null, allowed);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const initializeSocketIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, socketConfig);

  // Set up Redis adapter for Socket.IO clustering
  if (process.env.NODE_ENV === 'production') {
    try {
      const redisClient = getRedisClient();
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter initialized');
    } catch (error) {
      console.error('Failed to initialize Socket.IO Redis adapter:', error);
    }
  }

  // Connection handling
  // Register the device namespace (supports UUIDs with hyphens)
  const deviceNamespace = io.of(/^\/device\/[\w-]+$/);

  // Middleware for API key authentication on the device namespace
  deviceNamespace.use(socketAuth);

  // Initialize the device namespace
  initializeDeviceNamespace(deviceNamespace);

  // Fallback for connections to the default namespace
  io.on('connection', (socket) => {
    logger.warn(`Client connected to default namespace, disconnecting: ${socket.id}`);
    socket.disconnect(true);
  });

  return io;
};

export const emitToRoom = (room: string, event: string, data: any): void => {
  if (io) {
    io.to(room).emit(event as any, data);
  }
};

export const emitToSocket = (socketId: string, event: string, data: any): void => {
  if (io) {
    io.to(socketId).emit(event as any, data);
  }
};
