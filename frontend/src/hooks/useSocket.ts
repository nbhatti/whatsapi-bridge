'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { useRealtimeStore, Message } from '../stores/realtime-store'

interface UseSocketOptions {
  autoConnect?: boolean
  deviceId?: string
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  connect: (deviceId?: string) => void
  disconnect: () => void
  emit: (event: string, data?: unknown) => void
  subscribeToDevice: (deviceId: string) => void
  unsubscribeFromDevice: (deviceId: string) => void
}

export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { 
    autoConnect = true, 
    deviceId: initialDeviceId,
    onConnect, 
    onDisconnect, 
    onError 
  } = options

  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [subscribedDevices, setSubscribedDevices] = useState<Set<string>>(new Set())
  const isConnectingRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get store actions for dispatching real-time updates
  const { 
    addMessage, 
    updateMessage,
    updateDevice, 
    addDevice,
    removeDevice,
    updateStats,
    setConnectionStatus
  } = useRealtimeStore()

  const connect = useCallback((deviceId?: string) => {
    // Prevent multiple connection attempts
    if (socketRef.current?.connected || !user || isConnectingRef.current) {
      return
    }

    // Skip socket connection in development if backend is not available
    if (process.env.NEXT_PUBLIC_DISABLE_SOCKET === 'true') {
      console.log('Socket.IO disabled via NEXT_PUBLIC_DISABLE_SOCKET environment variable')
      return
    }

    // Cleanup any existing socket first
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    isConnectingRef.current = true;
    setIsConnected(false);

    const targetDeviceId = deviceId || initialDeviceId;
    
    if (!targetDeviceId) {
      console.error("useSocket: No device ID provided for connection.");
      isConnectingRef.current = false;
      return;
    }

    // Create socket connection with authentication parameters
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000';
    const websocketPath = process.env.NEXT_PUBLIC_WEBSOCKET_PATH || '/ws';
    
    console.log(`🔌 Attempting to connect to device namespace: /device/${targetDeviceId}`);
    
    // Connect to the device-specific namespace
    const socket = io(`${websocketUrl}/device/${targetDeviceId}`, {
      path: websocketPath,
      query: {
        apiKey: process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123',
      },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', socket.id)
      isConnectingRef.current = false
      setIsConnected(true)
      setConnectionStatus('connected')
      onConnect?.()
      
      // Subscribe to device events
      setSubscribedDevices(prev => new Set(prev).add(targetDeviceId))
      
      // Emit device subscription
      socket.emit('subscribe', { deviceId: targetDeviceId })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      isConnectingRef.current = false
      setIsConnected(false)
      setConnectionStatus('disconnected')
      setSubscribedDevices(new Set())
      onDisconnect?.()
      
      // Only attempt reconnect for unexpected disconnections
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('🔄 Attempting to reconnect in 2 seconds...')
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user && !socketRef.current?.connected) {
            connect(deviceId)
          }
        }, 2000)
      }
    })

    socket.on('connect_error', (error) => {
      console.error('🚫 Socket connection error:', error)
      isConnectingRef.current = false
      setIsConnected(false)
      setConnectionStatus('error')
      onError?.(error)
      
      // Retry connection after error
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (user && !socketRef.current?.connected) {
          connect(deviceId)
        }
      }, 5000)
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setConnectionStatus('connected')
      
      // Resubscribe to device after reconnection
      if (targetDeviceId) {
        socket.emit('subscribe', { deviceId: targetDeviceId })
      }
    })

    socket.on('reconnect_error', (error) => {
      console.error('🔄❌ Socket reconnection error:', error)
    })

    // Device-specific event listeners based on backend socket events
    socket.on('qr', (data) => {
      console.log('📱 QR Code received for device:', data.deviceId)
      updateDevice({
        id: data.deviceId,
        qrCode: data.qr,
        status: 'connecting',
        updatedAt: new Date().toISOString()
      } as any)
    })

    socket.on('ready', (data) => {
      console.log('✅ Device ready:', data.deviceId)
      updateDevice({
        id: data.deviceId,
        status: 'connected',
        waDeviceId: data.phoneNumber || data.deviceId,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any)
    })

    socket.on('authenticated', (data) => {
      console.log('🔐 Device authenticated:', data.deviceId)
      updateDevice({
        id: data.deviceId,
        status: 'connected',
        waDeviceId: data.phoneNumber,
        name: data.clientName || 'WhatsApp Device',
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any)
    })

    socket.on('message', (data) => {
      console.log('💬 Message received:', data.message.id)
      const message: Message = {
        id: data.message.id,
        from: data.message.from || data.message.author,
        to: data.message.to || data.message.chatId,
        body: data.message.body,
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        type: data.message.type || 'text',
        deviceId: data.deviceId,
        status: 'delivered',
        metadata: data.message.hasMedia ? {
          mimeType: data.message.mimetype,
          fileName: data.message.filename,
          size: data.message.filesize
        } : undefined
      }
      addMessage(message)
    })

    socket.on('state', (data) => {
      console.log('📊 Device state changed:', data.deviceId, data.status)
      updateDevice({
        id: data.deviceId,
        status: data.status === 'CONNECTED' ? 'connected' : 
                data.status === 'DISCONNECTED' ? 'disconnected' :
                data.status === 'CONNECTING' ? 'connecting' : 'error',
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any)
    })

    socket.on('disconnected', (data) => {
      console.log('🔌 Device disconnected:', data.deviceId)
      updateDevice({
        id: data.deviceId,
        status: 'disconnected',
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any)
    })

    // Message acknowledgment events
    socket.on('message-ack', (data) => {
      console.log('✅ Message acknowledged:', data.messageId)
      updateMessage(data.messageId, { status: 'delivered' })
    })

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error)
      onError?.(new Error(error.message || 'Socket error'))
    })

    socketRef.current = socket
    socket.connect()
  }, [user, initialDeviceId]) // Remove callback functions to prevent infinite loops

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      isConnectingRef.current = false
      setSubscribedDevices(new Set())
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const emit = (event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  const subscribeToDevice = useCallback((deviceId: string) => {
    if (deviceId !== initialDeviceId) {
      connect(deviceId)
    }
  }, [initialDeviceId]) // Remove connect from deps to prevent infinite loops

  const unsubscribeFromDevice = useCallback((deviceId: string) => {
    if (socketRef.current?.connected) {
      setSubscribedDevices(prev => {
        const newSet = new Set(prev)
        newSet.delete(deviceId)
        return newSet
      })
    }
  }, [])

  // Auto-connect when user is available and autoConnect is true
  useEffect(() => {
    if (autoConnect && user && !socketRef.current?.connected && !isConnectingRef.current) {
      connect()
    }

    // Cleanup on unmount or when user logs out  
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
        setIsConnected(false)
        isConnectingRef.current = false
        setSubscribedDevices(new Set())
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [user, autoConnect, connect])

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    subscribeToDevice,
    unsubscribeFromDevice
  }
}

export default useSocket
