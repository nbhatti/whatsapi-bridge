import { Request, Response, NextFunction } from 'express';
import { logError } from '../config/logger';

/**
 * Custom Error Interface
 * Extends the default Error object to include status, code, and other properties.
 */
interface AppError extends Error {
  status?: number;          // HTTP status code (e.g., 404, 500)
  code?: string;            // Custom error code (e.g., 'VALIDATION_ERROR')
  isOperational?: boolean;  // True for expected errors (e.g., user input)
  details?: any;            // Additional error details
}

/**
 * Centralized Error Handling Middleware
 * 
 * This middleware catches all errors that occur in the request pipeline and formats
 * a standardized JSON response. It logs the error stack using Winston for debugging.
 * 
 * @param err - The error object (can be a custom AppError or a standard Error)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (unused here, but required for Express error handlers)
 */
const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  // Set default values for the error
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.isOperational ? err.message : 'An unexpected error occurred. Please try again later.';
  
  // Log the error with details
  logError(
    `[${req.method}] ${req.originalUrl} - Status: ${status} - Code: ${code}`,
    {
      error: {
        message: err.message,
        stack: err.stack,
        isOperational: err.isOperational,
        details: err.details,
      },
      request: {
        ip: req.ip,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      },
    }
  );
  
  // Construct the response body
  const responseBody = {
    success: false,
    error: {
      message,
      code,
      status,
      // Include additional details in non-production environments
      ...(process.env.NODE_ENV !== 'production' && {
        originalError: err.message,
        stack: err.stack,
        details: err.details,
      }),
    },
  };
  
  // Send the error response
  res.status(status).json(responseBody);
};

/**
 * 404 Not Found Handler
 * 
 * This middleware should be placed at the end of the route stack to handle
 * requests for non-existent routes.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const status = 404;
  const message = `The requested resource was not found on this server.`;
  const code = 'NOT_FOUND';
  
  logError(
    `404 Not Found - [${req.method}] ${req.originalUrl}`,
    {
      request: {
        ip: req.ip,
        headers: req.headers,
      }
    }
  );

  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      status,
    },
  });
};

/**
 * Uncaught Exception Handler
 * 
 * This function should be registered at the application startup to handle
 * uncaught exceptions and prevent the server from crashing unexpectedly.
 */
export const uncaughtExceptionHandler = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logError('UNCAUGHT EXCEPTION! Shutting down...', error);
    // Perform cleanup if necessary and then exit
    // Example: close database connections, etc.
    process.exit(1);
  });
};

/**
 * Unhandled Rejection Handler
 * 
 * This function should be registered at the application startup to handle
 * unhandled promise rejections.
 */
export const unhandledRejectionHandler = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logError('UNHANDLED REJECTION! Shutting down...', reason);
    // Perform cleanup and exit
    process.exit(1);
  });
};

export default errorHandler;

