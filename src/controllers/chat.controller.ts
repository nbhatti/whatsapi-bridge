import { Request, Response } from 'express';
import { Message, MessageMedia } from 'whatsapp-web.js';
import { DeviceManager } from '../services/DeviceManager';
import { logger } from '../config';

export const listChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const { summary, filter, limit } = req.query;
    const chats = await device.client.getChats();
    
    if (summary) {
      // Return summary format with just essential info
      const limitNumber = typeof limit === 'string' ? parseInt(limit) : ((limit as unknown) as number) || 20;
      const chatSummary = chats.slice(0, limitNumber).map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: {
          body: chat.lastMessage?.body || '',
          timestamp: chat.lastMessage?.timestamp || null,
          fromMe: chat.lastMessage?.fromMe || false
        },
        timestamp: chat.timestamp,
        archived: chat.archived || false,
        pinned: chat.pinned || false,
        muted: chat.isMuted || false
      }));
      
      res.json({ 
        success: true, 
        data: chatSummary,
        total: chats.length,
        returned: chatSummary.length
      });
    } else {
      // Return full chat objects
      res.json({ success: true, data: chats });
    }
  } catch (error) {
    logger.error('Error listing chats:', error);
    res.status(500).json({ success: false, error: 'Failed to list chats' });
  }
};

export const getChatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const chat = await device.client.getChatById(req.params.chatId);
    res.json({ success: true, data: chat });
  } catch (error) {
    logger.error('Error getting chat by ID:', error);
    res.status(500).json({ success: false, error: 'Failed to get chat' });
  }
};

export const fetchMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
    
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

    const chat = await device.client.getChatById(req.params.chatId);
    const messages = await chat.fetchMessages({ limit: Number(req.query.limit) || 20 });
    res.json({ success: true, data: messages });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const { to, text, media, quotedMessageId, mentions } = req.body;
    
    // Build message options
    const messageOptions: any = {};
    
    // Handle quoted messages (replies)
    if (quotedMessageId) {
      // Find the message to quote
      const chat = await device.client.getChatById(to);
      const messages = await chat.fetchMessages({ limit: 100 });
      const quotedMessage = messages.find(msg => msg.id._serialized === quotedMessageId);
      
      if (quotedMessage) {
        messageOptions.quotedMessageId = quotedMessage.id._serialized;
      }
    }
    
    // Handle mentions
    if (mentions && mentions.length > 0) {
      messageOptions.mentions = mentions;
    }
    
    let message;
    if (media) {
      const messageMedia = new MessageMedia(media.mimetype, media.data, media.filename);
      message = await device.client.sendMessage(to, messageMedia, { 
        caption: text,
        ...messageOptions
      });
    } else {
      message = await device.client.sendMessage(to, text, messageOptions);
    }
    
    res.json({ success: true, data: message });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const chat = await device.client.getChatById(req.params.chatId);
    await chat.delete();
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    logger.error('Error deleting chat:', error);
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
};

export const clearChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const chat = await device.client.getChatById(req.params.chatId);
    await chat.clearMessages();
    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    logger.error('Error clearing chat:', error);
    res.status(500).json({ success: false, error: 'Failed to clear chat' });
  }
};

export const archiveChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const chat = await device.client.getChatById(req.params.chatId);
    await chat.archive();
    res.json({ success: true, message: 'Chat archived successfully' });
  } catch (error) {
    logger.error('Error archiving chat:', error);
    res.status(500).json({ success: false, error: 'Failed to archive chat' });
  }
};

export const unarchiveChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const chat = await device.client.getChatById(req.params.chatId);
    await chat.unarchive();
    res.json({ success: true, message: 'Chat unarchived successfully' });
  } catch (error) {
    logger.error('Error unarchiving chat:', error);
    res.status(500).json({ success: false, error: 'Failed to unarchive chat' });
  }
};

export const forwardMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const { messageId, to } = req.body;
    
    // First get the original message
    const chat = await device.client.getChatById(req.params.chatId);
    const messages = await chat.fetchMessages({ limit: 100 });
    const originalMessage = messages.find(msg => msg.id._serialized === messageId);
    
    if (!originalMessage) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    // Forward the message using the built-in forward method
    await originalMessage.forward(to);
    
    // Wait a moment for the message to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the forwarded message from the recipient chat
    const recipientChat = await device.client.getChatById(to);
    const recentMessages = await recipientChat.fetchMessages({ limit: 1 });
    const forwardedMessage = recentMessages[0];
    
    res.json({ success: true, data: forwardedMessage });
  } catch (error) {
    logger.error('Error forwarding message:', error);
    res.status(500).json({ success: false, error: 'Failed to forward message' });
  }
};

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceManager = DeviceManager.getInstance();
    const device = deviceManager.getDevice(req.params.id);
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

    const { messageId, forEveryone } = req.body;
    
    // Get the message
    const chat = await device.client.getChatById(req.params.chatId);
    const messages = await chat.fetchMessages({ limit: 100 });
    const messageToDelete = messages.find(msg => msg.id._serialized === messageId);
    
    if (!messageToDelete) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    // Delete the message
    const deleted = await messageToDelete.delete(forEveryone || false);
    res.json({ success: true, data: { deleted, messageId } });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
};
