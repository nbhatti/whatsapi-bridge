import { Request, Response, NextFunction } from 'express';
import logger, { logWarn, logError } from '../config/logger';

/**
 * API Key Authentication Middleware
 * 
 * This middleware validates the x-api-key header against the API_KEY environment variable.
 * If the API key is missing, invalid, or doesn't match, it returns a 401 Unauthorized response.
 * 
 * Usage:
 * - Apply to routes that require API key authentication
 * - Ensure API_KEY is set in environment variables
 * 
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Express next function
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get API key from environment variables
    const expectedApiKey = process.env.API_KEY;
    
    // Check if API_KEY is configured
    if (!expectedApiKey) {
      logError('API_KEY environment variable is not configured');
      res.status(500).json({
        success: false,
        error: 'Server configuration error',
        code: 'CONFIG_ERROR'
      });
      return;
    }

    // Get API key from request headers
    const providedApiKey = req.headers['x-api-key'] as string;
    
    // Check if API key was provided
    if (!providedApiKey) {
      logWarn(`API key missing for ${req.method} ${req.path} from IP: ${req.ip}`);
      res.status(401).json({
        success: false,
        error: 'API key is required. Please provide a valid x-api-key header.',
        code: 'MISSING_API_KEY'
      });
      return;
    }

    // Validate API key
    if (providedApiKey !== expectedApiKey) {
      logWarn(`Invalid API key attempt for ${req.method} ${req.path} from IP: ${req.ip}`);
      res.status(401).json({
        success: false,
        error: 'Invalid API key provided.',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    // API key is valid, log successful authentication and proceed
    logger.debug(`Valid API key authenticated for ${req.method} ${req.path} from IP: ${req.ip}`);
    next();
    
  } catch (error) {
    logError('Error in API key authentication middleware', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional API Key Authentication Middleware
 * 
 * This middleware checks for API key authentication but doesn't block the request if it's missing.
 * It sets req.authenticated = true if a valid API key is provided.
 * Useful for endpoints that have different behavior based on authentication status.
 * 
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Express next function
 */
export const optionalApiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extend Request interface to include authenticated property
    (req as any).authenticated = false;
    
    const expectedApiKey = process.env.API_KEY;
    const providedApiKey = req.headers['x-api-key'] as string;
    
    // If API key is configured and provided, validate it
    if (expectedApiKey && providedApiKey) {
      if (providedApiKey === expectedApiKey) {
        (req as any).authenticated = true;
        logger.debug(`Optional API key authenticated for ${req.method} ${req.path} from IP: ${req.ip}`);
      } else {
        logWarn(`Invalid optional API key attempt for ${req.method} ${req.path} from IP: ${req.ip}`);
      }
    }
    
    next();
    
  } catch (error) {
    logError('Error in optional API key authentication middleware', error);
    // Continue with unauthenticated state rather than blocking the request
    (req as any).authenticated = false;
    next();
  }
};

export default apiKeyAuth;
