import { Namespace, Socket } from 'socket.io';
import { logger } from '../config';
import { io } from '../config/socketio';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  SOCKET_EVENTS,
  DeviceStatePayload,
  DeviceQRPayload,
  DeviceReadyPayload,
  DeviceAuthenticatedPayload,
  MessageReceivedPayload,
  DeviceDisconnectedPayload,
} from '../types/socket.types';

/**
 * Initializes the device namespace and handles connection and authentication.
 * @param deviceNamespace - The Socket.IO namespace for devices.
 */
export const initializeDeviceNamespace = (
  deviceNamespace: Namespace<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
): void => {
  deviceNamespace.on(
    'connection',
    (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
      const deviceId = socket.nsp.name.split('/').pop() || 'unknown';
      logger.info(`Client connected to device namespace: ${socket.id} for device: ${deviceId}`);

      // Join a room specific to the device
      socket.join(deviceId);
      socket.data.deviceId = deviceId;
      socket.data.connectedAt = Date.now();

      // Handle events for this specific device
      socket.on('disconnect', (reason) => {
        logger.info(
          `Client disconnected from device namespace: ${socket.id}, reason: ${reason}`
        );
        
        // Emit disconnected event to other clients in the same room
        const disconnectedPayload: DeviceDisconnectedPayload = {
          deviceId,
          reason,
          timestamp: Date.now(),
        };
        deviceNamespace.to(deviceId).emit(SOCKET_EVENTS.DEVICE_DISCONNECTED, disconnectedPayload);
      });

      // Emit a ready event to the client
      const statePayload: DeviceStatePayload = {
        deviceId,
        status: 'ready',
        timestamp: Date.now(),
      };
      socket.emit(SOCKET_EVENTS.DEVICE_STATE, statePayload);
    }
  );

  logger.info('Device namespace initialized');
};

/**
 * Emit QR code event to all clients connected to a specific device namespace
 */
export const emitQRCode = (deviceId: string, qr: string): void => {
  const qrPayload: DeviceQRPayload = {
    deviceId,
    qr,
    timestamp: Date.now(),
  };
  
  if (io) {
    io.of(`/device/${deviceId}`).emit(SOCKET_EVENTS.DEVICE_QR, qrPayload);
  }
};

/**
 * Emit ready event to all clients connected to a specific device namespace
 */
export const emitDeviceReady = (deviceId: string, phoneNumber?: string): void => {
  const readyPayload: DeviceReadyPayload = {
    deviceId,
    phoneNumber,
    timestamp: Date.now(),
  };
  
  if (io) {
    io.of(`/device/${deviceId}`).emit(SOCKET_EVENTS.DEVICE_READY, readyPayload);
  }
};

/**
 * Emit authenticated event to all clients connected to a specific device namespace
 */
export const emitDeviceAuthenticated = (deviceId: string, phoneNumber: string, clientName: string): void => {
  const authPayload: DeviceAuthenticatedPayload = {
    deviceId,
    phoneNumber,
    clientName,
    timestamp: Date.now(),
  };
  
  if (io) {
    io.of(`/device/${deviceId}`).emit(SOCKET_EVENTS.DEVICE_AUTHENTICATED, authPayload);
  }
};

/**
 * Emit message event to all clients connected to a specific device namespace
 */
export const emitMessage = (deviceId: string, message: any): void => {
  const messagePayload: MessageReceivedPayload = {
    deviceId,
    message,
    timestamp: Date.now(),
  };
  
  if (io) {
    io.of(`/device/${deviceId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, messagePayload);
  }
};

/**
 * Emit device state event to all clients connected to a specific device namespace
 */
export const emitDeviceState = (deviceId: string, status: string): void => {
  const statePayload: DeviceStatePayload = {
    deviceId,
    status,
    timestamp: Date.now(),
  };
  
  if (io) {
    io.of(`/device/${deviceId}`).emit(SOCKET_EVENTS.DEVICE_STATE, statePayload);
  }
};

/**
 * Emit disconnected event to all clients connected to a specific device namespace
 */
export const emitDeviceDisconnected = (deviceId: string, reason: string): void => {
  const disconnectedPayload: DeviceDisconnectedPayload = {
    deviceId,
    reason,
    timestamp: Date.now(),
  };
  
  if (io) {
    io.of(`/device/${deviceId}`).emit(SOCKET_EVENTS.DEVICE_DISCONNECTED, disconnectedPayload);
  }
};

