import { Socket } from 'socket.io';
import { logger } from '../config';
import { ExtendedError } from 'socket.io/dist/namespace';

/**
 * Socket.IO authentication middleware
 * Validates the apiKey query parameter
 */
export const socketAuth = (socket: Socket, next: (err?: ExtendedError) => void): void => {
  try {
    const expectedApiKey = process.env.API_KEY;
    
    if (!expectedApiKey) {
      logger.error('API_KEY environment variable is not configured for socket authentication');
      return next(new Error('Server configuration error'));
    }

    const providedApiKey = socket.handshake.query.apiKey as string;
    
    if (!providedApiKey) {
      logger.warn(`Socket authentication failed - API key missing for socket: ${socket.id}`);
      return next(new Error('API key is required'));
    }

    if (providedApiKey !== expectedApiKey) {
      logger.warn(`Socket authentication failed - Invalid API key for socket: ${socket.id}`);
      return next(new Error('Invalid API key'));
    }

    logger.debug(`Socket authenticated successfully: ${socket.id}`);
    next();
  } catch (error) {
    logger.error('Error in socket authentication middleware:', error);
    next(new Error('Authentication error'));
  }
};
