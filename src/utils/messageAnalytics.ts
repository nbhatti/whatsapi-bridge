import { Message, Chat } from 'whatsapp-web.js';
import { LightMessageMeta, MessageEventPayload, MessageCreateEventPayload } from '../types/analytics.types';

/**
 * Extracts privacy-friendly metadata from a WhatsApp message
 * Excludes message body and quoted content to maintain privacy
 */
export async function extractLightMessageMeta(
  message: Message,
  deviceId: string,
  chat?: Chat
): Promise<LightMessageMeta> {
  // Get chat info if not provided
  if (!chat) {
    chat = await message.getChat();
  }

  return {
    messageId: message.id._serialized,
    chatId: chat.id._serialized,
    sender: message.from,
    timestamp: message.timestamp * 1000, // Convert to milliseconds
    type: message.type,
    meta: {
      fromMe: message.fromMe,
      isGroup: chat.isGroup,
      hasMedia: message.hasMedia,
      isForwarded: message.isForwarded || false,
      isReply: !!message.hasQuotedMsg,
      mentionCount: message.mentionedIds?.length || 0,
      deviceId: deviceId,
    },
  };
}

/**
 * Creates a message event payload for incoming messages
 */
export async function createMessageEventPayload(
  message: Message,
  deviceId: string,
  chat?: Chat
): Promise<MessageEventPayload> {
  const lightMeta = await extractLightMessageMeta(message, deviceId, chat);
  return {
    ...lightMeta,
    eventType: 'message_received' as const,
  };
}

/**
 * Creates a message create event payload for outbound messages
 */
export async function createMessageCreateEventPayload(
  message: Message,
  deviceId: string,
  chat?: Chat
): Promise<MessageCreateEventPayload> {
  const lightMeta = await extractLightMessageMeta(message, deviceId, chat);
  return {
    ...lightMeta,
    eventType: 'message_create' as const,
    recipient: message.to,
  };
}

/**
 * Maps WhatsApp Web.js acknowledgment status to readable format
 * 
 * WhatsApp ack values:
 * - 0: ACK_ERROR (error)
 * - 1: ACK_PENDING (sent)
 * - 2: ACK_SERVER (delivered to server)
 * - 3: ACK_DEVICE (delivered to device)
 * - 4: ACK_READ (read by recipient)
 */
export function mapAckStatus(ack: number): 'sent' | 'delivered' | 'read' | 'failed' {
  switch (ack) {
    case 0:
      return 'failed';
    case 1:
      return 'sent';
    case 2:
    case 3:
      return 'delivered';
    case 4:
      return 'read';
    default:
      return 'sent';
  }
}

/**
 * Determines if a message should be tracked based on type and content
 * Filters out system messages and other non-user content
 */
export function shouldTrackMessage(message: Message): boolean {
  // Skip system notifications
  if (message.type === 'notification_template') return false;
  if (message.type === 'group_notification') return false;
  if (message.type === 'call_log') return false;
  
  // Skip empty messages without media
  if (!message.body && !message.hasMedia) return false;
  
  // Track all other message types
  return true;
}

/**
 * Gets a safe display name for a chat (for logging purposes)
 */
export function getChatDisplayName(chat: Chat): string {
  if (chat.name) return chat.name;
  if (!chat.isGroup && chat.id.user) return chat.id.user;
  return 'Unknown Chat';
}

/**
 * Gets a safe display identifier for a message sender (for logging purposes)
 */
export function getSenderDisplayName(message: Message): string {
  // For group messages, show the participant
  if (!message.fromMe && message.author) {
    return message.author;
  }
  
  // For direct messages, show the chat participant
  if (!message.fromMe && message.from) {
    return message.from;
  }
  
  // For messages sent by the device
  if (message.fromMe) {
    return 'Me';
  }
  
  return 'Unknown Sender';
}
