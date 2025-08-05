import { Client } from 'whatsapp-web.js';

// Device status enumeration
export type DeviceStatus = 
    | 'initializing' 
    | 'qr' 
    | 'authenticating'
    | 'ready' 
    | 'disconnected' 
    | 'error'
    | 'destroyed';

// Device interface extending the existing one
export interface Device {
    id: string;
    client: Client;
    status: DeviceStatus;
    qrCode?: string;
    createdAt: number;
    lastSeen: number;
    phoneNumber?: string;
    clientName?: string;
    isConnected?: boolean;
    metadata?: DeviceMetadata;
}

// Device metadata for additional information
export interface DeviceMetadata {
    userAgent?: string;
    platform?: string;
    version?: string;
    batteryLevel?: number;
    isOnline?: boolean;
    lastBackup?: number;
}

// Device configuration options
export interface DeviceConfig {
    clientId: string;
    headless?: boolean;
    authStrategy?: 'local' | 'redis';
    puppeteerOptions?: {
        args?: string[];
        headless?: boolean;
        devtools?: boolean;
        timeout?: number;
    };
    webhookUrl?: string;
    enableLogs?: boolean;
}

// Device creation request
export interface CreateDeviceRequest {
    config?: Partial<DeviceConfig>;
    name?: string;
    description?: string;
}

// Device update request
export interface UpdateDeviceRequest {
    name?: string;
    description?: string;
    config?: Partial<DeviceConfig>;
}

// Device statistics
export interface DeviceStats {
    id: string;
    messagesReceived: number;
    messagesSent: number;
    uptime: number;
    errorCount: number;
    lastError?: string;
    lastErrorAt?: number;
}

// Device event types
export type DeviceEventType = 
    | 'qr'
    | 'ready' 
    | 'authenticated'
    | 'auth_failure'
    | 'disconnected'
    | 'message'
    | 'message_create'
    | 'message_revoke_everyone'
    | 'message_revoke_me'
    | 'message_ack'
    | 'group_join'
    | 'group_leave'
    | 'group_update'
    | 'contact_changed'
    | 'change_state'
    | 'change_battery'
    | 'loading_screen'
    | 'remote_session_saved';

// Device event data
export interface DeviceEvent {
    deviceId: string;
    type: DeviceEventType;
    timestamp: number;
    data: any;
}

// Lightweight device info for listings
export interface DeviceInfo {
    id: string;
    status: DeviceStatus;
    phoneNumber?: string;
    clientName?: string;
    createdAt: number;
    lastSeen: number;
    isConnected: boolean;
}

// Device connection state
export interface DeviceConnectionState {
    isConnected: boolean;
    batteryLevel?: number;
    isOnline?: boolean;
    platform?: string;
    clientVersion?: string;
    lastSeen: number;
}
