import { Message, Device, Stats } from '../stores/realtime-store'

// Socket.IO Event Types
export interface ServerToClientEvents {
  // Message events
  'message:new': (message: Message) => void
  'message:update': (data: { messageId: string; updates: Partial<Message> }) => void
  'message:status': (data: { messageId: string; status: Message['status'] }) => void
  
  // Device events
  'device:update': (device: Device) => void
  'device:connected': (device: Device) => void
  'device:disconnected': (device: { id: string; lastSeen: string }) => void
  'device:qr': (data: { deviceId: string; qrCode: string }) => void
  'device:auth': (data: { deviceId: string; status: 'authenticated' | 'failed' }) => void
  
  // Stats events
  'stats:update': (stats: Partial<Stats>) => void
  'stats:realtime': (data: {
    messagesPerMinute: number
    activeConnections: number
    timestamp: string
  }) => void
  
  // Connection events
  'connection:status': (data: { status: string; timestamp: string }) => void
  'error': (error: { message: string; code?: string; data?: any }) => void
}

export interface ClientToServerEvents {
  // Authentication
  'auth': (data: { apiKey: string; accessToken: string }) => void
  
  // Message events
  'message:send': (data: {
    deviceId: string
    to: string
    message: string
    type?: 'text' | 'image' | 'document' | 'audio' | 'video'
    metadata?: any
  }) => void
  'message:markRead': (data: { messageId: string; deviceId: string }) => void
  
  // Device events
  'device:subscribe': (deviceId: string) => void
  'device:unsubscribe': (deviceId: string) => void
  'device:restart': (deviceId: string) => void
  'device:logout': (deviceId: string) => void
  
  // Stats events
  'stats:subscribe': () => void
  'stats:unsubscribe': () => void
  'stats:request': (data: { 
    deviceId?: string
    timeRange?: 'hour' | 'day' | 'week' | 'month'
  }) => void
  
  // Connection events
  'ping': () => void
  'join:room': (room: string) => void
  'leave:room': (room: string) => void
}

// Socket connection configuration
export interface SocketConfig {
  url: string
  apiKey: string
  accessToken: string
  options?: {
    autoConnect?: boolean
    reconnection?: boolean
    reconnectionDelay?: number
    reconnectionAttempts?: number
    timeout?: number
    transports?: ('websocket' | 'polling')[]
  }
}

// Real-time event data types
export interface MessageEvent {
  type: 'message:new' | 'message:update' | 'message:status'
  data: Message | { messageId: string; updates: Partial<Message> }
  timestamp: string
  deviceId: string
}

export interface DeviceEvent {
  type: 'device:update' | 'device:connected' | 'device:disconnected' | 'device:qr' | 'device:auth'
  data: Device | { id: string; lastSeen: string } | { deviceId: string; qrCode: string }
  timestamp: string
  userId: string
}

export interface StatsEvent {
  type: 'stats:update' | 'stats:realtime'
  data: Partial<Stats> | { messagesPerMinute: number; activeConnections: number }
  timestamp: string
  scope?: 'global' | 'user' | 'device'
  scopeId?: string
}

// Error types
export interface SocketError {
  message: string
  code?: string
  type?: 'connection' | 'authentication' | 'permission' | 'validation' | 'server'
  data?: any
  timestamp: string
}

// Authentication data
export interface AuthData {
  apiKey: string
  accessToken: string
  userId?: string
  deviceIds?: string[]
  permissions?: string[]
}

// Room/channel types for targeted updates
export type SocketRoom = 
  | `user:${string}`           // User-specific updates
  | `device:${string}`         // Device-specific updates  
  | `stats:global`             // Global statistics
  | `stats:user:${string}`     // User-specific stats
  | `admin`                    // Admin-only updates

export interface RoomSubscription {
  room: SocketRoom
  subscribed: boolean
  subscribedAt?: string
  lastActivity?: string
}

// Utility types
export type SocketEventName = keyof ServerToClientEvents | keyof ClientToServerEvents
export type SocketEventData<T extends SocketEventName> = 
  T extends keyof ServerToClientEvents 
    ? Parameters<ServerToClientEvents[T]>[0]
    : T extends keyof ClientToServerEvents
    ? Parameters<ClientToServerEvents[T]>[0]
    : never
