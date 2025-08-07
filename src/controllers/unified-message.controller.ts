import { Request, Response } from 'express';
import { MessageMedia, MessageSendOptions, Location } from 'whatsapp-web.js';
import { DeviceManager } from '../services/DeviceManager';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();

/**
 * Unified Message Controller - Handles all message operations
 */

/**
 * POST /api/v1/devices/:id/messages/send
 * Unified message sending endpoint - supports text, media, location, quotes, mentions, etc.
 */
export const sendUnifiedMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      to, 
      text, 
      media, 
      location, 
      quotedMessageId, 
      mentions, 
      type = 'text' 
    } = req.body;

    logInfo(`Sending unified message from device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready to send messages.' });
      return;
    }

    // Format recipient properly
    let formattedTo = to;
    if (!to.includes('@')) {
      formattedTo = `${to}@c.us`;
    }

    // Build message options
    const sendOptions: MessageSendOptions = {};
    
    // Handle quoted message
    if (quotedMessageId) {
      sendOptions.quotedMessageId = quotedMessageId;
      logInfo(`Replying to message: ${quotedMessageId}`);
    }
    
    // Handle mentions
    if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      // Format mentions properly
      const formattedMentions = mentions.map(mention => {
        if (typeof mention === 'string') {
          // If it's a phone number, format it
          if (!mention.includes('@')) {
            return `${mention}@c.us`;
          }
          return mention;
        }
        return mention;
      });
      
      sendOptions.mentions = formattedMentions;
      logInfo(`Message includes ${formattedMentions.length} mentions: ${formattedMentions.join(', ')}`);
    }

    let message;
    let messageContent;

    // Handle different message types
    if (location && location.latitude && location.longitude) {
      // Location message
      const locationObj = new Location(
        location.latitude,
        location.longitude,
        location.description || ''
      );
      messageContent = locationObj;
      message = await device.client.sendMessage(formattedTo, messageContent, sendOptions);
      logInfo(`Location message sent to ${formattedTo}`);
    } else if (media && media.data) {
      // Media message
      const mediaObj = new MessageMedia(
        media.mimetype || 'image/jpeg',
        media.data,
        media.filename || 'media'
      );
      messageContent = mediaObj;
      if (text) {
        sendOptions.caption = text;
      }
      message = await device.client.sendMessage(formattedTo, messageContent, sendOptions);
      logInfo(`Media message (${media.mimetype}) sent to ${formattedTo}`);
    } else if (text) {
      // Text message
      messageContent = text;
      message = await device.client.sendMessage(formattedTo, messageContent, sendOptions);
      logInfo(`Text message sent to ${formattedTo}`);
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid message: must provide text, media, or location data.' 
      });
      return;
    }

    res.status(201).json({ 
      success: true, 
      data: {
        message,
        messageType: location ? 'location' : media ? 'media' : 'text',
        recipient: formattedTo,
        hasMentions: mentions && mentions.length > 0,
        mentionCount: mentions ? mentions.length : 0,
        isReply: !!quotedMessageId
      }
    });

  } catch (error: any) {
    logError('Error sending unified message:', error);
    logInfo(`Failed to send message to ${req.body.to}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/v1/devices/:id/messages/forward
 * Forward a message with proper forwarded indicator
 */
export const forwardMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageId, to, fromChatId } = req.body;

    logInfo(`Forwarding message from device ${id}`);

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

    // Get the original message from the source chat
    let originalMessage;
    if (fromChatId) {
      try {
        const sourceChat = await device.client.getChatById(fromChatId);
        const messages = await sourceChat.fetchMessages({ limit: 100 });
        originalMessage = messages.find(msg => msg.id._serialized === messageId);
      } catch (error: any) {
        logError(`Failed to get source chat ${fromChatId}:`, error);
        res.status(404).json({ success: false, error: 'Source chat not found' });
        return;
      }
    } else {
      // Search across all recent chats
      const chats = await device.client.getChats();
      for (const chat of chats.slice(0, 20)) {
        try {
          const messages = await chat.fetchMessages({ limit: 50 });
          originalMessage = messages.find(msg => msg.id._serialized === messageId);
          if (originalMessage) {
            logInfo(`Found message in chat: ${chat.id._serialized}`);
            break;
          }
        } catch (err) {
          continue; // Skip chats that can't be accessed
        }
      }
    }

    if (!originalMessage) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    // Ensure destination chat exists
    let destChat;
    try {
      destChat = await device.client.getChatById(formattedTo);
    } catch (error: any) {
      // If chat doesn't exist, try to create it by sending an initial message
      try {
        logInfo(`Destination chat ${formattedTo} not found, creating it...`);
        await device.client.sendMessage(formattedTo, 'Chat initialized for forwarding.');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for chat to be created
        destChat = await device.client.getChatById(formattedTo);
      } catch (createError: any) {
        logError(`Failed to create destination chat ${formattedTo}:`, createError);
        res.status(400).json({ success: false, error: 'Cannot create destination chat' });
        return;
      }
    }

    // Analyze original message for forwarding context
    const originalFromMe = originalMessage.fromMe;
    const originalAuthor = originalMessage.author || originalMessage.from;
    const isOriginalAlreadyForwarded = originalMessage.isForwarded || originalMessage.forwardingScore > 0;
    const isSelfForwarding = originalFromMe && (fromChatId === formattedTo);
    
    logInfo(`Original message context: fromMe=${originalFromMe}, author=${originalAuthor}, isForwarded=${isOriginalAlreadyForwarded}, isSelfForwarding=${isSelfForwarding}`);

    // Different forwarding approaches for better compatibility
    let forwardedMessage;
    let forwardMethod = 'unknown';
    let willShowForwardedIndicator = false;
    
    try {
      // Method 1: Direct forward (preserves forwarded indicator when appropriate)
      logInfo(`Attempting direct forward to ${formattedTo}`);
      forwardedMessage = await originalMessage.forward(formattedTo);
      forwardMethod = 'native_forward';
      
      // WhatsApp will show forwarded indicator if:
      // 1. Original message was already forwarded, OR
      // 2. Forwarding to a different chat and original is from different author
      willShowForwardedIndicator = isOriginalAlreadyForwarded || 
        (!isSelfForwarding && originalAuthor !== device.client.info.wid._serialized);
        
      logInfo(`Message forwarded using direct method from ${id} to ${formattedTo}. Expected forwarded indicator: ${willShowForwardedIndicator}`);
    } catch (error: any) {
      logInfo(`Direct forward failed, trying alternative method: ${error.message}`);
      
      // Method 2: Alternative forward approach with explicit forwarded prefix
      try {
        // Use chat.sendMessage with forwarding options and explicit forwarded prefix
        if (originalMessage.hasMedia) {
          // For media messages
          logInfo('Forwarding media message with alternative method');
          const media = await originalMessage.downloadMedia();
          forwardedMessage = await destChat.sendMessage(media, {
            caption: originalMessage.body ? `🔄 Forwarded\n\n${originalMessage.body}` : '🔄 Forwarded'
          });
        } else {
          // For text messages, add forwarded prefix
          logInfo('Forwarding text message with alternative method');
          forwardedMessage = await destChat.sendMessage(`🔄 Forwarded\n\n${originalMessage.body || 'Empty message'}`);
        }
        forwardMethod = 'manual_prefix';
        willShowForwardedIndicator = true; // Our manual prefix ensures it's visible
        logInfo(`Message forwarded using alternative method from ${id} to ${formattedTo}`);
      } catch (altError: any) {
        logError('Alternative forward method also failed:', altError);
        throw new Error(`All forwarding methods failed: ${altError.message}`);
      }
    }

    // Wait a moment and check the actual forwarded message properties
    await new Promise(resolve => setTimeout(resolve, 1000));
    let actualForwardedProperties = { isForwarded: null, forwardingScore: 0 };
    
    try {
      const recentMessages = await destChat.fetchMessages({ limit: 1 });
      if (recentMessages.length > 0) {
        const latestMessage = recentMessages[0];
        actualForwardedProperties = {
          isForwarded: latestMessage.isForwarded,
          forwardingScore: latestMessage.forwardingScore || 0
        };
        logInfo(`Actual forwarded message properties: isForwarded=${latestMessage.isForwarded}, forwardingScore=${latestMessage.forwardingScore}`);
      }
    } catch (checkError: any) {
      logError('Could not verify forwarded message properties:', checkError);
    }

    res.json({ 
      success: true, 
      data: {
        forwardedMessage,
        originalMessageId: messageId,
        recipient: formattedTo,
        forwardMethod,
        timestamp: Date.now(),
        // Forwarding indicator information
        expectedForwardedIndicator: willShowForwardedIndicator,
        actualForwardedProperties,
        forwardingContext: {
          originalFromMe,
          originalAlreadyForwarded: isOriginalAlreadyForwarded,
          isSelfForwarding,
          reason: willShowForwardedIndicator ? 
            (isOriginalAlreadyForwarded ? 'Original was already forwarded' : 'Cross-author forwarding') :
            'Self-forwarding or same-author message (WhatsApp behavior)'
        }
      }
    });

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
 * POST /api/v1/devices/:id/messages/delete
 * Delete a message with proper options
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageId, forEveryone = false, fromChatId } = req.body;

    logInfo(`Deleting message from device ${id}`);

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
      // Search across recent chats
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

    // Delete the message
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
 * POST /api/v1/devices/:id/messages/edit
 * Edit a message (if supported)
 */
