import { Request, Response } from 'express';
import { MessageMedia, MessageSendOptions } from 'whatsapp-web.js';
import { DeviceManager } from '../services/DeviceManager';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();

/**
 * POST /api/v1/devices/:id/messages
 * Send a message from a specific device.
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { to, type, text, mediaBase64, quotedId, mentions } = req.body;

    logInfo(`Sending message from device ${id}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready to send messages.' });
      return;
    }

    // Format phone number properly - ensure it has @c.us suffix
    let formattedTo = to;
    if (!to.includes('@')) {
      formattedTo = `${to}@c.us`;
    }

    const sendOptions: MessageSendOptions = {
      ...(quotedId && { quotedMessageId: quotedId }),
      ...(mentions && { mentions }),
    };

    let message;
    if (type === 'text' && text) {
      message = await device.client.sendMessage(formattedTo, text, sendOptions);
    } else if (mediaBase64) {
      const media = new MessageMedia(type, mediaBase64);
      message = await device.client.sendMessage(formattedTo, media, sendOptions);
    } else {
      res.status(400).json({ success: false, error: 'Invalid message type or missing content.' });
      return;
    }

    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    logError('Error sending message:', error);
    logInfo(`Failed to send message to ${req.body.to}: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/v1/devices/:id/messages
 * Fetch messages from a specific chat.
 */
export const fetchMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { chatId, limit, before } = req.query;

    logInfo(`Fetching messages for device ${id}, chat ${chatId}`);

    const device = deviceManager.getDevice(id);
    if (!device || device.status !== 'ready') {
      res.status(400).json({ success: false, error: 'Device not ready.' });
      return;
    }

    // Get the chat first
    const chat = await device.client.getChatById(chatId as string);
    
    // Then fetch messages from that chat
    const messages = await chat.fetchMessages({
      limit: limit ? parseInt(limit as string, 10) : 50,
      ...(before && { before: before as string }),
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    logError(`Error fetching messages for chat ${req.query.chatId}:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
};
