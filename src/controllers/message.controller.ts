import { Request, Response } from 'express';
import { MessageMedia, MessageSendOptions, Location } from 'whatsapp-web.js';
import { DeviceManager, MessageQueueService, DeviceHealthService } from '../services';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();
const messageQueueService = MessageQueueService.getInstance();
const deviceHealthService = DeviceHealthService.getInstance();

/**
 * Message Controller
 * Handles all message operations:
 * - Queue system for reliability and anti-blocking protection
 * - Advanced features like location sharing, quotes, mentions
 * - Complete message management including forwarding, deletion, and search
 */

/**
 * POST /api/v1/devices/:id/messages/send
 * Send messages with queue system and advanced features
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      to, 
      text, 
      media, 
      location, 
      quotedMessageId, 
      mentions, 
      type = 'text',
      priority = 'normal',
      useQueue = true,  // New option to choose queue vs direct
      enableTyping = true  // New option for typing indicator
    } = req.body;

    const device = deviceManager.getDevice(id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    // Device health check
    const safetyCheck = await deviceHealthService.isSafeToSendMessage(id);
    if (!safetyCheck.safe) {
      res.status(429).json({ 
        success: false, 
        error: 'Message sending blocked for device health protection.',
        reason: safetyCheck.reason,
        code: 'DEVICE_HEALTH_PROTECTION'
      });
      return;
    }

    // Validation
    if (!to || typeof to !== 'string' || to.trim() === '') {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid recipient: `to` must be a valid phone number or chat ID.' 
      });
      return;
    }

    // Format recipient properly
    let formattedTo = to.trim();
    if (!formattedTo.includes('@')) {
      formattedTo = `${formattedTo}@c.us`;
    }

    // Build message options
    const sendOptions: MessageSendOptions = {};
    
    // Handle quoted message
    if (quotedMessageId && typeof quotedMessageId === 'string' && quotedMessageId.trim() !== '') {
      sendOptions.quotedMessageId = quotedMessageId.trim();
    }
    
    // Handle mentions
    if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      const validMentions = mentions
        .filter(mention => mention && typeof mention === 'string' && mention.trim() !== '')
        .map(mention => {
          const trimmedMention = mention.trim();
          return !trimmedMention.includes('@') ? `${trimmedMention}@c.us` : trimmedMention;
        });
      
      if (validMentions.length > 0) {
        sendOptions.mentions = validMentions;
      }
    }

    // Determine message type and content
    let messageType: 'text' | 'media' | 'location' = 'text';
    let messageContent = '';
    let mediaData: string | undefined;
    let mediaType: string | undefined;

    if (location && location.latitude && location.longitude) {
      messageType = 'location';
      messageContent = JSON.stringify(location);
    } else if (media && media.data && typeof media.data === 'string' && media.data.trim() !== '') {
      messageType = 'media';
      messageContent = text || '';
      mediaData = media.data.trim();
      mediaType = media.mimetype || 'image/jpeg';
    } else if (text && typeof text === 'string' && text.trim() !== '') {
      messageType = 'text';
      messageContent = text.trim();
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid message: must provide valid text, media, or location data.' 
      });
      return;
    }

    let result;

    if (useQueue) {
      // Use queue system - Recommended for reliability
      const messageId = await messageQueueService.queueMessage({
        deviceId: id,
        to: formattedTo,
        type: messageType,
        content: messageContent,
        mediaBase64: mediaData,
        mediaType: mediaType,
        options: sendOptions,
        priority: priority as 'high' | 'normal' | 'low',
        maxAttempts: 3
      });

      const queueStatus = await messageQueueService.getQueueStatus();
      const deviceStatus = await messageQueueService.getDeviceStatus(id);
      
      result = {
        messageId,
        status: 'queued',
        queue: {
          pending: queueStatus.pending,
          processing: queueStatus.processing,
          deviceMessagesInLast60s: deviceStatus.messagesInLast60s
        }
      };

      res.status(202).json({ 
        success: true, 
        message: 'Message queued successfully',
        data: result
      });
    } else {
      // Direct sending
      if (device.status !== 'ready') {
        res.status(400).json({ 
          success: false, 
          error: `Device is not ready. Current status: ${device.status}` 
        });
        return;
      }

      let message;

      if (messageType === 'location') {
        const locationObj = new Location(
          location.latitude,
          location.longitude,
          location.description || ''
        );
        message = await device.client.sendMessage(formattedTo, locationObj, sendOptions);
      } else if (messageType === 'media') {
        const mediaObj = new MessageMedia(mediaType!, mediaData!, media.filename || 'media');
        if (messageContent) {
          sendOptions.caption = messageContent;
        }
        message = await device.client.sendMessage(formattedTo, mediaObj, sendOptions);
      } else {
        message = await device.client.sendMessage(formattedTo, messageContent, sendOptions);
      }
      
      result = {
        message,
        messageType,
        recipient: formattedTo,
        hasMentions: mentions && mentions.length > 0,
        isReply: !!quotedMessageId,
        status: 'sent'
      };

      res.status(201).json({ 
        success: true, 
        data: result 
      });
    }

    logInfo(`Message ${useQueue ? 'queued' : 'sent'} from device ${deviceManager.getFormattedDeviceId(id)} to ${formattedTo}`);

  } catch (error: any) {
    logError('Error in message sending:', error);
    res.status(500).json({
      success: false, 
      error: 'Failed to send message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Forward message
 */
