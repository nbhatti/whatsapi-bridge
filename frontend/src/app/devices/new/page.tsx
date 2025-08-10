'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@mui/material'
import { Navigation } from '../../../components/Navigation'
import { useSocketContext } from '../../../contexts/SocketContext'
import { useAuth } from '../../../hooks/use-auth'
import { useRouter } from 'next/navigation'

export default function NewDevicePage() {
  const { user } = useAuth()
  const { isConnected, emit } = useSocketContext()
  const router = useRouter()
  
  const [deviceId, setDeviceId] = useState('')
  const [authStatus, setAuthStatus] = useState<'creating' | 'qr' | 'authenticating' | 'authenticated' | 'failed'>('creating')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [qrRefreshInterval, setQrRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [qrRefreshKey, setQrRefreshKey] = useState(0)
  
  // Use ref to prevent multiple device creations
  const isCreatingDevice = useRef(false)

  const createDeviceAndGetQR = useCallback(async () => {
    // Prevent multiple device creations
    if (isCreatingDevice.current) {
      return
    }
    
    isCreatingDevice.current = true
    setLoading(true)
    setError('')
    setAuthStatus('creating')

    try {
      // Create device via backend API
      const response = await fetch('/backend-api/v1/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123'
        },
        body: JSON.stringify({
          name: `Device-${Date.now()}` // Auto-generate name
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create device: ${response.statusText}`)
      }

      const device = await response.json()
      
      // Try to extract device ID from various possible locations
      let newDeviceId = null
      
      // Check all possible locations for device ID
      if (device.data) {
        newDeviceId = device.data.deviceId || device.data.id
      }
      
      // Fallback to root level
      if (!newDeviceId) {
        newDeviceId = device.deviceId || device.id
      }
      
      // If still no ID found, try other common patterns
      if (!newDeviceId && device.success && device.data) {
        // Sometimes the entire data object IS the device
        const deviceData = device.data
        newDeviceId = deviceData.deviceId || deviceData.id || deviceData._id || deviceData.uuid
      }
      
      if (!newDeviceId) {
        throw new Error('No device ID found in backend response.')
      }
      
      setDeviceId(newDeviceId)
      
      // Start polling for device status until QR is available
      await waitForQRAvailable(newDeviceId)

    } catch (err) {
      console.error('Device creation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to create device')
      setAuthStatus('failed')
    } finally {
      setLoading(false)
      isCreatingDevice.current = false // Reset guard flag
    }
  }, []) // Empty dependency array since this function shouldn't change

  // Auto-create device and fetch QR on component mount
  useEffect(() => {
    if (!user || deviceId) return
    createDeviceAndGetQR()
  }, [user, createDeviceAndGetQR, deviceId])

  // Status checking interval
  useEffect(() => {
    if (!deviceId || authStatus === 'authenticated') return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/backend-api/v1/devices/${deviceId}/status`, {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123' }
        })
        
        if (response.ok) {
          const result = await response.json()
          const status = result.data?.status || result.status
          
          if (status === 'ready' || status === 'authenticated') {
            setAuthStatus('authenticated')
            // Redirect to devices list after 2 seconds
            setTimeout(() => {
              router.push('/devices')
            }, 2000)
          } else if (status === 'error' || status === 'failed') {
            setAuthStatus('failed')
          } else if (status === 'authenticating') {
            setAuthStatus('authenticating')
          }
        }
      } catch (error) {
        console.error('Status check failed:', error)
      }
    }

    // Start status monitoring
    const interval = setInterval(checkStatus, 2000)
    setStatusCheckInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [deviceId, authStatus, router])

  // QR image refresh interval - refresh QR image every 3 seconds when showing QR
  useEffect(() => {
    if (authStatus !== 'qr' || !deviceId) return

    // Start QR refresh interval
    const interval = setInterval(() => {
      setQrRefreshKey(prev => prev + 1) // This will force the image to reload
    }, 3000) // Refresh every 3 seconds
    
    setQrRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [authStatus, deviceId])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) clearInterval(statusCheckInterval)
      if (qrRefreshInterval) clearInterval(qrRefreshInterval)
    }
  }, [])


  const waitForQRAvailable = async (deviceId: string) => {
    const maxAttempts = 30 // Maximum 30 attempts (30 seconds)
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/backend-api/v1/devices/${deviceId}/status`, {
          headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123' }
        })
        
        if (response.ok) {
          const result = await response.json()
          const status = result.data?.status || result.status
          
          if (status === 'qr') {
            setAuthStatus('qr')
            return // Success - ready to display QR
          } else if (status === 'ready' || status === 'authenticated') {
            setAuthStatus('authenticated')
            return
          } else if (status === 'error' || status === 'failed') {
            throw new Error('Device initialization failed')
          }
          // Status is still 'initializing' - continue polling
        }
      } catch (error) {
        if (attempts === maxAttempts - 1) {
          throw error // Re-throw on final attempt
        }
      }
      
      attempts++
      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Timeout waiting for device to initialize. Please try again.')
  }

  const retryCreation = () => {
    setError('')
    setDeviceId('')
    isCreatingDevice.current = false // Reset guard flag
    createDeviceAndGetQR()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to create a device.</p>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Devices
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Authenticate Device
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Scan this QR code with WhatsApp on your phone to authenticate the device
          </p>
        </div>

        {/* QR Authentication */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code Display */}
              {authStatus === 'creating' && (
                <div className="p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Creating device...</p>
                </div>
              )}

              {authStatus === 'qr' && deviceId && (
                <div className="p-8 bg-white rounded-lg border-2 border-gray-200">
                  <img 
                    key={qrRefreshKey}
                    src={`/api/qr-image/${deviceId}?t=${Date.now()}`}
                    alt="WhatsApp QR Code" 
                    className="w-64 h-64"
                    onError={(e) => {
                      // QR image failed to load, could show fallback if needed
                    }}
                  />
                </div>
              )}


              {/* Status Messages */}
              <div className="text-center">
                {authStatus === 'creating' && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Setting up new device...</span>
                  </div>
                )}
                
                {authStatus === 'qr' && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Waiting for authentication...</span>
                  </div>
                )}
                
                {authStatus === 'authenticating' && (
                  <div className="flex items-center justify-center space-x-2 text-orange-600">
                    <div className="animate-spin w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                    <span>Authenticating...</span>
                  </div>
                )}
                
                {authStatus === 'authenticated' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Authentication successful!</span>
                    </div>
                    <p className="text-sm text-gray-600">Redirecting to devices...</p>
                  </div>
                )}
                
                {authStatus === 'failed' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Failed to create or authenticate device</span>
                    </div>
                    <button
                      onClick={retryCreation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md max-w-md">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-orange-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium">
                  Real-time connection unavailable. QR code updates may be delayed.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </>
  )
}
