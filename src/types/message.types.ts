import { Message as WhatsappMessage, MessageMedia } from 'whatsapp-web.js';

// Message type enumeration
export type MessageType = 
    | 'text' 
    | 'image' 
    | 'video' 
    | 'audio' 
    | 'document' 
    | 'sticker' 
    | 'location' 
    | 'vcard' 
    | 'contact' 
    | 'unknown';

// Abstracted message structure for our API
export interface Message {
    id: string;
    deviceId: string;
    timestamp: number;
    from: string;
    to: string;
    body: string;
    type: MessageType;
    isGroupMessage: boolean;
    author?: string;
    media?: MessageMedia;
    vcard?: string;
    location?: {
        latitude: number;
        longitude: number;
        description?: string;
    };
    // Add whatsapp-web.js message for more details
    rawMessage?: WhatsappMessage;
}

// Message sending options
export interface SendMessageOptions {
    caption?: string;
    mentions?: string[];
    quotedMessageId?: string;
    sendSeen?: boolean;
}

// Message sending request for text
export interface SendTextMessageRequest {
    to: string;
    text: string;
    options?: SendMessageOptions;
}

// Message sending request for media
export interface SendMediaRequest {
    to: string;
    mediaUrl: string; // URL to the media file
    options?: SendMessageOptions & { 
        filename?: string;
        mimetype?: string;
        isSticker?: boolean; 
    };
}

// Message sending request for location
export interface SendLocationRequest {
    to: string;
    latitude: number;
    longitude: number;
    description?: string;
    options?: SendMessageOptions;
}

// Message sending request for vCard
export interface SendVCardRequest {
    to: string;
    vcard: string; // vCard data as a string
    options?: SendMessageOptions;
}

// Message acknowledgment status
export type MessageAckStatus = 
    | 'sent' 
    | 'delivered' 
    | 'read' 
    | 'error';

// Message acknowledgment event
export interface MessageAckEvent {
    deviceId: string;
    messageId: string;
    status: MessageAckStatus;
    timestamp: number;
}

// Typing status event
export interface TypingStatusEvent {
    deviceId: string;
    chatId: string;
    isTyping: boolean;
    timestamp: number;
}

// Recording status event
export interface RecordingStatusEvent {
    deviceId: string;
    chatId: string;
    isRecording: boolean;
    timestamp: number;
}

