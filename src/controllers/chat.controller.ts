import { Request, Response } from 'express';
import { Message, MessageMedia, Location } from 'whatsapp-web.js';
import { DeviceManager } from '../services/DeviceManager';
import { logger } from '../config';
import { 
  getCachedChatList, 
  cacheChatList, 
  getCachedChatDetail, 
  cacheChatDetail, 
  CachedChat 
} from '../services/chatCache';
import { formatMessages } from '../utils/messageFormatter';

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

    // Check if client is properly initialized
    if (!device.client) {
      res.status(500).json({ 
        success: false, 
        error: 'WhatsApp client not initialized'
      });
      return;
    }

    const { summary, filter, limit, search, force_refresh } = req.query;
    let chats: any[] = [];
    let cacheUsed = false;
    
    // Try to get from cache first (unless force_refresh is requested)
    if (!force_refresh) {
      logger.debug(`Attempting to get cached chat list for device ${req.params.id}`);
      const cachedChatList = await getCachedChatList(req.params.id);
      
      if (cachedChatList) {
        logger.info(`Using cached chat list for device ${req.params.id} (${cachedChatList.chats.length} chats, cached at ${new Date(cachedChatList.cachedAt).toISOString()})`);
        chats = cachedChatList.chats;
        cacheUsed = true;
      }
    }
    
    // If no cache hit or force refresh, get fresh data from WhatsApp
    if (chats.length === 0) {
      logger.debug(`Fetching fresh chat list from WhatsApp for device ${req.params.id}`);
      const freshChats = await device.client.getChats();
      
      // Cache the fresh data
      await cacheChatList(req.params.id, freshChats);
      logger.info(`Cached ${freshChats.length} fresh chats for device ${req.params.id}`);
      
      // Convert to our format for consistency
      chats = freshChats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        archived: chat.archived || false,
        pinned: chat.pinned || false,
        muted: chat.isMuted || false,
        lastMessage: chat.lastMessage || null,
      }));
    }
    
    // Apply search filter if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      chats = chats.filter(chat => {
        // Search by name
        const name = (chat.name || '').toLowerCase();
        if (name.includes(searchLower)) return true;
        
        // Search by phone number (for individual chats)
        const chatId = chat.id; // Already normalized in cache or fresh data processing
        if (!chat.isGroup && chatId && chatId.includes(search)) return true;
        
        // Search in last message body
        if (chat.lastMessage?.body && chat.lastMessage.body.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply filter
    if (filter && typeof filter === 'string') {
      switch (filter) {
        case 'unread':
          chats = chats.filter(chat => chat.unreadCount > 0);
          break;
        case 'groups':
          chats = chats.filter(chat => chat.isGroup);
          break;
        case 'private':
          chats = chats.filter(chat => !chat.isGroup);
          break;
        case 'archived':
          chats = chats.filter(chat => chat.archived);
          break;
        case 'all':
        default:
          // No additional filtering
          break;
      }
    }
    
    if (summary) {
      // Return summary format with just essential info
      const limitNumber = typeof limit === 'string' ? parseInt(limit) : ((limit as unknown) as number) || 20;
      const chatSummary = chats.slice(0, limitNumber).map(chat => ({
        id: chat.id, // Already normalized
        name: chat.name || 'Unknown',
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
        returned: chatSummary.length,
        cached: cacheUsed,
        filters: {
          search: search || null,
          filter: filter || 'all'
        }
      });
    } else {
      // Return full chat objects
      const limitNumber = typeof limit === 'string' ? parseInt(limit) : undefined;
      const limitedChats = limitNumber ? chats.slice(0, limitNumber) : chats;
      
      res.json({ 
        success: true, 
        data: limitedChats,
        total: chats.length,
        returned: limitedChats.length,
        cached: cacheUsed,
        filters: {
          search: search || null,
          filter: filter || 'all'
        }
      });
    }
  } catch (error) {
    console.error('[DEBUG] Error listing chats:', error);
    logger.error('Error listing chats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to list chats',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
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

    const { limit, before, after } = req.query;
    const requestedLimit = Number(limit) || 20;
    
    // WhatsApp Web.js fetchMessages only supports limit and fromMe
    // For pagination, we need to fetch more messages and filter them
    let fetchLimit = requestedLimit;
    
    // If we have before/after, we need to fetch more messages to find the reference point
    if (before || after) {
      // Fetch up to 3x the requested limit to have room for filtering
      // This is a reasonable balance between performance and functionality
      fetchLimit = Math.min(requestedLimit * 3, 300);
    }

    const chat = await device.client.getChatById(req.params.chatId);
    const allMessages = await chat.fetchMessages({ limit: fetchLimit });
    
    let filteredMessages = allMessages;
    let foundReferenceIndex = -1;
    
    // Apply before filter (messages before the specified message ID)
    if (before && typeof before === 'string') {
      foundReferenceIndex = allMessages.findIndex(msg => msg.id._serialized === before);
      if (foundReferenceIndex !== -1) {
        // Get messages before the reference message (older messages)
        filteredMessages = allMessages.slice(foundReferenceIndex + 1);
      } else {
        // Reference message not found, return empty result with info
        res.json({ 
          success: true, 
          data: [],
          pagination: {
            total: 0,
            returned: 0,
            requestedLimit,
            hasMore: false,
            referenceFound: false,
            referenceType: 'before',
            referenceId: before
          }
        });
        return;
      }
    }
    
    // Apply after filter (messages after the specified message ID)
    if (after && typeof after === 'string') {
      foundReferenceIndex = filteredMessages.findIndex(msg => msg.id._serialized === after);
      if (foundReferenceIndex !== -1) {
        // Get messages after the reference message (newer messages)
        filteredMessages = filteredMessages.slice(0, foundReferenceIndex);
      } else {
        // Reference message not found, return empty result with info
        res.json({ 
          success: true, 
          data: [],
          pagination: {
            total: 0,
            returned: 0,
            requestedLimit,
            hasMore: false,
            referenceFound: false,
            referenceType: 'after',
            referenceId: after
          }
        });
        return;
      }
    }
    
    // Apply limit
    const limitedMessages = filteredMessages.slice(0, requestedLimit);
    
    // Format messages with enhanced details including media information
    const formattedMessages = await formatMessages(limitedMessages, req.params.id);
    
    // Determine if there are more messages available
    const hasMore = filteredMessages.length > requestedLimit || 
                    (fetchLimit === 300 && allMessages.length === 300); // Hit our fetch limit
    
    // Generate pagination cursors for next requests
    const firstMessage = limitedMessages[0];
    const lastMessage = limitedMessages[limitedMessages.length - 1];
    
    const pagination = {
      total: filteredMessages.length,
      returned: formattedMessages.length,
      requestedLimit,
      hasMore,
      referenceFound: before || after ? foundReferenceIndex !== -1 : true,
      referenceType: before ? 'before' : after ? 'after' : null,
      referenceId: (before || after) as string || null,
      cursors: {
        // For getting newer messages (use 'after' with first message ID)
        newer: firstMessage ? {
          after: firstMessage.id._serialized,
          url: `/api/v1/devices/${req.params.id}/chats/${req.params.chatId}/messages?limit=${requestedLimit}&after=${firstMessage.id._serialized}`
        } : null,
        // For getting older messages (use 'before' with last message ID)
        older: lastMessage && hasMore ? {
          before: lastMessage.id._serialized,
          url: `/api/v1/devices/${req.params.id}/chats/${req.params.chatId}/messages?limit=${requestedLimit}&before=${lastMessage.id._serialized}`
        } : null
      }
    };
    
    res.json({ 
      success: true, 
      data: formattedMessages,
      pagination
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
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

    const { to, text, media, quotedMessageId, mentions, location } = req.body;
    
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
    
    // Handle location messages
    if (location && location.latitude && location.longitude) {
      const locationMessage = new Location(location.latitude, location.longitude, location.description || '');
      message = await device.client.sendMessage(to, locationMessage, messageOptions);
    } else if (media) {
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

/**
 * Send location message
 */
export const sendLocation = async (req: Request, res: Response): Promise<void> => {
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

    const { to, latitude, longitude, description } = req.body;
    
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid coordinates. Latitude and longitude must be numbers.' 
      });
      return;
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' 
      });
      return;
    }
    
    const location = new Location(latitude, longitude, description || '');
    const message = await device.client.sendMessage(to, location);
    
    res.json({ 
      success: true, 
      data: {
        ...message,
        location: {
          latitude,
          longitude,
          description: description || null
        }
      } 
    });
  } catch (error) {
    logger.error('Error sending location:', error);
    res.status(500).json({ success: false, error: 'Failed to send location' });
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

/**
 * Search for chats with simplified response format
 */
export const searchChats = async (req: Request, res: Response): Promise<void> => {
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

    const { q: query, limit } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Search query (q) is required' 
      });
      return;
    }

    // Use the existing listChats logic but with simplified response
    const { summary, filter, search, force_refresh } = {
      summary: false,
      filter: 'all',
      search: query,
      force_refresh: false
    };
    
    let chats: any[] = [];
    
    // Try to get from cache first
    const cachedChatList = await getCachedChatList(req.params.id);
    
    if (cachedChatList) {
      chats = cachedChatList.chats;
    } else {
      // Get fresh data from WhatsApp
      const freshChats = await device.client.getChats();
      
      // Cache the fresh data
      await cacheChatList(req.params.id, freshChats);
      
      // Convert to our format
      chats = freshChats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user || 'Unknown',
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        archived: chat.archived || false,
        pinned: chat.pinned || false,
        muted: chat.isMuted || false,
        lastMessage: chat.lastMessage || null,
      }));
    }
    
    // Apply search filter
    const searchLower = query.toLowerCase();
    const filteredChats = chats.filter(chat => {
      // Search by name
      const name = (chat.name || '').toLowerCase();
      if (name.includes(searchLower)) return true;
      
      // Search by phone number (for individual chats)
      const chatId = chat.id;
      if (!chat.isGroup && chatId && chatId.includes(query)) return true;
      
      // Search in last message body
      if (chat.lastMessage?.body && chat.lastMessage.body.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    const limitNumber = typeof limit === 'string' ? parseInt(limit) : 10;
    const results = filteredChats.slice(0, limitNumber).map(chat => ({
      id: chat.id,
      name: chat.name || 'Unknown',
      type: chat.isGroup ? 'group' : 'private',
      unread: chat.unreadCount || 0,
      lastMessage: chat.lastMessage?.body || null,
      timestamp: chat.timestamp || null,
      getDetailsUrl: `/api/v1/devices/${req.params.id}/chats/${encodeURIComponent(chat.id)}`
    }));
    
    res.json({
      success: true,
      query: query,
      found: results.length,
      total: filteredChats.length,
      results: results
    });
  } catch (error) {
    logger.error('Error searching chats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search chats',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
};

/**
 * Mark all messages in a chat as read
 */
export const markChatAsRead = async (req: Request, res: Response): Promise<void> => {
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

    // Check if client is properly initialized
    if (!device.client) {
      res.status(500).json({ 
        success: false, 
        error: 'WhatsApp client not initialized'
      });
      return;
    }

    // Validate chat ID format
    const chatId = req.params.chatId;
    if (!chatId || (!chatId.includes('@c.us') && !chatId.includes('@g.us'))) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid chat ID format. Expected format: number@c.us or number@g.us'
      });
      return;
    }

    let chat;
    let initialUnreadCount = 0;
    
    try {
      chat = await device.client.getChatById(chatId);
      initialUnreadCount = chat.unreadCount || 0;
    } catch (chatError: any) {
      logger.error('Error getting chat for mark as read:', chatError);
      
      // Check for session-related errors
      if (chatError.message?.includes('Session closed') || 
          chatError.message?.includes('Evaluation failed') ||
          chatError.message?.includes('Protocol error')) {
        res.status(500).json({ 
          success: false, 
          error: 'WhatsApp session is closed or invalid. Please reconnect the device.',
          sessionError: true,
          details: process.env.NODE_ENV === 'development' ? chatError.message : undefined
        });
        return;
      }
      
      // Chat not found
      res.status(404).json({ 
        success: false, 
        error: 'Chat not found or inaccessible'
      });
      return;
    }
    
    // Mark all messages in the chat as read using sendSeen()
    try {
      await chat.sendSeen();
      logger.info(`Marked chat ${chatId} as read (had ${initialUnreadCount} unread messages)`);
    } catch (sendSeenError: any) {
      logger.error('Error calling sendSeen():', sendSeenError);
      
      // Check for session-related errors
      if (sendSeenError.message?.includes('Session closed') || 
          sendSeenError.message?.includes('Evaluation failed') ||
          sendSeenError.message?.includes('Protocol error')) {
        res.status(500).json({ 
          success: false, 
          error: 'WhatsApp session is closed or invalid. Please reconnect the device.',
          sessionError: true,
          details: process.env.NODE_ENV === 'development' ? sendSeenError.message : undefined
        });
        return;
      }
      
      throw sendSeenError; // Re-throw non-session errors
    }
    
    // Wait a moment for WhatsApp to process the read status
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Invalidate chat cache for this device to force fresh data
    try {
      const { invalidateDeviceCache } = await import('../services/chatCache');
      await invalidateDeviceCache(req.params.id);
    } catch (cacheError) {
      logger.warn('Failed to invalidate device cache:', cacheError);
      // Continue execution - cache invalidation failure is not critical
    }
    
    // Get fresh chat info to return current unread count
    let finalUnreadCount = 0;
    try {
      const updatedChat = await device.client.getChatById(chatId);
      finalUnreadCount = updatedChat.unreadCount || 0;
    } catch (chatError) {
      // If we can't get updated chat info, assume it worked
      logger.warn('Could not get updated chat info after marking as read:', chatError);
      finalUnreadCount = 0;
    }
    
    res.json({ 
      success: true, 
      message: 'Chat marked as read successfully',
      data: {
        chatId,
        initialUnreadCount,
        unreadCount: finalUnreadCount,
        markedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error marking chat as read:', error);
    
    // Check for session-related errors at top level
    if (error.message?.includes('Session closed') || 
        error.message?.includes('Evaluation failed') ||
        error.message?.includes('Protocol error')) {
      res.status(500).json({ 
        success: false, 
        error: 'WhatsApp session is closed or invalid. Please reconnect the device.',
        sessionError: true,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark chat as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark a specific message as read
 * Note: WhatsApp Web.js doesn't support marking individual messages as read,
 * so this will mark all messages in the chat as read up to the specified message
 */
export const markMessageAsRead = async (req: Request, res: Response): Promise<void> => {
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

    const { messageId } = req.params;
    
    // Get the message to verify it exists
    const chat = await device.client.getChatById(req.params.chatId);
    const messages = await chat.fetchMessages({ limit: 100 });
    const messageToMarkRead = messages.find(msg => msg.id._serialized === messageId);
    
    if (!messageToMarkRead) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    // WhatsApp Web.js doesn't support marking individual messages as read,
    // so we mark the entire chat as read (which includes the specified message)
    await chat.sendSeen();
    
    res.json({ 
      success: true, 
      message: 'Message marked as read successfully (all messages in chat marked as read)',
      data: {
        chatId: req.params.chatId,
        messageId: messageId,
        markedAt: new Date().toISOString(),
        note: 'WhatsApp Web.js marks all messages in chat as read, not individual messages'
      }
    });
  } catch (error) {
    logger.error('Error marking message as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark message as read',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  }
};
