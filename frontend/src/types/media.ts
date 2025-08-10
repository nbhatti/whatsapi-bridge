/**
 * Enhanced Media Types for WhatsApp Frontend
 * Includes all the rich media functionality from the backend API
 */

export interface MediaInfo {
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
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  description?: string;
}

export interface QuotedMessage {
  id: string;
  body: string;
  author: string;
  type: string;
}

export interface MessageReaction {
  id: string;
  aggregateEmoji: string;
  hasReactionByMe: boolean;
}

export interface MessageLink {
  link: string;
  isSuspicious: boolean;
}

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
  mediaInfo?: MediaInfo;
  location?: LocationInfo;
  vCards?: any[];
  mentionedIds?: string[];
  links?: MessageLink[];
  quotedMessage?: QuotedMessage;
  reactions?: MessageReaction[];
}

export interface MediaState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface MediaDownloadProgress {
  messageId: string;
  progress: number;
  totalSize?: number;
  downloadedSize?: number;
}

// Message status tracking
export interface MessageStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
  timestamp?: number;
}

// Enhanced media info with complete metadata
export interface EnhancedMediaInfo extends MediaInfo {
  // Additional fields from backend
  mediaKey?: string;
  directPath?: string;
  deprecatedMms3Url?: string;
  
  // URLs for frontend access
  downloadUrl: string;
  thumbnailUrl?: string;
  infoUrl?: string;
}

// Frontend display message type (converted from backend)
export interface DisplayMessage {
  id: string;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
  author?: string; // For group messages
  chatId?: string;
  
  // Message status and state
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageStatus?: MessageStatus;
  
  // Message type with comprehensive support
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'ptt' | 'vcard' | 'call_log' | 'e2e_notification';
  
  // Reply/quote support
  replyTo?: {
    id: string;
    text: string;
    sender: string;
    author?: string;
    type?: string;
  };
  quotedMessage?: QuotedMessage;
  
  // Mentions and tags
  mentions?: string[];
  mentionedIds?: string[];
  
  // Enhanced media properties
  hasMedia: boolean;
  mediaInfo?: EnhancedMediaInfo;
  mediaState?: MediaState;
  
  // Location properties
  location?: LocationInfo;
  
  // Contact cards
  vCards?: any[];
  
  // Reactions
  reactions?: MessageReaction[];
  
  // Message flags
  isForwarded?: boolean;
  isStarred?: boolean;
  
  // Links and URLs
  links?: MessageLink[];
  title?: string; // For URL previews
  
  // UI state
  isSelected?: boolean;
  isHighlighted?: boolean;
  showTimestamp?: boolean;
  
  // Legacy compatibility
  duration?: number; // For audio/video
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface MediaThumbnailProps {
  messageId: string;
  deviceId: string;
  mediaInfo: MediaInfo;
  onClick?: () => void;
  className?: string;
}

export interface MediaPlayerProps {
  messageId: string;
  deviceId: string;
  mediaInfo: MediaInfo;
  autoPlay?: boolean;
}

export interface MediaDownloadButtonProps {
  messageId: string;
  deviceId: string;
  mediaInfo: MediaInfo;
  variant?: 'icon' | 'button' | 'link';
  onDownloadStart?: (messageId: string) => void;
  onDownloadComplete?: (messageId: string, blob: Blob) => void;
  onDownloadError?: (messageId: string, error: Error) => void;
}
