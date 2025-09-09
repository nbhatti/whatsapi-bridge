'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useRealtimeStore } from '../stores/realtime-store'
import { useAuth } from '../hooks/use-auth'
import { backendAPI, BackendDevice } from '../lib/backend-api';

interface SocketContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: unknown) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
  autoConnect?: boolean
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ 
  children, 
  autoConnect = true 
}) => {
  const { user } = useAuth()
  const { setConnectionStatus } = useRealtimeStore()
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<SocketContextType['connectionStatus']>('disconnected')
  const [initialDeviceId, setInitialDeviceId] = useState<string | undefined>(undefined);

  // Fetch devices on mount to get an initial device ID for auto-connection
  useEffect(() => {
    const fetchInitialDevice = async () => {
      if (user && autoConnect && !initialDeviceId) {
        try {
          const devices = await backendAPI.getDevices();
          if (devices && devices.length > 0) {
            // Find the first ready device, or take the first one available
            const readyDevice = devices.find(d => d.status === 'ready');
            setInitialDeviceId(readyDevice ? readyDevice.deviceId : devices[0].deviceId);
          }
        } catch (error) {
          console.error("Failed to fetch initial device for socket connection:", error);
        }
      }
    };
    fetchInitialDevice();
  }, [user, autoConnect, initialDeviceId]);

  // Memoize callback functions to prevent infinite loops
  const handleConnect = useCallback(() => {
    setCurrentStatus('connected')
    setConnectionError(null)
  }, [])

  const handleDisconnect = useCallback(() => {
    setCurrentStatus('disconnected')
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('Socket connection error:', error)
    setCurrentStatus('error')
    setConnectionError(error.message)
  }, [])

  const { isConnected, connect, disconnect, emit } = useSocket({
    autoConnect: autoConnect && !!initialDeviceId, // Only auto-connect if we have a device ID
    deviceId: initialDeviceId,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError
  })

  // Update store whenever currentStatus changes, but only if it actually changed
  useEffect(() => {
    setConnectionStatus(currentStatus)
  }, [currentStatus]) // Remove setConnectionStatus from deps to prevent infinite loops

  // Log connection changes
  useEffect(() => {
    if (connectionError) {
      console.error('Socket connection error:', connectionError)
    }
  }, [connectionError])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SocketContextType>(() => ({
    isConnected,
    connectionStatus: currentStatus,
    connect,
    disconnect,
    emit
  }), [isConnected, currentStatus, connect, disconnect, emit])

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
