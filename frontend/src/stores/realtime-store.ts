import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { useMemo } from 'react'

// Types for real-time data
export interface Message {
  id: string;
  rawId?: string | object; // To store the original ID for replies
  text: string;
  timestamp: string;
  from: string;
  to: string;
  sender: 'me' | 'other';
  status: 'composing' | 'queued' | 'processing' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'file' | 'location' | 'audio';
  deviceId: string;
  queueInfo?: {
    position?: number;
    estimatedTime?: number;
    priority?: 'high' | 'normal' | 'low';
  };
  replyTo?: {
    id: string;
    text: string;
    sender: string;
  };
  mentions?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  duration?: number; // For audio messages
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata?: {
    fileName?: string;
    mimeType?: string;
    size?: number;
  };
}

export interface Device {
  id: string
  name: string
  waDeviceId: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  qrCode?: string
  lastSeen?: string
  userId: string
  createdAt: string
  updatedAt: string
  stats?: {
    messagesReceived: number
    messagesSent: number
    contacts: number
    groups: number
  }
}

export interface Stats {
  totalMessages: number
  totalDevices: number
  activeDevices: number
  messagesPerHour: number
  messagesPerDay: number
  topContacts: Array<{
    phone: string
    name?: string
    messageCount: number
  }>
  deviceStats: Array<{
    deviceId: string
    deviceName: string
    messageCount: number
    lastActivity: string
  }>
  messageTypes: {
    text: number
    image: number
    document: number
    audio: number
    video: number
  }
}

interface RealtimeState {
  // Messages
  messages: Message[]
  messageCount: number
  
  // Devices
  devices: Device[]
  activeDeviceCount: number
  
  // Stats
  stats: Stats | null
  lastStatsUpdate: string | null
  
  // Connection state
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastUpdate: string | null

  // Actions
  addMessage: (message: Message) => void
  addOrUpdateMessages: (messages: Message[]) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  removeMessage: (messageId: string) => void
  clearMessages: () => void
  
  updateDevice: (device: Device) => void
  addDevice: (device: Device) => void
  removeDevice: (deviceId: string) => void
  clearDevices: () => void
  
  updateStats: (stats: Partial<Stats>) => void
  clearStats: () => void
  
  setConnectionStatus: (status: RealtimeState['connectionStatus']) => void
  resetStore: () => void
}

const initialState = {
  messages: [],
  messageCount: 0,
  devices: [],
  activeDeviceCount: 0,
  stats: null,
  lastStatsUpdate: null,
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  lastUpdate: null,
}

