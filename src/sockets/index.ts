// Socket.IO related files
// This file serves as a central export point for all socket handlers and configurations

export {
  initializeDeviceNamespace,
  emitQRCode,
  emitDeviceReady,
  emitDeviceAuthenticated,
  emitMessage,
  emitDeviceState,
  emitDeviceDisconnected,
} from './device.socket';
