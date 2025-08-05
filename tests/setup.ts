import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.API_KEY = 'test-api-key';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use different Redis DB for tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock whatsapp-web.js
jest.mock('whatsapp-web.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue({
      id: 'test-message-id',
      body: 'test message',
      timestamp: Date.now(),
    }),
    getContacts: jest.fn().mockResolvedValue([
      {
        id: { _serialized: '1234567890@c.us' },
        name: 'Test Contact',
        number: '1234567890',
        isGroup: false,
        isBusiness: false,
        isMyContact: true,
      }
    ]),
    getChatById: jest.fn().mockResolvedValue({
      fetchMessages: jest.fn().mockResolvedValue([
        {
          id: 'msg1',
          body: 'Hello',
          timestamp: Date.now(),
          from: '1234567890@c.us',
        }
      ])
    }),
    on: jest.fn(),
    emit: jest.fn(),
  })),
  MessageMedia: jest.fn().mockImplementation((mimetype, data) => ({
    mimetype,
    data,
  })),
  LocalAuth: jest.fn(),
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-qr-image')),
}));

// Mock Redis
jest.mock('ioredis', () => {
  return class MockRedis {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue('OK');
    del = jest.fn().mockResolvedValue(1);
    ping = jest.fn().mockResolvedValue('PONG');
    keys = jest.fn().mockResolvedValue([]);
    disconnect = jest.fn().mockResolvedValue(null);
  };
});

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock DeviceManager
jest.mock('../src/services/DeviceManager', () => {
  const mockDeviceManager = {
    createDevice: jest.fn().mockResolvedValue({
      id: 'test-uuid-1234',
      status: 'initializing',
      createdAt: Date.now(),
      lastSeen: Date.now(),
    }),
    listDevices: jest.fn().mockResolvedValue([]),
    getDevice: jest.fn().mockReturnValue({
      id: 'test-uuid-1234',
      status: 'ready',
      createdAt: Date.now(),
      lastSeen: Date.now(),
      client: {
        sendMessage: jest.fn().mockResolvedValue({
          id: 'test-message-id',
          body: 'test message',
          timestamp: Date.now(),
        }),
        getChatById: jest.fn().mockResolvedValue({
          fetchMessages: jest.fn().mockResolvedValue([
            {
              id: 'msg1',
              body: 'Hello',
              timestamp: Date.now(),
              from: '1234567890@c.us',
            }
          ])
        }),
      },
    }),
    deleteDevice: jest.fn().mockResolvedValue(undefined),
    deleteAllDevices: jest.fn().mockResolvedValue(undefined),
  };
  
  return {
    DeviceManager: {
      getInstance: jest.fn(() => mockDeviceManager),
    },
  };
});

// Global test timeout
jest.setTimeout(30000);
