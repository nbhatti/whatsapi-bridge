import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'next-rate-limit';

// Configuration for different types of rate limits
const rateLimitConfig = {
  // General API rate limit - 100 requests per 15 minutes
  general: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // Auth endpoints - 5 requests per 15 minutes (stricter)
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
    message: 'Too many authentication attempts, please try again later.',
  },
  
  // Heavy operations (AI chat, file uploads) - 20 requests per 15 minutes
  heavy: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: 20,
    message: 'Too many heavy operations, please try again later.',
  },
};

// Create rate limiters
export const generalRateLimit = rateLimit({
  interval: rateLimitConfig.general.windowMs,
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per window
});

export const authRateLimit = rateLimit({
  interval: rateLimitConfig.auth.windowMs,
  uniqueTokenPerInterval: 500,
});

export const heavyRateLimit = rateLimit({
  interval: rateLimitConfig.heavy.windowMs,
  uniqueTokenPerInterval: 500,
});

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return request.ip || 'unknown';
}

// Rate limiting middleware factory
export function createRateLimitMiddleware(
  type: 'general' | 'auth' | 'heavy' = 'general'
) {
  return async function rateLimitMiddleware(request: NextRequest) {
    // Skip rate limiting in development if disabled
    if (process.env.DISABLE_RATE_LIMITING === 'true') {
      return null;
    }
    
    const ip = getClientIP(request);
    const config = rateLimitConfig[type];
    
    let limiter;
    switch (type) {
      case 'auth':
        limiter = authRateLimit;
        break;
      case 'heavy':
        limiter = heavyRateLimit;
        break;
      default:
        limiter = generalRateLimit;
    }
    
    try {
      await limiter.check(config.max, ip);
      return null; // No rate limit exceeded
    } catch (error) {
      console.warn(`Rate limit exceeded for IP: ${ip}, type: ${type}`);
      return NextResponse.json(
        { 
          error: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000), // seconds
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Window': config.windowMs.toString(),
          },
        }
      );
    }
  };
}

// Wrapper function to easily apply rate limiting to API routes
export function withRateLimit<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse | Response>,
  type: 'general' | 'auth' | 'heavy' = 'general'
) {
  const rateLimitMiddleware = createRateLimitMiddleware(type);
  
  return async function rateLimitedHandler(request: NextRequest, ...args: T) {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Proceed with the original handler
    return handler(request, ...args);
  };
}
