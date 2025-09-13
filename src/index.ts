import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import morgan from 'morgan';
import { logger, morganLoggerStream, validateEnvironment, initializeRedis, initializeSocketIO, setupSwagger, getRedisClient } from './config';
import { 
  apiKeyAuth, 
  // apiRateLimiter, // Disabled for troubleshooting
  errorHandler, 
  notFoundHandler, 
  uncaughtExceptionHandler, 
  unhandledRejectionHandler 
} from './middlewares';

// No-op rate limiter for development
const apiRateLimiter = (req: any, res: any, next: any) => next();
import { PORT } from './config/constants';
import { DeviceManager, MessageQueueService, DeviceHealthService } from './services';
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

// CORS Middleware for HTTP requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log the origin for debugging
  if (origin) {
    logger.info(`CORS request from origin: ${origin}`);
  }
  
  // Function to check if origin is allowed
  const isOriginAllowed = (origin?: string): boolean => {
    if (!origin) return true; // Allow requests without origin
    
    // Check if CORS_ALLOW_ALL is enabled for debugging
    if (process.env.CORS_ALLOW_ALL === 'true') {
      logger.info(`CORS_ALLOW_ALL enabled - allowing origin: ${origin}`);
      return true;
    }
    
    let hostname: string;
    try {
      const url = new URL(origin);
      hostname = url.hostname;
    } catch {
      logger.warn(`Invalid origin URL: ${origin}`);
      return false;
    }
    
    // Allow localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    
    // Allow the custom domain
    if (hostname === 'hd.verp.dev') {
      return true;
    }
    
    // Allow ngrok tunnels (for development)
    if (hostname.endsWith('.ngrok.io') || hostname.endsWith('.ngrok-free.app')) {
      return true;
    }
    
    // Check if hostname is in the 10.2.20.0/22 range (10.2.20.0 to 10.2.23.255)
    const ipRegex = /^10\.2\.(2[0-3]|20|21|22|23)\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/;
    if (ipRegex.test(hostname)) {
      return true;
    }
    
    // Check against explicit CORS origins from environment
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    return allowedOrigins.some(allowed => allowed.trim() === origin);
  };
  
  const allowed = isOriginAllowed(origin);
  
  if (allowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, ngrok-skip-browser-warning');
    logger.debug(`CORS allowed for origin: ${origin}`);
  } else {
    logger.warn(`CORS blocked for origin: ${origin}`);
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Redis
initializeRedis().then(async () => {
  // Initialize blocking prevention services after Redis is ready
  try {
    logger.info('Initializing blocking prevention services...');
    
    // Initialize services (singletons will be created)
    const messageQueueService = MessageQueueService.getInstance();
    const deviceHealthService = DeviceHealthService.getInstance();
    
    logger.info('Blocking prevention services initialized successfully');
    
    // Restore devices from Redis after services are ready
    const deviceManager = DeviceManager.getInstance();
    await deviceManager.restoreDevicesFromRedis();
    const restoredDevices = deviceManager.getAllDevices();
    logger.info(`Device restoration completed: ${restoredDevices.length} device(s) restored from Redis`);
    
  } catch (error) {
    logger.error('Failed to initialize blocking prevention services or restore devices:', error);
  }
}).catch(error => {
  logger.error('Failed to initialize Redis:', error);
});

// Initialize Socket.IO
initializeSocketIO(server);

// Setup Swagger docs (before auth middleware to allow public access)
setupSwagger(app);

// Simple health check endpoint (no dependencies)
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Health check endpoint (before auth to allow public access)
app.get('/health', async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Health check endpoint error', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Security and Rate Limiting Middleware (apply after docs and health setup)
app.use(apiRateLimiter); // Using no-op version for development
app.use(apiKeyAuth);

// API routes
app.use('/api', routes);

// Error Handling Middleware (should be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
