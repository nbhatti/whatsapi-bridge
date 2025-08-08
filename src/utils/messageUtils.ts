import { Message as WhatsappMessage } from 'whatsapp-web.js';
import { LightMessageMeta } from '../types/analytics.types';

/**
 * Convert WhatsApp message to LightMessageMeta format
 * Extracts only privacy-safe metadata without message content
 */
export function convertToLightMessageMeta(
  message: WhatsappMessage, 
  deviceId: string,
  fromMe: boolean = false
): LightMessageMeta {
  // Validate deviceId to prevent undefined keys
  if (!deviceId || deviceId === 'undefined' || typeof deviceId !== 'string') {
    throw new Error(`Invalid deviceId provided to convertToLightMessageMeta: ${deviceId}`);
  }
  
  return {
    messageId: message.id._serialized || message.id.id || 'unknown',
    chatId: message.from || message.to || 'unknown',
    sender: message.from || (fromMe ? message.to : 'unknown'),
    timestamp: message.timestamp * 1000, // Convert to milliseconds
    type: message.type || 'text',
    meta: {
      fromMe,
      isGroup: message.from?.includes('@g.us') || false,
      hasMedia: message.hasMedia || false,
      isForwarded: message.isForwarded || false,
      isReply: !!message.hasQuotedMsg || false,
      mentionCount: message.mentionedIds?.length || 0,
      ackStatus: message.ack ? getAckStatus(message.ack) : undefined,
      deviceId
    }
  };
}

/**
 * Convert message acknowledgment status to string format
 */
function getAckStatus(ack: number): 'sent' | 'delivered' | 'read' | 'failed' {
  switch (ack) {
    case 1:
      return 'sent';
    case 2:
      return 'delivered';
    case 3:
      return 'read';
    default:
      return 'failed';
  }
}

/**
 * Check if a message should be cached based on various criteria
 */
export function shouldCacheMessage(message: WhatsappMessage): boolean {
  // Don't cache broadcast notifications or revoked messages
  if (message.type === 'broadcast_notification' || message.type === 'revoked') {
    return false;
  }

  // Don't cache messages without valid IDs
  if (!message.id || (!message.id._serialized && !message.id.id)) {
    return false;
  }

  // Don't cache very old messages (older than 1 hour)
  const messageTime = message.timestamp * 1000;
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  if (messageTime < oneHourAgo) {
    return false;
  }

  return true;
}
