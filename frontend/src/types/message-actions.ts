/**
 * Message Action Types
 * Defines all possible message actions and their parameters
 */

export interface MessageAction {
  type: 'reply' | 'forward' | 'delete' | 'star' | 'react' | 'copy' | 'quote' | 'edit' | 'info';
  messageId: string;
  chatId?: string;
  deviceId?: string;
  data?: any;
}

export interface ReplyAction extends MessageAction {
  type: 'reply';
  originalMessage: {
    id: string;
    text: string;
    sender: string;
    type: string;
  };
}

export interface ForwardAction extends MessageAction {
  type: 'forward';
  targetChatIds: string[];
  data?: {
    withAttribution?: boolean;
  };
}

export interface DeleteAction extends MessageAction {
  type: 'delete';
  data: {
    forEveryone: boolean;
    reason?: string;
  };
}

export interface StarAction extends MessageAction {
  type: 'star';
  data: {
    starred: boolean;
  };
}

export interface ReactAction extends MessageAction {
  type: 'react';
  data: {
    emoji: string;
    remove?: boolean;
  };
}

export interface CopyAction extends MessageAction {
  type: 'copy';
  data: {
    content: string;
    contentType: 'text' | 'media_url' | 'location';
  };
}

export interface EditAction extends MessageAction {
  type: 'edit';
  data: {
    newText: string;
  };
}

export interface MessageInfoAction extends MessageAction {
  type: 'info';
}

// Message context menu configuration
export interface MessageContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  action: MessageAction['type'];
  condition?: (message: any) => boolean;
  shortcut?: string;
  divider?: boolean;
}

// Message selection for bulk actions
export interface MessageSelection {
  messageIds: string[];
  chatId: string;
  deviceId: string;
}

// Message status update
export interface MessageStatusUpdate {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: number;
  error?: string;
}

// New message creation
export interface NewMessageData {
  text?: string;
  media?: {
    data: string; // Base64
    mimetype: string;
    filename?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  quotedMessageId?: string;
  mentions?: string[];
  priority?: 'high' | 'normal' | 'low';
}

// Message search filters
export interface MessageSearchFilters {
  query: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  dateRange?: {
    from: Date;
    to: Date;
  };
  sender?: string;
  hasMedia?: boolean;
  isStarred?: boolean;
  isForwarded?: boolean;
}

// Bulk message operations
export interface BulkMessageOperation {
  type: 'delete' | 'forward' | 'star' | 'export';
  messageIds: string[];
  chatId: string;
  deviceId: string;
  options?: any;
}
