import { Request, Response } from 'express';
import { DeviceManager } from '../services/DeviceManager';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();

/**
 * Download media from a message
 * GET /api/v1/devices/:id/messages/:messageId/media/download
 */
export const downloadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    
    const device = deviceManager.getDevice(id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    if (device.status !== 'ready') {
      res.status(400).json({ 
        success: false, 
        error: `Device is not ready. Current status: ${device.status}`,
        currentStatus: device.status
      });
      return;
    }

    // Find the message across recent chats
    let targetMessage = null;
    let sourceChat = null;

    try {
      // Try to find the message by searching recent chats
      const chats = await device.client.getChats();
      
      for (const chat of chats.slice(0, 50)) { // Search in recent 50 chats
        try {
          const messages = await chat.fetchMessages({ limit: 100 });
          const message = messages.find(msg => msg.id._serialized === messageId);
          
          if (message) {
            targetMessage = message;
            sourceChat = chat;
            break;
          }
        } catch (error) {
          // Continue searching in other chats if this one fails
          continue;
        }
      }
    } catch (error) {
      logError('Error searching for message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search for message' 
      });
      return;
    }

    if (!targetMessage) {
      res.status(404).json({ 
        success: false, 
        error: 'Message not found or not accessible' 
      });
      return;
    }

    if (!targetMessage.hasMedia) {
      res.status(400).json({ 
        success: false, 
        error: 'Message does not contain media' 
      });
      return;
    }

    try {
      // Download the media
      logInfo(`Downloading media for message ${messageId} from device ${id}`);
      const media = await targetMessage.downloadMedia();
      
      if (!media) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to download media' 
        });
        return;
      }

      // Convert base64 to buffer
      const mediaBuffer = Buffer.from(media.data, 'base64');
      
      // Set appropriate headers
      res.set({
        'Content-Type': media.mimetype || 'application/octet-stream',
        'Content-Length': mediaBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${media.filename || 'media'}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      });

      logInfo(`Media downloaded successfully for message ${messageId}, size: ${mediaBuffer.length} bytes, type: ${media.mimetype}`);
      
      // Send the media buffer
      res.send(mediaBuffer);
      
    } catch (error) {
      logError('Error downloading media:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to download media',
        details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
      });
    }

  } catch (error) {
    logError('Error in downloadMedia controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
};

/**
 * Get media thumbnail (for images and videos)
 * GET /api/v1/devices/:id/messages/:messageId/media/thumbnail
 */
export const getMediaThumbnail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    
    const device = deviceManager.getDevice(id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    if (device.status !== 'ready') {
      res.status(400).json({ 
        success: false, 
        error: `Device is not ready. Current status: ${device.status}`,
        currentStatus: device.status
      });
      return;
    }

    // Find the message
    let targetMessage = null;

    try {
      const chats = await device.client.getChats();
      
      for (const chat of chats.slice(0, 50)) {
        try {
          const messages = await chat.fetchMessages({ limit: 100 });
          const message = messages.find(msg => msg.id._serialized === messageId);
          
          if (message) {
            targetMessage = message;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      logError('Error searching for message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search for message' 
      });
      return;
    }

    if (!targetMessage) {
      res.status(404).json({ 
        success: false, 
        error: 'Message not found' 
      });
      return;
    }

    if (!targetMessage.hasMedia) {
      res.status(400).json({ 
        success: false, 
        error: 'Message does not contain media' 
      });
      return;
    }

    // Only certain media types support thumbnails
    if (!['image', 'video', 'document'].includes(targetMessage.type)) {
      res.status(400).json({ 
        success: false, 
        error: 'Media type does not support thumbnails' 
      });
      return;
    }

    try {
      // Try to get thumbnail if available
      const media = await targetMessage.downloadMedia();
      
      if (!media) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to download media for thumbnail' 
        });
        return;
      }

      // For images, return a smaller version (or the original if it's already small)
      // For videos, WhatsApp usually provides a thumbnail automatically
      // For documents, we might not have a thumbnail
      
      if (targetMessage.type === 'image') {
        // Return the image (could be optimized to create actual thumbnails)
        const mediaBuffer = Buffer.from(media.data, 'base64');
        
        res.set({
          'Content-Type': media.mimetype || 'image/jpeg',
          'Content-Length': mediaBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        });

        res.send(mediaBuffer);
      } else if (targetMessage.type === 'video') {
        // For videos, try to get thumbnail or return a placeholder
        const mediaBuffer = Buffer.from(media.data, 'base64');
        
        // Note: WhatsApp Web.js doesn't provide separate thumbnail extraction
        // This would return the first frame or a placeholder
        res.set({
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        });

        // For now, return a placeholder response
        res.status(501).json({ 
          success: false, 
          error: 'Video thumbnail extraction not implemented yet',
          message: 'Use the full media download endpoint instead'
        });
      } else {
        // For documents and other types, return placeholder or error
        res.status(404).json({ 
          success: false, 
          error: 'No thumbnail available for this media type' 
        });
      }

    } catch (error) {
      logError('Error getting media thumbnail:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get media thumbnail',
        details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
      });
    }

  } catch (error) {
    logError('Error in getMediaThumbnail controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
};

/**
 * Get media information without downloading
 * GET /api/v1/devices/:id/messages/:messageId/media/info
 */
export const getMediaInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    
    const device = deviceManager.getDevice(id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    if (device.status !== 'ready') {
      res.status(400).json({ 
        success: false, 
        error: `Device is not ready. Current status: ${device.status}`,
        currentStatus: device.status
      });
      return;
    }

    // Find the message
    let targetMessage = null;

    try {
      const chats = await device.client.getChats();
      
      for (const chat of chats.slice(0, 50)) {
        try {
          const messages = await chat.fetchMessages({ limit: 100 });
          const message = messages.find(msg => msg.id._serialized === messageId);
          
          if (message) {
            targetMessage = message;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      logError('Error searching for message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search for message' 
      });
      return;
    }

    if (!targetMessage) {
      res.status(404).json({ 
        success: false, 
        error: 'Message not found' 
      });
      return;
    }

    if (!targetMessage.hasMedia) {
      res.status(400).json({ 
        success: false, 
        error: 'Message does not contain media' 
      });
      return;
    }

    // Return basic media info without downloading
    const mediaInfo: any = {
      messageId: targetMessage.id._serialized,
      hasMedia: targetMessage.hasMedia,
      type: targetMessage.type,
      downloadUrl: `/api/v1/devices/${id}/messages/${messageId}/media/download`,
      thumbnailUrl: `/api/v1/devices/${id}/messages/${messageId}/media/thumbnail`,
      infoUrl: `/api/v1/devices/${id}/messages/${messageId}/media/info`,
    };

    // Add duration for audio messages if available
    if (targetMessage.type === 'audio' || targetMessage.type === 'ptt') {
      try {
        mediaInfo.duration = (targetMessage as any).duration || null;
      } catch (e) {
        // Duration not available
      }
    }

    res.json({ 
      success: true, 
      data: mediaInfo 
    });

  } catch (error) {
    logError('Error in getMediaInfo controller:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
};
