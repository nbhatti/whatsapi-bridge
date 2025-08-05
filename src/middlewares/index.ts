// Middlewares barrel export file
// This file serves as a central export point for all middlewares

// Authentication middleware
export { default as apiKeyAuth, optionalApiKeyAuth } from './auth';

// Rate limiting middleware
export {
  default as defaultRateLimiter,
  createRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  messageRateLimiter,
  uploadRateLimiter,
  clientOperationRateLimiter,
  adminRateLimiter,
  createPerUserRateLimiter,
  slidingWindowRateLimiter,
  skipRateLimit,
  type RateLimiterConfig,
} from './rateLimiter';

// Error handling middleware
export {
  default as errorHandler,
  notFoundHandler,
  uncaughtExceptionHandler,
  unhandledRejectionHandler,
} from './errorHandler';

// Validation middleware
export { validate } from '../config/validation';

// Socket.IO authentication middleware
export { socketAuth } from './socket.auth';
