import request from 'supertest';
import express from 'express';
import { sendMessage, fetchMessages } from '../../src/controllers/message.controller';

// Create a test app for message endpoints
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
  
  // Message routes
  app.post('/api/v1/devices/:id/messages', sendMessage);
  app.get('/api/v1/devices/:id/messages', fetchMessages);
  
  return app;
};

describe('Message API', () => {
  let app: express.Application;
  const deviceId = 'test-uuid-1234';

  beforeAll(() => {
    app = createTestApp();
  });

  it('should send a text message', async () => {
    const messageData = {
      to: '1234567890@c.us',
      type: 'text',
      text: 'Hello, this is a test message!'
    };

    const res = await request(app)
      .post(`/api/v1/devices/${deviceId}/messages`)
      .set('x-api-key', 'test-api-key')
      .send(messageData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('test-message-id');
    expect(res.body.data.body).toBe('test message');
  });

  it('should send a message with media', async () => {
    const messageData = {
      to: '1234567890@c.us',
      type: 'image',
      mediaBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    const res = await request(app)
      .post(`/api/v1/devices/${deviceId}/messages`)
      .set('x-api-key', 'test-api-key')
      .send(messageData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('test-message-id');
  });

  it('should fetch messages from a chat', async () => {
    const res = await request(app)
      .get(`/api/v1/devices/${deviceId}/messages`)
      .set('x-api-key', 'test-api-key')
      .query({
        chatId: '1234567890@c.us',
        limit: 10
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe('msg1');
    expect(res.body.data[0].body).toBe('Hello');
  });

  it('should return error for invalid message type', async () => {
    const messageData = {
      to: '1234567890@c.us',
      type: 'invalid_type',
      text: 'Hello, this is a test message!'
    };

    const res = await request(app)
      .post(`/api/v1/devices/${deviceId}/messages`)
      .set('x-api-key', 'test-api-key')
      .send(messageData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid message type or missing content.');
  });

  it('should return error for missing required fields', async () => {
    const messageData = {
      type: 'text'
      // Missing 'to' field
    };

    const res = await request(app)
      .post(`/api/v1/devices/${deviceId}/messages`)
      .set('x-api-key', 'test-api-key')
      .send(messageData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid message type or missing content.');
  });
});
