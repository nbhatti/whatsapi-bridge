'use client'

import React, { useState } from 'react'
import { useSocketContext } from '../../contexts/SocketContext'
import { DeviceActions } from './DeviceActions'
import { DeviceLogs } from './DeviceLogs'
import { QRCodePopup } from '../QRCodePopup'

// Status configuration interface
interface StatusConfig {
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  label: string
  description: string
  color: string
  icon: string
  action: string | null
}

// Device interface matching the API
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
  statusConfig?: StatusConfig
  stats?: {
    messagesReceived: number
    messagesSent: number
    contacts: number
    groups: number
  }
}

interface DeviceListProps {
  devices: Device[]
  onDeviceUpdate?: () => void
}

interface DeviceStatusBadgeProps {
  device: Device
  onStatusAction?: (device: Device, action: string) => void
}

const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ device, onStatusAction }) => {
  // Use device's statusConfig if available, otherwise fall back to legacy status mapping
  const getStatusConfig = (device: Device) => {
    if (device.statusConfig) {
      return {
        color: device.statusConfig.color,
        text: device.statusConfig.label,
        description: device.statusConfig.description,
        icon: device.statusConfig.icon,
        action: device.statusConfig.action
      }
    }

    // Legacy fallback for devices without statusConfig
    switch (device.status) {
      case 'connected':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Connected',
          description: 'Device is online and ready',
          icon: '✅',
          action: null
        }
      case 'disconnected':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Disconnected',
          description: 'Device is offline',
          icon: '⚪',
          action: 'Reconnect'
        }
      case 'connecting':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Scan QR Code',
          description: 'Scan the QR code to connect',
          icon: '📱',
          action: 'View QR Code'
        }
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Connection Error',
          description: 'Failed to connect to WhatsApp',
          icon: '❌',
          action: 'Retry Connection'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Unknown',
          description: 'Status unknown',
          icon: '❓',
          action: null
        }
    }
  }

  const config = getStatusConfig(device)
  
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <span className="text-sm">{config.icon}</span>
        {config.text}
      </span>
      
      {/* Action button for status-specific actions */}
      {config.action && onStatusAction && (
        <button
          onClick={() => onStatusAction(device, config.action!)}
          className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title={config.description}
        >
          {config.action}
        </button>
      )}
      
      {/* Status description tooltip */}
      <div className="group relative">
        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {config.description}
        </div>
      </div>
    </div>
  )
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceUpdate }) => {
  const { isConnected, emit } = useSocketContext()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [actionLoading, setActionLoading] = useState<{ [deviceId: string]: string | null }>({})
  const [monitoringDevices, setMonitoringDevices] = useState<Set<string>>(new Set())
  const [showQRPopup, setShowQRPopup] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string>('')
  const [qrDevice, setQrDevice] = useState<Device | null>(null)

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} minutes ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`
    }
  }

  const handleDeviceAction = async (device: Device, action: 'restart' | 'delete') => {
    setActionLoading(prev => ({ ...prev, [device.id]: action }))
    
    try {
      if (action === 'restart') {
        // Emit Socket.IO event if connected
        if (isConnected) {
          emit('device:restart', device.id)
        }
        
        // Use backend API for restart (though it may not have restart endpoint)
        try {
          const response = await fetch(`/backend-api/v1/devices/${device.id}/restart`, {
            method: 'POST',
            headers: { 
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123',
              'Content-Type': 'application/json'
            }
          })
          
          if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to restart device: ${response.statusText}`)
          }
        } catch (error) {
          console.warn('Backend restart endpoint not available:', error)
          // Continue anyway as this might not be implemented yet
        }
        
        // Trigger parent refresh if callback provided
        if (onDeviceUpdate) {
          onDeviceUpdate()
        }
        
      } else if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete "${device.name}"? This action cannot be undone.`)) {
          // Use backend API for delete
          const response = await fetch(`/backend-api/v1/devices/${device.id}`, {
            method: 'DELETE',
            headers: { 
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123'
            }
          })
          
          if (!response.ok) {
            throw new Error(`Failed to delete device: ${response.statusText}`)
          }
          
          // Trigger parent refresh if callback provided
          if (onDeviceUpdate) {
            onDeviceUpdate()
          }
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} device:`, error)
      // Avoid blocking alerts; log instead (hook up toast/snackbar if desired)
      console.warn(`Failed to ${action} device: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setActionLoading(prev => ({ ...prev, [device.id]: null }))
    }
  }

  const handleShowLogs = (device: Device) => {
    setSelectedDevice(device)
    setShowLogs(true)
  }

  const handleStatusAction = async (device: Device, action: string) => {
    setActionLoading(prev => ({ ...prev, [device.id]: 'status-action' }))
    
    try {
      switch (action) {
        case 'View QR Code':
          // Fetch QR code from backend and show in modal
          try {
            const qrResponse = await fetch(`/backend-api/v1/devices/${device.id}/qr`, {
              headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123' }
            })
            
            if (qrResponse.ok) {
              const qrResult = await qrResponse.json()
              if (qrResult.data?.qrCode) {
                // Show QR code in modal popup
                setQrCodeData(qrResult.data.qrCode)
                setQrDevice(device)
                setShowQRPopup(true)
              } else {
                console.warn('QR code not available. Device may already be connected.')
              }
            } else {
              console.warn('Failed to get QR code. Please try again.')
            }
          } catch (error) {
            console.error('Failed to get QR code:', error)
            console.warn('Failed to get QR code. Please try again.')
          }
          break
          
        case 'Retry Connection':
          // Attempt to restart the device connection
          await handleDeviceAction(device, 'restart')
          break
          
        case 'Reconnect':
          // Check device status to see if it can be reconnected
          if (onDeviceUpdate) {
            onDeviceUpdate()
          }
          break
          
        default:
          console.log(`Status action not implemented: ${action}`)
      }
    } catch (error) {
      console.error(`Failed to handle status action ${action}:`, error)
      console.warn(`Failed to ${action}. Please try again.`)
    } finally {
      setActionLoading(prev => ({ ...prev, [device.id]: null }))
    }
  }

  return (
    <>
      <div className="overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Devices ({devices.length})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span>
                {isConnected ? 'Live updates' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {devices.map((device) => (
            <div key={device.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {device.name}
                        </h4>
                        <DeviceStatusBadge 
                          device={device} 
                          onStatusAction={handleStatusAction}
                        />
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        {device.status === 'connected' && device.phoneNumber ? (
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{device.phoneNumber}</span>
                          </span>
                        ) : (
                          <span>ID: {device.id}</span>
                        )}
                        <span>•</span>
                        <span>Last seen: {formatLastSeen(device.lastSeen)}</span>
                        <span>•</span>
                        <span>Created: {new Date(device.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Device Stats */}
                      {device.stats && (
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{device.stats.messagesSent + device.stats.messagesReceived} messages</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            <span>{device.stats.contacts} contacts</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{device.stats.groups} groups</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleShowLogs(device)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="View Logs"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDeviceAction(device, 'restart')}
                    disabled={actionLoading[device.id] === 'restart'}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                    title="Restart Device"
                  >
                    {actionLoading[device.id] === 'restart' ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeviceAction(device, 'delete')}
                    disabled={actionLoading[device.id] === 'delete'}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Delete Device"
                  >
                    {actionLoading[device.id] === 'delete' ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Logs Modal */}
      {showLogs && selectedDevice && (
        <DeviceLogs
          device={selectedDevice}
          onClose={() => {
            setShowLogs(false)
            setSelectedDevice(null)
          }}
        />
      )}
      
      {/* QR Code Popup Modal */}
      {showQRPopup && qrDevice && qrCodeData && (
        <QRCodePopup
          deviceId={qrDevice.id}
          deviceName={qrDevice.name}
          qrCodeData={qrCodeData}
          onClose={() => {
            setShowQRPopup(false)
            setQrDevice(null)
            setQrCodeData('')
          }}
          onStatusChange={(deviceId, newStatus) => {
            // Refresh the device list when status changes
            if (onDeviceUpdate) {
              onDeviceUpdate()
            }
            // Close the QR popup if status changed
            if (newStatus !== 'qr') {
              setShowQRPopup(false)
              setQrDevice(null)
              setQrCodeData('')
            }
          }}
        />
      )}
    </>
  )
}
