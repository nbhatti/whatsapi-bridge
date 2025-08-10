'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@mui/material'
import { DeviceList } from '../../components/devices/DeviceList'
import { DeviceActions } from '../../components/devices/DeviceActions'
import { Navigation } from '../../components/Navigation'
import { useSocketContext } from '../../contexts/SocketContext'
import { useAuth } from '../../hooks/use-auth'
import { backendAPI, BackendDevice } from '../../lib/backend-api'
import { ConfirmationModal } from '../../components/ui/ConfirmationModal'
import { NotificationToast } from '../../components/ui/NotificationToast'

// Device interface for frontend display
interface Device {
  id: string
  name: string
  waDeviceId?: string
  phoneNumber?: string | null
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastSeen?: string
  userId?: string
  createdAt: string
  updatedAt?: string
  stats?: {
    messagesReceived: number
    messagesSent: number
    contacts: number
    groups: number
  }
}

// Device status mapping with user-friendly labels
const STATUS_CONFIG = {
  ready: {
    status: 'connected' as const,
    label: 'Connected',
    description: 'Device is online and ready',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
    action: null
  },
  qr: {
    status: 'connecting' as const,
    label: 'Scan QR Code',
    description: 'Scan the QR code to connect',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '📱',
    action: 'View QR Code'
  },
  error: {
    status: 'error' as const,
    label: 'Connection Error',
    description: 'Failed to connect to WhatsApp',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
    action: 'Retry Connection'
  },
  disconnected: {
    status: 'disconnected' as const,
    label: 'Disconnected',
    description: 'Device is offline',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '⚪',
    action: 'Reconnect'
  },
  loading: {
    status: 'connecting' as const,
    label: 'Connecting...',
    description: 'Establishing connection',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '⏳',
    action: null
  }
}

// Convert backend device to frontend device format
function adaptBackendDevice(backendDevice: BackendDevice): Device & { statusConfig: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG] } {
  const statusConfig = STATUS_CONFIG[backendDevice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.disconnected
  
  return {
    id: backendDevice.deviceId,
    name: backendDevice.clientName || backendDevice.name || `Device ${backendDevice.deviceId.slice(0, 8)}`,
    waDeviceId: backendDevice.deviceId,
    phoneNumber: backendDevice.phoneNumber,
    status: statusConfig.status,
    statusConfig,
    lastSeen: new Date(backendDevice.lastSeen).toISOString(),
    createdAt: new Date(backendDevice.createdAt).toISOString(),
    updatedAt: new Date(backendDevice.lastSeen).toISOString(),
    stats: backendDevice.stats || {
      messagesReceived: 0,
      messagesSent: 0,
      contacts: 0,
      groups: 0
    }
  }
}

export default function DevicesPage() {
  const { user } = useAuth()
  const { isConnected, emit } = useSocketContext()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal and notification states
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({ isOpen: false, title: '', message: '', type: 'info' })

  // Device management functions using backend API
  const fetchDevices = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      
      const backendDevices = await backendAPI.getDevices()
      const adaptedDevices = backendDevices.map(adaptBackendDevice)
      setDevices(adaptedDevices)
    } catch (error) {
      console.error('Failed to fetch devices:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect to backend server')
    } finally {
      setLoading(false)
    }
  }, [])

  const createDevice = useCallback(async (name: string): Promise<boolean> => {
    try {
      setError(null)
      
      await backendAPI.createDevice(name)
      await fetchDevices() // Refresh the list
      return true
    } catch (error) {
      console.error('Failed to create device:', error)
      setError(error instanceof Error ? error.message : 'Failed to create device')
      return false
    }
  }, [fetchDevices])

  const updateDevice = useCallback(async (deviceId: string, updates: Partial<Pick<Device, 'name' | 'status'>>): Promise<boolean> => {
    try {
      setError(null)
      
      // Note: Backend API doesn't have update endpoint, so we'll fetch device status instead
      await backendAPI.getDeviceStatus(deviceId)
      await fetchDevices() // Refresh the list
      return true
    } catch (error) {
      console.error('Failed to update device:', error)
      setError(error instanceof Error ? error.message : 'Failed to update device')
      return false
    }
  }, [fetchDevices])

  const deleteDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      setError(null)
      
      await backendAPI.deleteDevice(deviceId)
      await fetchDevices() // Refresh the list
      return true
    } catch (error) {
      console.error('Failed to delete device:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete device')
      return false
    }
  }, [fetchDevices])

  const restartDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      setError(null)
      
      // Note: Backend doesn't have restart endpoint, but we can check status
      await backendAPI.getDeviceStatus(deviceId)
      await fetchDevices() // Refresh the list
      return true
    } catch (error) {
      console.error('Failed to restart device:', error)
      setError(error instanceof Error ? error.message : 'Failed to restart device')
      return false
    }
  }, [fetchDevices])

  const handleDeleteAllDevices = useCallback(() => {
    setShowDeleteAllModal(true)
  }, [])

  const confirmDeleteAllDevices = useCallback(async (): Promise<void> => {
    setDeleteAllLoading(true)

    try {
      setError(null)
      
      const response = await fetch('/backend-api/v1/devices/delete-all', {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete all devices: ${response.statusText}`)
      }

      await fetchDevices() // Refresh the list
      setShowDeleteAllModal(false)
      
      // Show success notification
      setNotification({
        isOpen: true,
        title: 'Success',
        message: `Successfully deleted all ${devices.length} device${devices.length !== 1 ? 's' : ''}. All WhatsApp connections have been terminated.`,
        type: 'success'
      })
      
    } catch (error) {
      console.error('Failed to delete all devices:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete all devices'
      setError(errorMessage)
      setShowDeleteAllModal(false)
      
      // Show error notification
      setNotification({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error'
      })
    } finally {
      setDeleteAllLoading(false)
    }
  }, [fetchDevices, devices.length])

  useEffect(() => {
    // Load devices on component mount
    fetchDevices()
  }, [fetchDevices])

  useEffect(() => {
    if (isConnected && user) {
      // Subscribe to device updates for this user
      emit('stats:subscribe')
    }
  }, [isConnected, user, emit])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view devices.</p>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Device Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your WhatsApp devices and monitor their status
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {/* Device Actions */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Quick Actions
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add new devices or perform bulk operations
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={fetchDevices}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => window.location.href = '/devices/new'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add New Device
                  </button>
                  {devices.length > 0 && (
                    <button
                      onClick={handleDeleteAllDevices}
                      disabled={loading || deleteAllLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete All Devices
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span className="text-sm text-gray-500">
                  • Real-time updates {isConnected ? 'enabled' : 'disabled'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Device List */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading devices...</p>
                </div>
              ) : devices.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No devices found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Get started by adding your first WhatsApp device
                  </p>
                  <button
                    onClick={() => window.location.href = '/devices/new'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Device
                  </button>
                </div>
              ) : (
                <DeviceList devices={devices} onDeviceUpdate={fetchDevices} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      
      {/* Delete All Devices Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={confirmDeleteAllDevices}
        title="Delete All Devices"
        message={`Are you sure you want to delete all ${devices.length} device${devices.length !== 1 ? 's' : ''}? This action cannot be undone and will permanently remove all WhatsApp device connections.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
        loading={deleteAllLoading}
      />
      
      {/* Success/Error Notification Toast */}
      <NotificationToast
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={5000}
      />
    </>
  )
}
