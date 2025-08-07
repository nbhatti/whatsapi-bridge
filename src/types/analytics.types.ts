/**
 * Privacy-friendly message metadata interface for analytics
 * Excludes message body and quoted content to maintain privacy
 */
export interface LightMessageMeta {
  /** Unique message identifier */
  messageId: string;
  
  /** Chat/conversation identifier */
  chatId: string;
  
  /** Message sender identifier (phone number or group participant) */
  sender: string;
  
  /** Message timestamp in milliseconds */
  timestamp: number;
  
  /** Message type (text, image, audio, video, document, etc.) */
  type: string;
  
  /** Additional metadata about the message */
  meta: {
    /** Whether the message was sent by the device owner */
    fromMe: boolean;
    
    /** Whether this is a group message */
    isGroup: boolean;
    
    /** Whether the message has media attachment */
    hasMedia: boolean;
    
    /** Whether the message was forwarded */
    isForwarded: boolean;
    
    /** Whether the message is a reply to another message */
    isReply: boolean;
    
    /** Number of mentioned users (if applicable) */
    mentionCount?: number;
    
    /** Message acknowledgment status for outbound messages */
    ackStatus?: 'sent' | 'delivered' | 'read' | 'failed';
    
    /** Device ID that processed this message */
    deviceId: string;
  };
}

/**
 * Event payloads for different WhatsApp events
 */
export interface MessageEventPayload extends LightMessageMeta {
  /** Event type for incoming messages */
  eventType: 'message_received';
}

export interface MessageCreateEventPayload extends LightMessageMeta {
  /** Event type for outbound messages (sent by the device) */
  eventType: 'message_create';
  
  /** Recipient identifier */
  recipient: string;
}

export interface MessageAckEventPayload {
  /** Event type for message acknowledgments */
  eventType: 'message_ack';
  
  /** Message ID that was acknowledged */
  messageId: string;
  
  /** Chat ID where the message was sent */
  chatId: string;
  
  /** Device ID that sent the message */
  deviceId: string;
  
  /** Acknowledgment status */
  ackStatus: 'sent' | 'delivered' | 'read' | 'failed';
  
  /** Timestamp when acknowledgment was received */
  timestamp: number;
  
  /** Recipient who acknowledged the message */
  recipient: string;
}

/**
 * Union type for all message-related events
 */
export type WhatsAppMessageEvent = 
  | MessageEventPayload 
  | MessageCreateEventPayload 
  | MessageAckEventPayload;

/**
 * Analytics hook configuration
 */
export interface AnalyticsHookConfig {
  /** Whether to track incoming messages */
  trackIncoming: boolean;
  
  /** Whether to track outgoing messages */
  trackOutgoing: boolean;
  
  /** Whether to track message acknowledgments */
  trackAcknowledgments: boolean;
  
  /** Custom event handler for analytics */
  onEvent?: (event: WhatsAppMessageEvent) => Promise<void>;
}
