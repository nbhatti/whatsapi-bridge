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

export const socketConfig: Partial<ServerOptions> = {
  path: '/ws',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
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
