'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@mui/material'

interface NotificationToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  position?: 'top' | 'bottom'
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  duration = 5000,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          titleColor: 'text-green-800 dark:text-green-200',
          messageColor: 'text-green-600 dark:text-green-300'
        }
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          titleColor: 'text-red-800 dark:text-red-200',
          messageColor: 'text-red-600 dark:text-red-300'
        }
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
          titleColor: 'text-orange-800 dark:text-orange-200',
          messageColor: 'text-orange-600 dark:text-orange-300'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          titleColor: 'text-blue-800 dark:text-blue-200',
          messageColor: 'text-blue-600 dark:text-blue-300'
        }
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          titleColor: 'text-blue-800 dark:text-blue-200',
          messageColor: 'text-blue-600 dark:text-blue-300'
        }
    }
  }

  const styles = getTypeStyles()
  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4'

  if (!isOpen && !isVisible) return null

  return (
    <div className={`fixed ${positionClasses} right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <Card className={`w-96 max-w-[calc(100vw-2rem)] shadow-lg border ${styles.bgColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="text-lg flex-shrink-0">{styles.icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${styles.titleColor} mb-1`}>
                {title}
              </h4>
              <p className={`text-sm ${styles.messageColor} leading-relaxed`}>
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors ${styles.messageColor}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
