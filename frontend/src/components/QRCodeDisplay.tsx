'use client'

import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  value, 
  size = 300, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      }).catch((error) => {
        console.error('Failed to generate QR code:', error)
      })
    }
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      className={`border-2 border-gray-300 rounded-lg ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
}