export const useRealtimeStore = create<RealtimeState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // Message actions
      addMessage: (message: Message) => {
        set((state: RealtimeState) => {
          const existingIndex = state.messages.findIndex(m => m.id === message.id)
          if (existingIndex !== -1) {
            // Update existing message
            const updatedMessages = [...state.messages]
            updatedMessages[existingIndex] = message
            return {
              messages: updatedMessages,
              messageCount: updatedMessages.length,
              lastUpdate: new Date().toISOString()
            }
          }
          
          // Add new message (keep only last 1000 messages for performance)
          const newMessages = [...state.messages, message].slice(-1000)
          return {
            messages: newMessages,
            messageCount: newMessages.length,
            lastUpdate: new Date().toISOString()
          }
        })
      },

      addOrUpdateMessages: (newMessages: Message[]) => {
        set((state: RealtimeState) => {
          const messageMap = new Map(state.messages.map(msg => [msg.id, msg]));
          let addedCount = 0;
          let updatedCount = 0;
      
          newMessages.forEach(msg => {
            const existing = messageMap.get(msg.id);
            if (existing) {
              // Update existing message, preserving important fields from optimistic updates
              const updated = {
                ...existing,
                ...msg,
                // Don't overwrite 'sending' status with older status if the new one isn't better
                status: msg.status === 'sent' && existing.status === 'sending' ? 'sent' : 
                       msg.status === 'delivered' && ['sending', 'sent'].includes(existing.status) ? 'delivered' :
                       msg.status === 'read' && ['sending', 'sent', 'delivered'].includes(existing.status) ? 'read' :
                       msg.status || existing.status
              };
              messageMap.set(msg.id, updated);
              updatedCount++;
              console.log('🔄 Updated message:', msg.id, 'status:', existing.status, '->', updated.status);
            } else {
              messageMap.set(msg.id, msg);
              addedCount++;
              console.log('➕ Added new message:', msg.id, 'status:', msg.status);
            }
          });
      
          const updatedMessages = Array.from(messageMap.values())
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-1000); // Keep last 1000 messages
          
          if (addedCount > 0 || updatedCount > 0) {
            console.log(`📦 Message store update: +${addedCount} new, ~${updatedCount} updated, total: ${updatedMessages.length}`);
          }
      
          return {
            messages: updatedMessages,
            messageCount: updatedMessages.length,
            lastUpdate: new Date().toISOString()
          };
        });
      },

      updateMessage: (messageId: string, updates: Partial<Message>) => {
        set((state: RealtimeState) => ({
          messages: state.messages.map(message =>
            message.id === messageId ? { ...message, ...updates } : message
          ),
          lastUpdate: new Date().toISOString()
        }))
      },

      removeMessage: (messageId: string) => {
        set((state: RealtimeState) => {
          const filteredMessages = state.messages.filter(m => m.id !== messageId)
          return {
            messages: filteredMessages,
            messageCount: filteredMessages.length,
            lastUpdate: new Date().toISOString()
          }
        })
      },

      clearMessages: () => {
        set(() => ({
          messages: [],
          messageCount: 0,
          lastUpdate: new Date().toISOString()
        }))
      },

      // Device actions
      updateDevice: (device: Device) => {
        set((state: RealtimeState) => {
          const existingIndex = state.devices.findIndex(d => d.id === device.id)
          let updatedDevices: Device[]
          
          if (existingIndex !== -1) {
            // Update existing device
            updatedDevices = [...state.devices]
            updatedDevices[existingIndex] = device
          } else {
            // Update existing device
            updatedDevices = [...state.devices, device]
          }
          
          const activeCount = updatedDevices.filter(d => d.status === 'connected').length
          
          return {
            devices: updatedDevices,
            activeDeviceCount: activeCount,
            lastUpdate: new Date().toISOString()
          }
        })
      },

      addDevice: (device: Device) => {
        set((state: RealtimeState) => {
          const existingIndex = state.devices.findIndex(d => d.id === device.id)
          if (existingIndex !== -1) {
            return state // Device already exists
          }
          
          const updatedDevices = [...state.devices, device]
          const activeCount = updatedDevices.filter(d => d.status === 'connected').length
          
          return {
            devices: updatedDevices,
            activeDeviceCount: activeCount,
            lastUpdate: new Date().toISOString()
          }
        })
      },

      removeDevice: (deviceId: string) => {
        set((state: RealtimeState) => {
          const filteredDevices = state.devices.filter(d => d.id !== deviceId)
          const activeCount = filteredDevices.filter(d => d.status === 'connected').length
          
          return {
            devices: filteredDevices,
            activeDeviceCount: activeCount,
            lastUpdate: new Date().toISOString()
          }
        })
      },

      clearDevices: () => {
        set(() => ({
          devices: [],
          activeDeviceCount: 0,
          lastUpdate: new Date().toISOString()
        }))
      },

      // Stats actions
      updateStats: (statsUpdate: Partial<Stats>) => {
        set((state: RealtimeState) => ({
          stats: state.stats ? { ...state.stats, ...statsUpdate } : statsUpdate as Stats,
          lastStatsUpdate: new Date().toISOString(),
          lastUpdate: new Date().toISOString()
        }))
      },

      clearStats: () => {
        set(() => ({
          stats: null,
          lastStatsUpdate: null,
          lastUpdate: new Date().toISOString()
        }))
      },

      // Connection actions
      setConnectionStatus: (status: RealtimeState['connectionStatus']) => {
        set((state: RealtimeState) => {
          // Only update if status actually changed to prevent unnecessary re-renders
          if (state.connectionStatus === status) {
            return state
          }
          
          return {
            ...state,
            connectionStatus: status,
            isConnected: status === 'connected',
            lastUpdate: new Date().toISOString()
          }
        })
      },

      // Reset entire store
      resetStore: () => {
        set(() => ({
          ...initialState,
          lastUpdate: new Date().toISOString()
        }))
      }
    })),
    {
      name: 'realtime-store',
      partialize: (state: RealtimeState) => ({
        // Only persist essential data, not the entire state
        devices: state.devices,
        stats: state.stats,
        messageCount: state.messageCount,
        lastStatsUpdate: state.lastStatsUpdate
      })
    }
  )
)

// Simple, stable selectors to prevent infinite loops
export const useMessages = () => useRealtimeStore(state => state.messages)
export const useDevices = () => useRealtimeStore(state => state.devices)
export const useStats = () => useRealtimeStore(state => state.stats)
export const useMessageCount = () => useRealtimeStore(state => state.messageCount)
export const useDeviceCount = () => useRealtimeStore(state => state.devices.length)
export const useActiveDeviceCount = () => useRealtimeStore(state => state.activeDeviceCount)
export const useLastUpdate = () => useRealtimeStore(state => state.lastUpdate)
export const useLastStatsUpdate = () => useRealtimeStore(state => state.lastStatsUpdate)

// Connection status selector - use individual selectors to prevent object recreation
export const useConnectionStatus = () => useRealtimeStore(state => state.connectionStatus)
export const useIsConnected = () => useRealtimeStore(state => state.isConnected)

// Computed selectors - use useMemo in components instead of store selectors to prevent infinite loops
export const useActiveDevices = () => {
  const devices = useDevices()
  return devices.filter(device => device.status === 'connected')
}

export const useMessagesByDevice = (deviceId: string) => {
  const messages = useMessages()
  return messages.filter(message => message.deviceId === deviceId)
}

export const useDeviceById = (deviceId: string) => {
  const devices = useDevices()
  return devices.find(device => device.id === deviceId)
}

export const useRecentMessages = (limit: number = 50) => {
  const messages = useMessages()
  return messages.slice(-limit)
}
