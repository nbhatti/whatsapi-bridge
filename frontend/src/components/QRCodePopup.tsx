'use client'

import React, { useState, useEffect, useRef } from 'react'

interface QRCodePopupProps {
  deviceId: string
  deviceName: string
  qrCodeData: string
  onClose: () => void
  onStatusChange?: (deviceId: string, newStatus: string) => void
}

export const QRCodePopup: React.FC<QRCodePopupProps> = ({
  deviceId,
  deviceName,
  qrCodeData,
  onClose,
  onStatusChange
}) => {
  const [status, setStatus] = useState<string>('qr')
  const [qrImageSrc, setQrImageSrc] = useState<string>('')
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [imageError, setImageError] = useState<boolean>(false)
  const statusCheckInterval = useRef<NodeJS.Timeout>()
  const qrRefreshInterval = useRef<NodeJS.Timeout>()

  // Load QR image from backend
  const loadQRImage = () => {
    const qrImageUrl = `/api/qr-image/${deviceId}?t=${Date.now()}`
    setQrImageSrc(qrImageUrl)
    setImageError(false)
    setLastRefresh(new Date().toLocaleTimeString())
  }

  // Check device status
  const checkDeviceStatus = async () => {
    try {
      const response = await fetch(`/backend-api/v1/devices/${deviceId}/status`, {
        headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123' }
      })
      
      if (response.ok) {
        const result = await response.json()
        const currentStatus = result.data?.status || result.status
        setStatus(currentStatus)
        
        // If status changed from 'qr', we should close
        if (currentStatus !== 'qr') {
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current)
          }
          if (qrRefreshInterval.current) {
            clearInterval(qrRefreshInterval.current)
          }
          
          // Notify parent of status change
          if (onStatusChange) {
            onStatusChange(deviceId, currentStatus)
          }
          
          // Auto-close after showing success/error message
          setTimeout(() => {
            onClose()
          }, currentStatus === 'ready' ? 2000 : 3000)
        }
      }
    } catch (error) {
      console.error('Status check failed:', error)
    }
  }

  // Refresh QR image periodically (QR codes can expire)
  const refreshQRImage = () => {
    loadQRImage()
  }

  // Initialize and cleanup
  useEffect(() => {
    // Load initial QR image
    loadQRImage()
    
    // Start monitoring (check status every 2 seconds)
    statusCheckInterval.current = setInterval(checkDeviceStatus, 2000)
    
    // Refresh QR image every 30 seconds (QR codes typically expire)
    qrRefreshInterval.current = setInterval(refreshQRImage, 30000)
    
    // Initial status check
    setTimeout(checkDeviceStatus, 1000)
    
    // Cleanup function
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current)
      }
    }
  }, [deviceId])

  const getStatusDisplay = () => {
    switch (status) {
      case 'qr':
        return {
          text: '📱 Waiting for scan...',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'ready':
        return {
          text: '✅ Connected! Closing...',
          color: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'error':
        return {
          text: '❌ Connection failed',
          color: 'bg-red-100 text-red-800 border-red-200'
        }
      default:
        return {
          text: '🔄 Checking status...',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            WhatsApp QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border mb-4 ${statusDisplay.color}`}>
          {statusDisplay.text}
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          {qrImageSrc && !imageError ? (
            <img
              src={qrImageSrc}
              alt="WhatsApp QR Code"
              className="border-2 border-gray-300 rounded-lg shadow-sm w-72 h-72"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <div className="w-72 h-72 border-2 border-gray-300 rounded-lg shadow-sm flex items-center justify-center bg-gray-50">
              {imageError ? (
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Failed to load QR code</p>
                  <button 
                    onClick={loadQRImage}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Loading QR code...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Device Info */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            <strong>Device:</strong> {deviceName}
          </p>
          {lastRefresh && (
            <p className="text-xs text-gray-400 mt-2">
              QR code refreshed at {lastRefresh}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500">
          <p>Scan this QR code with WhatsApp on your phone:</p>
          <ol className="mt-2 text-left space-y-1">
            <li>1. Open WhatsApp on your phone</li>
            <li>2. Tap Menu → Linked Devices</li>
            <li>3. Tap "Link a Device"</li>
            <li>4. Scan this QR code</li>
          </ol>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
