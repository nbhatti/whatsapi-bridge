import request from 'supertest';
import express from 'express';

// Simple health check test app
const createHealthApp = () => {
  const app = express();
  
  app.get('/health', async (req, res) => {
    const healthCheck = {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        redis: 'OK',
        memory: 'OK', 
        server: 'OK',
      },
      metadata: {
        version: '1.0.0',
        environment: 'test',
        node_version: process.version,
      },
    };
    
    res.status(200).json(healthCheck);
  });
  
  return app;
};

describe('Health Check API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createHealthApp();
  });

  it('should return health status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('OK');
    expect(res.body.uptime).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.server).toBe('OK');
    expect(res.body.metadata).toBeDefined();
    expect(res.body.metadata.environment).toBe('test');
  });
});
