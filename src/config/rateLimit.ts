import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from './redis';
import { Request, Response } from 'express';

// Create rate limit store using Redis
const createRedisStore = () => {
  return new RedisStore({
    sendCommand: (...args: string[]) => {
      try {
        const redisClient = getRedisClient();
        // Check if Redis client is ready
        if (redisClient.status !== 'ready') {
          console.warn('Redis client is not ready, skipping rate limit storage');
          return Promise.resolve('') as any;
        }
        return redisClient.sendCommand(args as any);
      } catch (error) {
        console.warn('Redis client error in rate limit store:', error);
        return Promise.resolve('') as any;
      }
    },
  });
};

// Default rate limit configuration
const defaultConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// General API rate limiter
export const apiLimiter = rateLimit({
  ...defaultConfig,
  // Use memory store for now to avoid Redis connection issues
  // store: createRedisStore(),
});

// Strict rate limiter for sensitive operations (auth, client creation)
export const strictLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 900000, // 15 minutes
  max: 10, // 10 requests per window
  // store: createRedisStore(),
  message: {
    success: false,
    error: 'Too many attempts for sensitive operations, please try again later.',
    retryAfter: '15 minutes',
  },
});

// Message sending rate limiter (per client) - DISABLED FOR NOW
export const messageLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30, // 30 messages per minute per client
  skip: () => true, // Disable for now
  message: {
    success: false,
    error: 'Message rate limit exceeded. Please slow down.',
    retryAfter: '1 minute',
  },
});

// WhatsApp client operation limiter - DISABLED FOR NOW
export const clientOperationLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 20, // 20 operations per 5 minutes per client
  skip: () => true, // Disable for now
  message: {
    success: false,
    error: 'Client operation rate limit exceeded.',
    retryAfter: '5 minutes',
  },
});

// File upload rate limiter - DISABLED FOR NOW
export const uploadLimiter = rateLimit({
  windowMs: 600000, // 10 minutes
  max: 50, // 50 uploads per 10 minutes
  skip: () => true, // Disable for now
  message: {
    success: false,
    error: 'File upload rate limit exceeded.',
    retryAfter: '10 minutes',
  },
});

// Custom rate limiter factory
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    store: createRedisStore(),
    keyGenerator: (req: Request) => {
      const prefix = options.keyPrefix || 'custom';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `${prefix}_${ip}`;
    },
    message: {
      success: false,
      error: options.message || defaultConfig.message.error,
      retryAfter: `${Math.ceil(options.windowMs / 60000)} minutes`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Skip rate limiting for certain conditions
export const skipRateLimit = (req: Request): boolean => {
  // Skip for localhost in development
  if (process.env.NODE_ENV === 'development' && 
      (req.ip === '127.0.0.1' || req.ip === '::1')) {
    return true;
  }
  
  // Skip for trusted IPs (if configured)
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  if (trustedIPs.includes(req.ip || '')) {
    return true;
  }
  
  return false;
};

// Apply skip logic to all limiters
[apiLimiter, strictLimiter, messageLimiter, clientOperationLimiter, uploadLimiter].forEach(limiter => {
  (limiter as any).skip = skipRateLimit;
});
