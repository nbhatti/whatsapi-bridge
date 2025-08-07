import request from 'supertest';
import app from '../../src/index';
import { getRedis, closeRedis } from '../../src/lib/redis';

describe('Cache API Integration Tests', () => {
  const validApiKey = process.env.API_KEY || 'test-api-key';

  afterAll(async () => {
    // Clean up Redis connection
    await closeRedis();
  });

  describe('DELETE /api/v1/cache', () => {
    it('should flush cache successfully with valid API key', async () => {
      const response = await request(app)
        .delete('/api/v1/cache')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        flushed: true,
        keysRemoved: expect.any(Number)
      });

      // keysRemoved should be a non-negative integer
      expect(response.body.keysRemoved).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app)
        .delete('/api/v1/cache')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'API key is required. Please provide a valid x-api-key header.',
        code: 'MISSING_API_KEY'
      });
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app)
        .delete('/api/v1/cache')
        .set('x-api-key', 'invalid-key')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid API key provided.',
        code: 'INVALID_API_KEY'
      });
    });
  });

  describe('Cache flush idempotency', () => {
    it('should handle multiple flush operations gracefully', async () => {
      // First flush
      const response1 = await request(app)
        .delete('/api/v1/cache')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response1.body.flushed).toBe(true);

      // Second flush (should still work even if no keys exist)
      const response2 = await request(app)
        .delete('/api/v1/cache')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response2.body.flushed).toBe(true);
      // Second flush should return 0 keys removed since they were already deleted
      expect(response2.body.keysRemoved).toBe(0);
    });
  });

  describe('Cache state verification', () => {
    it('should actually delete the specified Redis keys', async () => {
      // Setup: Add some test data to Redis
      const redis = await getRedis();
      await redis.set('whatsapp:in', 'test-data-in');
      await redis.set('whatsapp:out', 'test-data-out');
      await redis.set('whatsapp:other', 'test-data-other'); // This should not be deleted

      // Verify data exists
      expect(await redis.exists('whatsapp:in')).toBe(1);
      expect(await redis.exists('whatsapp:out')).toBe(1);
      expect(await redis.exists('whatsapp:other')).toBe(1);

      // Execute flush
      const response = await request(app)
        .delete('/api/v1/cache')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.flushed).toBe(true);
      expect(response.body.keysRemoved).toBe(2);

      // Verify only the target keys were deleted
      expect(await redis.exists('whatsapp:in')).toBe(0);
      expect(await redis.exists('whatsapp:out')).toBe(0);
      expect(await redis.exists('whatsapp:other')).toBe(1); // Should still exist

      // Cleanup
      await redis.del('whatsapp:other');
    });
  });
});
