import { Request, Response } from 'express';
import { CacheController } from '../../../src/controllers/cache.controller';
import { getRedis } from '../../../src/lib/redis';
import logger from '../../../src/config/logger';

// Mock dependencies
jest.mock('../../../src/lib/redis');
jest.mock('../../../src/config/logger');

const mockGetRedis = getRedis as jest.MockedFunction<typeof getRedis>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('CacheController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRedisClient = {
      del: jest.fn(),
    };

    mockGetRedis.mockResolvedValue(mockRedisClient);
  });

  describe('flushCache', () => {
    it('should successfully flush cache and return correct response', async () => {
      // Arrange
      mockRedisClient.del.mockResolvedValue(2);

      // Act
      await CacheController.flushCache(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockGetRedis).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('in', 'out');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        flushed: true,
        keysRemoved: 2
      });
    });

    it('should handle case when no keys are deleted', async () => {
      // Arrange
      mockRedisClient.del.mockResolvedValue(0);

      // Act
      await CacheController.flushCache(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockGetRedis).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('in', 'out');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        flushed: true,
        keysRemoved: 0
      });
    });

    it('should handle Redis connection errors', async () => {
      // Arrange
      const error = new Error('Redis connection failed');
      mockGetRedis.mockRejectedValue(error);

      // Act
      await CacheController.flushCache(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockGetRedis).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to flush cache',
        flushed: false,
        keysRemoved: 0
      });
    });

    it('should handle Redis delete operation errors', async () => {
      // Arrange
      const error = new Error('Redis delete failed');
      mockRedisClient.del.mockRejectedValue(error);

      // Act
      await CacheController.flushCache(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockGetRedis).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('in', 'out');
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to flush cache',
        flushed: false,
        keysRemoved: 0
      });
    });
  });
});
