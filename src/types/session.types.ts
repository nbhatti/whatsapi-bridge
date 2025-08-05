import { DeviceStatus, DeviceMetadata } from './device.types';

// Redis-stored session data
export interface SessionData {
    id: string;
    status: DeviceStatus;
    qrCode?: string;
    createdAt: number;
    lastSeen: number;
    phoneNumber?: string;
    clientName?: string;
    webhookUrl?: string;
    metadata?: DeviceMetadata;
}

// Session info for API responses
export interface SessionInfo {
    id: string;
    status: DeviceStatus;
    qrCodeUrl?: string;
    webhookUrl?: string;
    createdAt: string;
    lastSeen: string;
}

// Session creation parameters
export interface CreateSessionParams {
    id?: string;
    name?: string;
    webhookUrl?: string;
}

// Session update parameters
export interface UpdateSessionParams {
    webhookUrl?: string;
}

// Session credentials for Redis auth store
export interface RedisSessionCredentials {
    clientId: string;
    serverToken: string;
    clientToken: string;
    encKey: string;
    macKey: string;
}