export const editMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { messageId, newText, fromChatId } = req.body;

    logInfo(`Editing message from device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    // Find the message to edit
    let messageToEdit;
    if (fromChatId) {
      const chat = await device.client.getChatById(fromChatId);
      const messages = await chat.fetchMessages({ limit: 100 });
      messageToEdit = messages.find(msg => msg.id._serialized === messageId);
    }

    if (!messageToEdit) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    // Check if message can be edited (must be from me and text type)
    if (!messageToEdit.fromMe) {
      res.status(400).json({ success: false, error: 'Can only edit your own messages' });
      return;
    }

    if (messageToEdit.type !== 'chat') {
      res.status(400).json({ success: false, error: 'Can only edit text messages' });
      return;
    }

    // Try to edit the message (this may not work on all WhatsApp Web versions)
    try {
      await messageToEdit.edit(newText);
      res.json({ 
        success: true, 
        data: { 
          messageId,
          newText,
          edited: true,
          timestamp: Date.now()
        }
      });
    } catch (editError: any) {
      res.status(400).json({ 
        success: false, 
        error: 'Message editing not supported or failed',
        details: editError.message
      });
    }

  } catch (error: any) {
    logError('Error editing message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to edit message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/devices/:id/messages/search
 * Search messages across chats
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
          continue; // Skip inaccessible chats
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
