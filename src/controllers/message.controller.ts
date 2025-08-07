import { Request, Response } from 'express';
import { MessageMedia, MessageSendOptions } from 'whatsapp-web.js';
import { DeviceManager, MessageQueueService, DeviceHealthService } from '../services';
import { logError, logInfo } from '../config/logger';

const deviceManager = DeviceManager.getInstance();
const messageQueueService = MessageQueueService.getInstance();
const deviceHealthService = DeviceHealthService.getInstance();

/**
 * POST /api/v1/devices/:id/messages
 * Queue a message for sending from a specific device (with blocking prevention).
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { to, type, text, mediaBase64, quotedId, mentions, priority = 'normal' } = req.body;

    logInfo(`Queueing message from device ${id} to ${to}`);

    const device = deviceManager.getDevice(id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found.' });
      return;
    }

    // Check device health and safety to send messages
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

    // Validate message content
    if (type === 'text' && !text) {
      res.status(400).json({ success: false, error: 'Text content is required for text messages.' });
      return;
    }
    if (type !== 'text' && !mediaBase64) {
      res.status(400).json({ success: false, error: 'Media content is required for media messages.' });
      return;
    }

    // Format phone number properly
    let formattedTo = to;
    if (!to.includes('@')) {
      formattedTo = `${to}@c.us`;
    }

    // Prepare message options
    const sendOptions: MessageSendOptions = {
      ...(quotedId && { quotedMessageId: quotedId }),
      ...(mentions && { mentions }),
    };

    // Queue the message
    const messageId = await messageQueueService.queueMessage({
      deviceId: id,
      to: formattedTo,
      type: type === 'text' ? 'text' : 'media',
      content: text || '',
      mediaBase64: type !== 'text' ? mediaBase64 : undefined,
      mediaType: type !== 'text' ? type : undefined,
      options: sendOptions,
      priority: priority as 'high' | 'normal' | 'low',
      maxAttempts: 3
    });

    // Get queue status for response
    const queueStatus = await messageQueueService.getQueueStatus();
    const deviceStatus = await messageQueueService.getDeviceStatus(id);
    
    res.status(202).json({ 
      success: true, 
      message: 'Message queued successfully',
      data: {
        messageId,
        deviceId: id,
        to: formattedTo,
        type,
        priority,
        status: 'queued'
      },
      queue: {
        pending: queueStatus.pending,
        processing: queueStatus.processing,
        deviceMessagesInLast60s: deviceStatus.messagesInLast60s
      }
    });

  } catch (error: any) {
    logError('Error queueing message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to queue message.',
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
