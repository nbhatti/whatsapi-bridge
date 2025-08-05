import request from 'supertest';
import express from 'express';
import { DeviceController } from '../../src/controllers';
import { validate } from '../../src/middlewares';
import { schemas } from '../../src/config/validation';

// Create a test app without all the middleware and setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock API key middleware for tests
  app.use((req, res, next) => {
    if (req.headers['x-api-key'] === 'test-api-key') {
      next();
    } else {
      res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  });
  
  // Device routes
  app.post('/api/v1/devices', DeviceController.createDevice);
  app.get('/api/v1/devices', DeviceController.listDevices);
  app.get('/api/v1/devices/:id/status', DeviceController.getDeviceStatus);
  app.delete('/api/v1/devices/:id', DeviceController.deleteDevice);
  
  return app;
};

describe('Device API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should create a new device', async () => {
    const res = await request(app)
      .post('/api/v1/devices')
      .set('x-api-key', 'test-api-key')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceId).toBeDefined();
    expect(res.body.data.status).toBe('initializing');
  });

  it('should list all devices', async () => {
    const res = await request(app)
      .get('/api/v1/devices')
      .set('x-api-key', 'test-api-key')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get device status', async () => {
    // First, create a device
    const createRes = await request(app)
      .post('/api/v1/devices')
      .set('x-api-key', 'test-api-key');
    const deviceId = createRes.body.data.deviceId;

    const res = await request(app)
      .get(`/api/v1/devices/${deviceId}/status`)
      .set('x-api-key', 'test-api-key')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceId).toBe(deviceId);
    expect(res.body.data.status).toBeDefined();
  });

  it('should delete a device', async () => {
    // First, create a device
    const createRes = await request(app)
      .post('/api/v1/devices')
      .set('x-api-key', 'test-api-key');
    const deviceId = createRes.body.data.deviceId;

    const res = await request(app)
      .delete(`/api/v1/devices/${deviceId}`)
      .set('x-api-key', 'test-api-key')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Device logged out and cleaned up successfully');
  });
});
