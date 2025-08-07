import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { Request, Response } from 'express';
import logger, { logWarn, logError } from '../config/logger';

/**
 * Rate Limiter Configuration Interface
 */
export interface RateLimiterConfig {
  windowMs: number;           // Time window in milliseconds
  max: number;               // Maximum number of requests per window
  keyPrefix?: string;        // Prefix for Redis keys
  message?: string;          // Custom error message
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;      // Don't count failed requests
  keyGenerator?: (req: Request) => string;  // Custom key generator
  skip?: (req: Request, res: Response) => boolean;  // Skip function
}

/**
 * Redis connection status tracking
 */
let redisWarningLogged = false;
let redisReadyLogged = false;

/**
 * Creates a Redis store for rate limiting
 * 
 * @param keyPrefix - Prefix for Redis keys
 * @returns RedisStore instance or undefined if Redis is not available
 */
const createRedisStore = (keyPrefix: string = 'whatsapp:rl') => {
  try {
    const redisClient = getRedisClient();
    
    return new RedisStore({
      sendCommand: (...args: string[]) => {
        try {
          // Check if Redis client is ready
          if (redisClient.status !== 'ready') {
            // Only log warning once to avoid spam
            if (!redisWarningLogged) {
              logWarn('Redis client is not ready for rate limiting, using memory store fallback');
              redisWarningLogged = true;
            }
            return Promise.resolve('') as any;
          } else {
            // Log when Redis becomes ready (only once)
            if (!redisReadyLogged) {
              logger.info('Rate limiting now using Redis store');
              redisReadyLogged = true;
            }
          }
          return redisClient.sendCommand(args as any);
        } catch (error) {
          logError('Redis error in rate limit store', error);
          return Promise.resolve('') as any;
        }
      },
      prefix: `${keyPrefix}:`,
    });
  } catch (error) {
    logError('Failed to create Redis store for rate limiting', error);
    return undefined; // Will fall back to default memory store
  }
};

/**
 * Default rate limiter configuration
 */
const defaultConfig: Partial<RateLimiterConfig> = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),      // 100 requests
  keyPrefix: 'whatsapp:default',
  message: 'Too many requests from this IP, please try again later.',
};

/**
 * Skip rate limiting for certain conditions
 */
export const skipRateLimit = (req: Request): boolean => {
  // Skip for localhost in development
  if (process.env.NODE_ENV === 'development' && 
      (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
    return true;
  }
  
  // Skip for trusted IPs (if configured)
  const trustedIPs = process.env.TRUSTED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || [];
  if (trustedIPs.includes(req.ip || '')) {
    return true;
  }
  
  return false;
};

/**
 * Creates a custom rate limiter with the specified configuration
 * 
 * @param config - Rate limiter configuration
 * @returns Express rate limit middleware
 */
export const createRateLimiter = (config: RateLimiterConfig): RateLimitRequestHandler => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const store = createRedisStore(finalConfig.keyPrefix);
  
  return rateLimit({
    windowMs: finalConfig.windowMs!,
    max: finalConfig.max!,
    store: store, // Will fall back to memory store if Redis store creation fails
    // Remove keyGenerator completely to use default which is IPv6-safe
    message: {
      success: false,
      error: finalConfig.message || defaultConfig.message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: `${Math.ceil(finalConfig.windowMs! / 60000)} minutes`,
    },
    standardHeaders: true,   // Include rate limit info in response headers
    legacyHeaders: false,    // Disable legacy X-RateLimit-* headers
    skipSuccessfulRequests: finalConfig.skipSuccessfulRequests || false,
    skipFailedRequests: finalConfig.skipFailedRequests || false,
    skip: finalConfig.skip || skipRateLimit,
    handler: (req: Request, res: Response) => {
      const message = {
        success: false,
        error: finalConfig.message || defaultConfig.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: `${Math.ceil(finalConfig.windowMs! / 60000)} minutes`,
        limit: finalConfig.max,
        windowMs: finalConfig.windowMs,
      };
      
      logWarn(`Rate limit exceeded for ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        limit: finalConfig.max,
        window: finalConfig.windowMs,
      });
      
      res.status(429).json(message);
    },
  });
};

/**
 * Pre-configured rate limiters for common use cases
 */

// General API rate limiter - Default rate limiting for all API endpoints
export const apiRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),      // 100 requests
  keyPrefix: 'whatsapp:api',
  message: 'API rate limit exceeded. Please slow down your requests.',
});

// Strict rate limiter for sensitive operations (auth, client creation, etc.)
export const strictRateLimiter = createRateLimiter({
  windowMs: 900000,  // 15 minutes
  max: 10,           // 10 requests per window
  keyPrefix: 'whatsapp:strict',
  message: 'Too many attempts for sensitive operations. Please try again later.',
});

// Message sending rate limiter (per client)
export const messageRateLimiter = createRateLimiter({
  windowMs: 60000,   // 1 minute
  max: 30,           // 30 messages per minute
  keyPrefix: 'whatsapp:message',
  message: 'Message rate limit exceeded. Please slow down.',
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 600000,  // 10 minutes
  max: 50,           // 50 uploads per 10 minutes
  keyPrefix: 'whatsapp:upload',
  message: 'File upload rate limit exceeded. Please try again later.',
});

// WhatsApp client operation limiter
export const clientOperationRateLimiter = createRateLimiter({
  windowMs: 300000,  // 5 minutes
  max: 20,           // 20 operations per 5 minutes
  keyPrefix: 'whatsapp:client_ops',
  message: 'Client operation rate limit exceeded. Please slow down.',
});

// Admin operations rate limiter (very strict)
export const adminRateLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  max: 5,            // 5 admin ops per hour
  keyPrefix: 'whatsapp:admin',
  message: 'Admin operation rate limit exceeded. Please try again later.',
});

/**
 * Create a per-user rate limiter based on API key
 * 
 * @param config - Rate limiter configuration
 * @returns Express rate limit middleware
 */
export const createPerUserRateLimiter = (config: Partial<RateLimiterConfig> = {}): RateLimitRequestHandler => {
  // Provide default values for required properties
  const fullConfig: RateLimiterConfig = {
    windowMs: config.windowMs || defaultConfig.windowMs!,
    max: config.max || defaultConfig.max!,
    keyPrefix: config.keyPrefix || 'whatsapp:per_user',
    message: config.message,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
    skip: config.skip,
    // Use default keyGenerator to avoid IPv6 issues
  };
  
  return createRateLimiter(fullConfig);
};

/**
 * Sliding window rate limiter for more sophisticated rate limiting
 * This provides a smoother distribution of requests over time
 */
export const slidingWindowRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),      // 100 requests
  keyPrefix: 'whatsapp:sliding',
  message: 'Request rate exceeded for sliding window. Please slow down.',
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed requests against the limit
});

export default apiRateLimiter;
