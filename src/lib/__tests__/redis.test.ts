import { RedisManager, getRedis, closeRedis, getKeyPrefix, prefixKey, unprefixKey, redisHealthCheck, getConnectionInfo } from '../redis';
import redisMock from 'redis-mock';

// Mock process.env
const originalEnv = process.env;

describe('Redis Manager', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Reset singleton instance
    (RedisManager as any).instance = null;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration Management', () => {
    it('should use default configuration when no env vars are set', () => {
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.NODE_ENV;

      const manager = RedisManager.getInstance();
      const connectionInfo = manager.getConnectionInfo();

      expect(connectionInfo).toMatchObject({
        host: 'localhost',
        port: 6379,
        keyPrefix: 'whatsapp:development:',
        isCluster: false
      });
    });

    it('should use environment variables for configuration', () => {
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.NODE_ENV = 'production';

      const manager = RedisManager.getInstance();
      const connectionInfo = manager.getConnectionInfo();

      expect(connectionInfo).toMatchObject({
        host: 'redis.example.com',
        port: 6380,
        keyPrefix: 'whatsapp:production:',
        isCluster: false
      });
    });

    it('should detect cluster configuration', () => {
      process.env.REDIS_CLUSTER_HOSTS = 'host1:6379,host2:6379';

      const manager = RedisManager.getInstance();
      const connectionInfo = manager.getConnectionInfo();

      expect(connectionInfo.isCluster).toBe(true);
    });

    it('should handle different environments in key prefix', () => {
      const environments = ['development', 'test', 'staging', 'production'];

      environments.forEach(env => {
        process.env.NODE_ENV = env;
        (RedisManager as any).instance = null; // Reset singleton
        
        const manager = RedisManager.getInstance();
        expect(manager.getKeyPrefix()).toBe(`whatsapp:${env}:`);
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = RedisManager.getInstance();
      const instance2 = RedisManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton across different imports', () => {
      const manager1 = RedisManager.getInstance();
      // Simulate different module import
      delete require.cache[require.resolve('../redis')];
      const { RedisManager: RedisManager2 } = require('../redis');
      const manager2 = RedisManager2.getInstance();
      
      expect(manager1).toBe(manager2);
    });
  });

  describe('Key Management', () => {
    let manager: RedisManager;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      manager = RedisManager.getInstance();
    });

    it('should add prefix to keys correctly', () => {
      expect(manager.prefixKey('user:123')).toBe('whatsapp:test:user:123');
      expect(manager.prefixKey('session')).toBe('whatsapp:test:session');
    });

    it('should not double-prefix keys', () => {
      const prefixed = manager.prefixKey('user:123');
      expect(manager.prefixKey(prefixed)).toBe(prefixed);
    });

    it('should remove prefix from keys correctly', () => {
      expect(manager.unprefixKey('whatsapp:test:user:123')).toBe('user:123');
      expect(manager.unprefixKey('whatsapp:test:session')).toBe('session');
    });

    it('should handle keys without prefix in unprefixKey', () => {
      expect(manager.unprefixKey('user:123')).toBe('user:123');
      expect(manager.unprefixKey('session')).toBe('session');
    });

    it('should handle edge cases in key operations', () => {
      expect(manager.prefixKey('')).toBe('whatsapp:test:');
      expect(manager.unprefixKey('')).toBe('');
      expect(manager.prefixKey('whatsapp:test:')).toBe('whatsapp:test:');
    });
  });

  describe('Connection Management', () => {
    let mockCreateClient: jest.SpyInstance;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      // Mock ioredis to use redis-mock
      mockCreateClient = jest.spyOn(require('ioredis'), 'default').mockImplementation(() => {
        const client = redisMock.createClient();
        // Add ioredis-like methods that redis-mock might not have
        client.disconnect = jest.fn().mockResolvedValue(void 0);
        return client;
      });
    });

    afterEach(() => {
      mockCreateClient.mockRestore();
    });

    it('should create Redis client lazily', async () => {
      const manager = RedisManager.getInstance();
      
      // Client should not be created yet
      expect(mockCreateClient).not.toHaveBeenCalled();
      
      // Accessing client should create it
      await manager.getRedis();
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing client on subsequent calls', async () => {
      const manager = RedisManager.getInstance();
      
      const client1 = await manager.getRedis();
      const client2 = await manager.getRedis();
      
      expect(client1).toBe(client2);
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it('should close Redis connection properly', async () => {
      const manager = RedisManager.getInstance();
      const client = await manager.getRedis();
      
      await manager.closeRedis();
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should handle closing when no client exists', async () => {
      const manager = RedisManager.getInstance();
      // Should not throw
      await expect(manager.closeRedis()).resolves.toBeUndefined();
    });
  });

  describe('Health Checks', () => {
    let manager: RedisManager;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      manager = RedisManager.getInstance();
    });

    it('should report healthy status when Redis is working', async () => {
      // Mock successful ping
      jest.spyOn(require('ioredis'), 'default').mockImplementation(() => {
        const client = redisMock.createClient();
        client.ping = jest.fn().mockResolvedValue('PONG');
        return client;
      });

      const health = await manager.healthCheck();
      expect(health).toEqual({
        status: 'healthy',
        message: 'Redis connection is working'
      });
    });

    it('should report unhealthy status when Redis fails', async () => {
      // Mock failed ping
      jest.spyOn(require('ioredis'), 'default').mockImplementation(() => {
        const client = redisMock.createClient();
        client.ping = jest.fn().mockRejectedValue(new Error('Connection failed'));
        return client;
      });

      const health = await manager.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.message).toContain('Connection failed');
    });
  });

  describe('Cluster Configuration', () => {
    it('should parse cluster hosts correctly', () => {
      process.env.REDIS_CLUSTER_HOSTS = 'redis1:6379,redis2:6380,redis3:6381';
      
      // Mock Redis.Cluster constructor to capture arguments
      const mockCluster = jest.fn();
      jest.doMock('ioredis', () => ({
        default: jest.fn(),
        Cluster: mockCluster
      }));

      const manager = RedisManager.getInstance();
      // Trigger client creation
      manager.getRedis();

      expect(mockCluster).toHaveBeenCalledWith(
        [
          { host: 'redis1', port: 6379 },
          { host: 'redis2', port: 6380 },
          { host: 'redis3', port: 6381 }
        ],
        expect.any(Object)
      );
    });

    it('should handle malformed cluster hosts gracefully', () => {
      process.env.REDIS_CLUSTER_HOSTS = 'redis1,redis2:invalid,redis3:6379';
      
      const mockCluster = jest.fn();
      jest.doMock('ioredis', () => ({
        default: jest.fn(),
        Cluster: mockCluster
      }));

      const manager = RedisManager.getInstance();
      manager.getRedis();

      expect(mockCluster).toHaveBeenCalledWith(
        [
          { host: 'redis1', port: 6379 }, // Default port
          { host: 'redis2', port: NaN },   // Invalid port
          { host: 'redis3', port: 6379 }
        ],
        expect.any(Object)
      );
    });
  });

  describe('Module Export Functions', () => {
    it('should provide correct export functions', async () => {
      // Test that all export functions work
      expect(typeof getRedis).toBe('function');
      expect(typeof closeRedis).toBe('function');
      expect(typeof getKeyPrefix).toBe('function');
      expect(typeof prefixKey).toBe('function');
      expect(typeof unprefixKey).toBe('function');
      expect(typeof redisHealthCheck).toBe('function');
      expect(typeof getConnectionInfo).toBe('function');

      // Test key operations
      process.env.NODE_ENV = 'test';
      expect(getKeyPrefix()).toBe('whatsapp:test:');
      expect(prefixKey('test')).toBe('whatsapp:test:test');
      expect(unprefixKey('whatsapp:test:test')).toBe('test');
    });

    it('should handle health check through export function', async () => {
      jest.spyOn(require('ioredis'), 'default').mockImplementation(() => {
        const client = redisMock.createClient();
        client.ping = jest.fn().mockResolvedValue('PONG');
        return client;
      });

      const health = await redisHealthCheck();
      expect(health.status).toBe('healthy');
    });

    it('should provide connection info through export function', () => {
      process.env.REDIS_HOST = 'test.redis.com';
      process.env.REDIS_PORT = '6380';
      process.env.NODE_ENV = 'test';
      (RedisManager as any).instance = null;

      const info = getConnectionInfo();
      expect(info).toMatchObject({
        host: 'test.redis.com',
        port: 6380,
        keyPrefix: 'whatsapp:test:',
        isCluster: false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const mockClient = {
        on: jest.fn(),
        disconnect: jest.fn().mockRejectedValue(new Error('Disconnect failed'))
      };

      jest.spyOn(require('ioredis'), 'default').mockImplementation(() => mockClient);

      const manager = RedisManager.getInstance();
      await manager.getRedis();

      // Should not throw when close fails
      await expect(manager.closeRedis()).resolves.toBeUndefined();
    });

    it('should register event listeners correctly', async () => {
      const mockClient = {
        on: jest.fn(),
        disconnect: jest.fn().mockResolvedValue(void 0)
      };

      jest.spyOn(require('ioredis'), 'default').mockImplementation(() => mockClient);

      const manager = RedisManager.getInstance();
      await manager.getRedis();

      // Verify all event listeners were registered
      const events = ['connect', 'ready', 'error', 'close', 'reconnecting'];
      events.forEach(event => {
        expect(mockClient.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });
  });

  describe('Environment-specific Behavior', () => {
    it('should configure differently for production', () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_TLS = 'true';
      process.env.REDIS_PASSWORD = 'secure-password';
      process.env.REDIS_DB = '1';
      process.env.REDIS_MAX_RETRIES = '5';
      
      const manager = RedisManager.getInstance();
      const config = manager.getConnectionInfo();

      expect(config.keyPrefix).toBe('whatsapp:production:');
      // Note: We can't directly test TLS/password config without mocking deeper
      // but we can verify the keyPrefix is set correctly
    });

    it('should use development defaults', () => {
      delete process.env.NODE_ENV;
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      
      const manager = RedisManager.getInstance();
      const config = manager.getConnectionInfo();

      expect(config).toMatchObject({
        host: 'localhost',
        port: 6379,
        keyPrefix: 'whatsapp:development:',
        isCluster: false
      });
    });
  });
});
