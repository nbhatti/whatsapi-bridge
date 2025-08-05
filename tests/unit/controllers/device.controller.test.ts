import { Request, Response } from 'express';
import { DeviceController } from '../../../src/controllers/device.controller';
import { DeviceManager } from '../../../src/services/DeviceManager';

describe('DeviceController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDeviceManager: jest.Mocked<ReturnType<typeof DeviceManager.getInstance>>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    // Get the mock instance
    mockDeviceManager = DeviceManager.getInstance() as jest.Mocked<ReturnType<typeof DeviceManager.getInstance>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDevice', () => {
    it('should create a device successfully', async () => {
      const mockDevice = {
        id: 'test-device-id',
        status: 'creating',
        createdAt: new Date(),
        lastSeen: new Date(),
      };

      mockDeviceManager.createDevice.mockResolvedValue(mockDevice as any);

      await DeviceController.createDevice(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceManager.createDevice).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          deviceId: mockDevice.id,
          status: mockDevice.status,
          createdAt: mockDevice.createdAt,
          lastSeen: mockDevice.lastSeen,
        },
      });
    });

    it('should handle errors when creating device', async () => {
      mockDeviceManager.createDevice.mockRejectedValue(new Error('Create device failed'));

      await DeviceController.createDevice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create device',
      });
    });
  });

  describe('listDevices', () => {
    it('should list devices successfully', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          status: 'ready',
          createdAt: new Date(),
          lastSeen: new Date(),
        },
        {
          id: 'device-2',
          status: 'qr',
          createdAt: new Date(),
          lastSeen: new Date(),
        },
      ];

      mockDeviceManager.listDevices.mockResolvedValue(mockDevices as any);

      await DeviceController.listDevices(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceManager.listDevices).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDevices.map(device => ({
          deviceId: device.id,
          status: device.status,
          createdAt: device.createdAt,
          lastSeen: device.lastSeen,
        })),
      });
    });

    it('should handle errors when listing devices', async () => {
      mockDeviceManager.listDevices.mockRejectedValue(new Error('List devices failed'));

      await DeviceController.listDevices(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to list devices',
      });
    });
  });

  describe('getDeviceStatus', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'test-device-id' };
    });

    it('should get device status successfully', async () => {
      const mockDevice = {
        id: 'test-device-id',
        status: 'ready',
        lastSeen: new Date(),
      };

      mockDeviceManager.getDevice.mockReturnValue(mockDevice as any);

      await DeviceController.getDeviceStatus(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceManager.getDevice).toHaveBeenCalledWith('test-device-id');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          deviceId: mockDevice.id,
          status: mockDevice.status,
          lastSeen: mockDevice.lastSeen,
        },
      });
    });

    it('should return 404 when device not found', async () => {
      mockDeviceManager.getDevice.mockReturnValue(undefined);

      await DeviceController.getDeviceStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Device not found',
      });
    });

    it('should include QR data when device status is qr', async () => {
      const mockDevice = {
        id: 'test-device-id',
        status: 'qr',
        lastSeen: new Date(),
        qrCode: 'mock-qr-code-string',
      };

      mockDeviceManager.getDevice.mockReturnValue(mockDevice as any);

      await DeviceController.getDeviceStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          deviceId: mockDevice.id,
          status: mockDevice.status,
          lastSeen: mockDevice.lastSeen,
          qrDataUrl: expect.stringContaining('data:image/png;base64'),
          qrCode: mockDevice.qrCode,
        }),
      });
    });
  });

  describe('deleteDevice', () => {
    beforeEach(() => {
      mockRequest.params = { id: 'test-device-id' };
    });

    it('should delete device successfully', async () => {
      const mockDevice = {
        id: 'test-device-id',
        status: 'ready',
      };

      mockDeviceManager.getDevice.mockReturnValue(mockDevice as any);
      mockDeviceManager.deleteDevice.mockResolvedValue(undefined);

      await DeviceController.deleteDevice(mockRequest as Request, mockResponse as Response);

      expect(mockDeviceManager.getDevice).toHaveBeenCalledWith('test-device-id');
      expect(mockDeviceManager.deleteDevice).toHaveBeenCalledWith('test-device-id');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Device logged out and cleaned up successfully',
      });
    });

    it('should return 404 when device not found', async () => {
      mockDeviceManager.getDevice.mockReturnValue(undefined);

      await DeviceController.deleteDevice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Device not found',
      });
    });

    it('should handle errors when deleting device', async () => {
      const mockDevice = {
        id: 'test-device-id',
        status: 'ready',
      };

      mockDeviceManager.getDevice.mockReturnValue(mockDevice as any);
      mockDeviceManager.deleteDevice.mockRejectedValue(new Error('Delete failed'));

      await DeviceController.deleteDevice(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to logout and cleanup device',
      });
    });
  });
});
