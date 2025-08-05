import { DeviceStatus } from './device.types';
import { Message, MessageAckEvent, TypingStatusEvent, RecordingStatusEvent } from './message.types';

// Socket event names
export const SOCKET_EVENTS = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    
    // Room management events
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',
    
    // Device events
    DEVICE_STATUS: 'device-status',
    DEVICE_QR: 'qr',
    DEVICE_READY: 'ready',
    DEVICE_AUTHENTICATED: 'authenticated',
    DEVICE_DISCONNECTED: 'disconnected',
    DEVICE_ERROR: 'device-error',
    DEVICE_DELETED: 'device-deleted',
    DEVICE_BATTERY: 'device-battery',
    DEVICE_STATE: 'state',
    
    // Message events
    MESSAGE_RECEIVED: 'message',
    MESSAGE_SENT: 'message-sent',
    MESSAGE_ACK: 'message-ack',
    MESSAGE_REVOKED: 'message-revoked',
    
    // Chat events
    TYPING_STATUS: 'typing-status',
    RECORDING_STATUS: 'recording-status',
    
    // Group events
    GROUP_JOIN: 'group-join',
    GROUP_LEAVE: 'group-leave',
    GROUP_UPDATE: 'group-update',
    
    // Contact events
    CONTACT_CHANGED: 'contact-changed',
    
    // General events
    ERROR: 'error',
    STATUS_UPDATE: 'status-update',
} as const;

// Socket event types (for type safety)
export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// Socket event payload interfaces
export interface JoinRoomPayload {
    room: string;
    clientId?: string;
}

export interface DeviceStatusPayload {
    deviceId: string;
    status: DeviceStatus;
    timestamp: number;
    metadata?: any;
}

export interface DeviceQRPayload {
    deviceId: string;
    qr: string;
    timestamp: number;
}

export interface DeviceReadyPayload {
    deviceId: string;
    phoneNumber?: string;
    timestamp: number;
}

export interface DeviceAuthenticatedPayload {
    deviceId: string;
    phoneNumber: string;
    clientName: string;
    timestamp: number;
}

export interface DeviceDisconnectedPayload {
    deviceId: string;
    reason: string;
    timestamp: number;
}

export interface DeviceErrorPayload {
    deviceId: string;
    error: string;
    timestamp: number;
}

export interface DeviceDeletedPayload {
    deviceId: string;
    timestamp: number;
}

export interface DeviceBatteryPayload {
    deviceId: string;
    batteryLevel: number;
    isCharging: boolean;
    timestamp: number;
}

export interface MessageReceivedPayload {
    deviceId: string;
    message: Message;
    timestamp: number;
}

export interface MessageSentPayload {
    deviceId: string;
    messageId: string;
    to: string;
    timestamp: number;
}

export interface GroupJoinPayload {
    deviceId: string;
    groupId: string;
    participantId: string;
    timestamp: number;
}

export interface GroupLeavePayload {
    deviceId: string;
    groupId: string;
    participantId: string;
    timestamp: number;
}

export interface GroupUpdatePayload {
    deviceId: string;
    groupId: string;
    update: {
        subject?: string;
        description?: string;
        participants?: {
            added?: string[];
            removed?: string[];
        };
    };
    timestamp: number;
}

export interface ContactChangedPayload {
    deviceId: string;
    contactId: string;
    oldName?: string;
    newName?: string;
    timestamp: number;
}

export interface ErrorPayload {
    deviceId?: string;
    error: string;
    details?: any;
    timestamp: number;
}

export interface StatusUpdatePayload {
    deviceId: string;
    status: string;
    details?: any;
    timestamp: number;
}

export interface DeviceStatePayload {
    deviceId: string;
    status: string;
    timestamp: number;
}

// Union type for all socket event payloads
export type SocketEventPayload = 
    | JoinRoomPayload
    | DeviceStatusPayload
    | DeviceQRPayload
    | DeviceReadyPayload
    | DeviceAuthenticatedPayload
    | DeviceDisconnectedPayload
    | DeviceErrorPayload
    | DeviceDeletedPayload
    | DeviceBatteryPayload
    | MessageReceivedPayload
    | MessageSentPayload
    | MessageAckEvent
    | TypingStatusEvent
    | RecordingStatusEvent
    | GroupJoinPayload
    | GroupLeavePayload
    | GroupUpdatePayload
    | ContactChangedPayload
    | ErrorPayload
    | StatusUpdatePayload
    | DeviceStatePayload;

// Socket server-to-client events
export interface ServerToClientEvents {
    [SOCKET_EVENTS.DEVICE_STATUS]: (payload: DeviceStatusPayload) => void;
    [SOCKET_EVENTS.DEVICE_QR]: (payload: DeviceQRPayload) => void;
    [SOCKET_EVENTS.DEVICE_READY]: (payload: DeviceReadyPayload) => void;
    [SOCKET_EVENTS.DEVICE_AUTHENTICATED]: (payload: DeviceAuthenticatedPayload) => void;
    [SOCKET_EVENTS.DEVICE_DISCONNECTED]: (payload: DeviceDisconnectedPayload) => void;
    [SOCKET_EVENTS.DEVICE_ERROR]: (payload: DeviceErrorPayload) => void;
    [SOCKET_EVENTS.DEVICE_DELETED]: (payload: DeviceDeletedPayload) => void;
    [SOCKET_EVENTS.DEVICE_BATTERY]: (payload: DeviceBatteryPayload) => void;
    [SOCKET_EVENTS.MESSAGE_RECEIVED]: (payload: MessageReceivedPayload) => void;
    [SOCKET_EVENTS.MESSAGE_SENT]: (payload: MessageSentPayload) => void;
    [SOCKET_EVENTS.MESSAGE_ACK]: (payload: MessageAckEvent) => void;
    [SOCKET_EVENTS.TYPING_STATUS]: (payload: TypingStatusEvent) => void;
    [SOCKET_EVENTS.RECORDING_STATUS]: (payload: RecordingStatusEvent) => void;
    [SOCKET_EVENTS.GROUP_JOIN]: (payload: GroupJoinPayload) => void;
    [SOCKET_EVENTS.GROUP_LEAVE]: (payload: GroupLeavePayload) => void;
    [SOCKET_EVENTS.GROUP_UPDATE]: (payload: GroupUpdatePayload) => void;
    [SOCKET_EVENTS.CONTACT_CHANGED]: (payload: ContactChangedPayload) => void;
    [SOCKET_EVENTS.ERROR]: (payload: ErrorPayload) => void;
    [SOCKET_EVENTS.STATUS_UPDATE]: (payload: StatusUpdatePayload) => void;
    [SOCKET_EVENTS.DEVICE_STATE]: (payload: DeviceStatePayload) => void;
}

// Socket client-to-server events
export interface ClientToServerEvents {
    [SOCKET_EVENTS.JOIN_ROOM]: (payload: JoinRoomPayload) => void;
    [SOCKET_EVENTS.LEAVE_ROOM]: (room: string) => void;
}

// Socket inter-server events (for scaling)
export interface InterServerEvents {
    ping: () => void;
}

// Socket data stored on connection
export interface SocketData {
    userId?: string;
    deviceId?: string;
    rooms: string[];
    connectedAt: number;
}
