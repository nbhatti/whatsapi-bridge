import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import morgan from 'morgan';
import { logger, morganLoggerStream, validateEnvironment, initializeRedis, initializeSocketIO, setupSwagger, getRedisClient } from './config';
import { 
  apiKeyAuth, 
  apiRateLimiter, 
  errorHandler, 
  notFoundHandler, 
  uncaughtExceptionHandler, 
  unhandledRejectionHandler 
} from './middlewares';
import { PORT } from './config/constants';
import { DeviceManager } from './services';
import routes from './routes';

// Initialize exception handlers
uncaughtExceptionHandler();
unhandledRejectionHandler();

// Validate environment variables
validateEnvironment();
dotenv.config();

const app = express();
const server = createServer(app);

// Morgan HTTP request logging
app.use(morgan('combined', { stream: morganLoggerStream }));

// Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Redis
initializeRedis().then(async () => {
  // Restore devices from Redis after Redis is connected
  try {
    const deviceManager = DeviceManager.getInstance();
    await deviceManager.restoreDevicesFromRedis();
    logger.info('Device restoration completed');
  } catch (error) {
    logger.error('Failed to restore devices:', error);
  }
}).catch(error => {
  logger.error('Failed to initialize Redis:', error);
});

// Initialize Socket.IO
initializeSocketIO(server);

// Setup Swagger docs (before auth middleware to allow public access)
setupSwagger(app);

// Security and Rate Limiting Middleware (apply after docs setup)
app.use(apiRateLimiter);
app.use(apiKeyAuth);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      redis: 'UNKNOWN',
      memory: 'OK',
      server: 'OK',
    },
    metadata: {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
    },
  };

  let overallStatus = 200;

  // Check Redis connection
  try {
    const redisClient = getRedisClient();
    const redisPing = await redisClient.ping();
    healthCheck.checks.redis = redisPing === 'PONG' ? 'OK' : 'FAIL';
    if (healthCheck.checks.redis === 'FAIL') {
      overallStatus = 503;
      healthCheck.status = 'DEGRADED';
    }
  } catch (error) {
    logger.error('Redis health check failed', error);
    healthCheck.checks.redis = 'FAIL';
    overallStatus = 503;
    healthCheck.status = 'DEGRADED';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  if (memUsagePercent > 90) {
    healthCheck.checks.memory = 'WARN';
    if (healthCheck.status === 'OK') {
      healthCheck.status = 'DEGRADED';
    }
  }

  res.status(overallStatus).json(healthCheck);
});

// Error Handling Middleware (should be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