export const forwardMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageId, to, fromChatId, useQueue = false } = req.body;

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    // Format recipient
    let formattedTo = to;
    if (!to.includes('@')) {
      formattedTo = `${to}@c.us`;
    }

    // Find the original message
    let originalMessage;
    if (fromChatId) {
      const sourceChat = await device.client.getChatById(fromChatId);
      const messages = await sourceChat.fetchMessages({ limit: 100 });
      originalMessage = messages.find(msg => msg.id._serialized === messageId);
    } else {
      // Search across all recent chats
      const chats = await device.client.getChats();
      for (const chat of chats.slice(0, 20)) {
        try {
          const messages = await chat.fetchMessages({ limit: 50 });
          originalMessage = messages.find(msg => msg.id._serialized === messageId);
          if (originalMessage) break;
        } catch (err) {
          continue;
        }
      }
    }

    if (!originalMessage) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    let forwardedMessage;
    if (useQueue) {
      // Queue the forward operation
      let content = '';
      let mediaData: string | undefined;
      let mediaType: string | undefined;

      if (originalMessage.hasMedia) {
        const media = await originalMessage.downloadMedia();
        mediaData = media.data;
        mediaType = media.mimetype;
        content = originalMessage.body || '';
      } else {
        content = `🔄 Forwarded\n\n${originalMessage.body || 'Empty message'}`;
      }

      const messageId = await messageQueueService.queueMessage({
        deviceId: id,
        to: formattedTo,
        type: originalMessage.hasMedia ? 'media' : 'text',
        content,
        mediaBase64: mediaData,
        mediaType: mediaType,
        options: {},
        priority: 'normal',
        maxAttempts: 3
      });

      res.json({ 
        success: true, 
        data: { messageId, status: 'queued' }
      });
    } else {
      // Direct forward
      forwardedMessage = await originalMessage.forward(formattedTo);
      res.json({ 
        success: true, 
        data: { 
          forwardedMessage,
          originalMessageId: messageId,
          recipient: formattedTo,
          status: 'sent'
        }
      });
    }

  } catch (error: any) {
    logError('Error forwarding message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to forward message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete message
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageId, forEveryone = false, fromChatId } = req.body;

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    // Find the message to delete
    let messageToDelete;
    if (fromChatId) {
      const chat = await device.client.getChatById(fromChatId);
      const messages = await chat.fetchMessages({ limit: 100 });
      messageToDelete = messages.find(msg => msg.id._serialized === messageId);
    } else {
      const chats = await device.client.getChats();
      for (const chat of chats.slice(0, 20)) {
        try {
          const messages = await chat.fetchMessages({ limit: 50 });
          messageToDelete = messages.find(msg => msg.id._serialized === messageId);
          if (messageToDelete) break;
        } catch (err) {
          continue;
        }
      }
    }

    if (!messageToDelete) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    const deleted = await messageToDelete.delete(forEveryone);
    
    res.json({ 
      success: true, 
      data: { 
        deleted, 
        messageId,
        forEveryone,
        timestamp: Date.now()
      }
    });

  } catch (error: any) {
    logError('Error deleting message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search messages
 */
export const searchMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { query, limit = 50, chatId } = req.query;

    if (!query) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    const searchResults: any[] = [];
    const queryLower = (query as string).toLowerCase();
    const searchLimit = Math.min(parseInt(limit as string) || 50, 100);

    if (chatId) {
      // Search within specific chat
      const chat = await device.client.getChatById(chatId as string);
      const messages = await chat.fetchMessages({ limit: searchLimit * 2 });
      
      for (const message of messages) {
        if (message.body && message.body.toLowerCase().includes(queryLower)) {
          searchResults.push({
            messageId: message.id._serialized,
            chatId: chat.id._serialized,
            chatName: chat.name || chat.id.user || 'Unknown',
            body: message.body,
            timestamp: message.timestamp,
            fromMe: message.fromMe,
            type: message.type
          });
          
          if (searchResults.length >= searchLimit) break;
        }
      }
    } else {
      // Search across all chats
      const chats = await device.client.getChats();
      
      for (const chat of chats.slice(0, 20)) {
        if (searchResults.length >= searchLimit) break;
        
        try {
          const messages = await chat.fetchMessages({ limit: 30 });
          
          for (const message of messages) {
            if (message.body && message.body.toLowerCase().includes(queryLower)) {
              searchResults.push({
                messageId: message.id._serialized,
                chatId: chat.id._serialized,
                chatName: chat.name || chat.id.user || 'Unknown',
                body: message.body,
                timestamp: message.timestamp,
                fromMe: message.fromMe,
                type: message.type
              });
              
              if (searchResults.length >= searchLimit) break;
            }
          }
        } catch (err) {
          continue;
        }
      }
    }

    res.json({
      success: true,
      data: searchResults,
      query: query,
      totalResults: searchResults.length,
      searchScope: chatId ? 'single_chat' : 'all_chats'
    });

  } catch (error: any) {
    logError('Error searching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search messages.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get message queue status for transparency
 */
export const getMessageStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageId } = req.query;

    const queueStatus = await messageQueueService.getQueueStatus();
    const deviceStatus = await messageQueueService.getDeviceStatus(id);
    const deviceHealth = await deviceHealthService.getDeviceHealth(id);
    const safetyCheck = await deviceHealthService.isSafeToSendMessage(id);

    res.json({
      success: true,
      data: {
        deviceId: id,
        messageId: messageId || null,
        queue: queueStatus,
        device: deviceStatus,
        health: deviceHealth ? {
          status: deviceHealth.status,
          score: deviceHealth.score,
          warnings: deviceHealth.warnings
        } : null,
        safety: safetyCheck,
        timestamp: Date.now()
      }
    });

  } catch (error: any) {
    logError('Error getting message status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get message status.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
