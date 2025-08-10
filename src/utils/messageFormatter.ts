import { Message, MessageMedia } from 'whatsapp-web.js';
import { logError } from '../config/logger';

/**
 * Enhanced message interface with media details
 */
export interface EnhancedMessage {
  id: string;
  chatId: string;
  body: string;
  type: string;
  timestamp: number;
  fromMe: boolean;
  author?: string;
  hasMedia: boolean;
  isForwarded: boolean;
  isStarred: boolean;
  mediaInfo?: {
    mimetype: string;
    filesize?: number;
    filename?: string;
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
    downloadUrl: string;
    thumbnailUrl?: string;
    duration?: number; // For audio/video
    dimensions?: { // For images/videos
      width: number;
      height: number;
    };
  };
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  vCards?: any[];
  mentionedIds?: string[];
  links?: Array<{
    link: string;
    isSuspicious: boolean;
  }>;
  quotedMessage?: {
    id: string;
    body: string;
    author: string;
    type: string;
  };
  reactions?: Array<{
    id: string;
    aggregateEmoji: string;
    hasReactionByMe: boolean;
  }>;
}

/**
 * Formats a WhatsApp Web.js Message object into an enhanced format with media details
 */
export async function formatMessage(message: Message, deviceId: string): Promise<EnhancedMessage> {
  const formatted: EnhancedMessage = {
    id: message.id._serialized,
    chatId: message.from,
    body: message.body || '',
    type: message.type,
    timestamp: message.timestamp * 1000, // Convert to milliseconds
    fromMe: message.fromMe,
    author: message.author || undefined,
    hasMedia: message.hasMedia,
    isForwarded: message.isForwarded,
    isStarred: message.isStarred,
  };

  // Handle media files
  if (message.hasMedia) {
    try {
      // Get media info without downloading the full media
      const mediaInfo = await getMediaInfo(message, deviceId);
      formatted.mediaInfo = mediaInfo;
    } catch (error) {
      logError('Error getting media info:', error);
      // Set basic media info even if detailed info fails
      formatted.mediaInfo = {
        mimetype: 'unknown',
        mediaType: getMediaTypeFromMessageType(message.type),
        downloadUrl: `/api/v1/devices/${deviceId}/messages/${message.id._serialized}/media/download`,
      };
    }
  }

  // Handle location messages
  if (message.location) {
    formatted.location = {
      latitude: Number(message.location.latitude),
      longitude: Number(message.location.longitude),
      description: message.location.description || undefined,
    };
  }

  // Handle vCard contacts
  if (message.vCards && message.vCards.length > 0) {
    formatted.vCards = message.vCards;
  }

  // Handle mentions
  if (message.mentionedIds && message.mentionedIds.length > 0) {
    formatted.mentionedIds = message.mentionedIds;
  }

  // Handle links
  if (message.links && message.links.length > 0) {
    formatted.links = message.links;
  }

  // Handle quoted messages (replies)
  if (message.hasQuotedMsg) {
    try {
      const quotedMsg = await message.getQuotedMessage();
      formatted.quotedMessage = {
        id: quotedMsg.id._serialized,
        body: quotedMsg.body || '',
        author: quotedMsg.author || quotedMsg.from,
        type: quotedMsg.type,
      };
    } catch (error) {
      logError('Error getting quoted message:', error);
    }
  }

  // Handle reactions
  if (message.hasReaction) {
    try {
      const reactions = await message.getReactions();
      formatted.reactions = reactions.map(reaction => ({
        id: reaction.id || '',
        aggregateEmoji: reaction.aggregateEmoji,
        hasReactionByMe: reaction.hasReactionByMe
      }));
    } catch (error) {
      logError('Error getting reactions:', error);
    }
  }

  return formatted;
}

/**
 * Gets detailed media information without downloading the full media
 */
async function getMediaInfo(message: Message, deviceId: string): Promise<any> {
  const baseMediaInfo = {
    downloadUrl: `/api/v1/devices/${deviceId}/messages/${message.id._serialized}/media/download`,
    thumbnailUrl: `/api/v1/devices/${deviceId}/messages/${message.id._serialized}/media/thumbnail`,
  };

  // Try to get media details
  try {
    // For some message types, we can get info without downloading
    const mediaType = getMediaTypeFromMessageType(message.type);
    
    const mediaInfo: any = {
      ...baseMediaInfo,
      mediaType,
    };

    // Add specific properties based on media type
    switch (mediaType) {
      case 'image':
        mediaInfo.mimetype = 'image/jpeg'; // Default, will be updated when downloaded
        break;
      case 'video':
        mediaInfo.mimetype = 'video/mp4'; // Default
        break;
      case 'audio':
        mediaInfo.mimetype = message.type === 'ptt' ? 'audio/ogg' : 'audio/mpeg';
        if (message.type === 'ptt') {
          // Voice message specific info
          try {
            // Some voice messages have duration info
            mediaInfo.duration = (message as any).duration || undefined;
          } catch (e) {
            // Ignore if duration is not available
          }
        }
        break;
      case 'document':
        mediaInfo.mimetype = 'application/octet-stream'; // Default
        mediaInfo.filename = 'document'; // Default filename
        break;
      case 'sticker':
        mediaInfo.mimetype = 'image/webp';
        break;
    }

    return mediaInfo;
  } catch (error) {
    logError('Error getting detailed media info:', error);
    return baseMediaInfo;
  }
}

/**
 * Maps WhatsApp message types to our media types
 */
function getMediaTypeFromMessageType(messageType: string): 'image' | 'video' | 'audio' | 'document' | 'sticker' {
  switch (messageType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
    case 'ptt': // Push-to-talk (voice messages)
      return 'audio';
    case 'document':
      return 'document';
    case 'sticker':
      return 'sticker';
    default:
      return 'document';
  }
}

/**
 * Formats multiple messages in batch for better performance
 */
export async function formatMessages(messages: Message[], deviceId: string): Promise<EnhancedMessage[]> {
  const formattedMessages: EnhancedMessage[] = [];
  
  for (const message of messages) {
    try {
      const formatted = await formatMessage(message, deviceId);
      formattedMessages.push(formatted);
    } catch (error) {
      logError(`Error formatting message ${message.id._serialized}:`, error);
      // Add basic message info even if formatting fails
      formattedMessages.push({
        id: message.id._serialized,
        chatId: message.from,
        body: message.body || '',
        type: message.type,
        timestamp: message.timestamp * 1000,
        fromMe: message.fromMe,
        hasMedia: message.hasMedia,
        isForwarded: message.isForwarded,
        isStarred: message.isStarred,
      });
    }
  }
  
  return formattedMessages;
}
