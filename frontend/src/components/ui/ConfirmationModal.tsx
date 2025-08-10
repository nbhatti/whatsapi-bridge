'use client'

import React from 'react'
import { Card, CardContent } from '@mui/material'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-600 dark:text-red-400'
        }
      case 'warning':
        return {
          icon: '⚠️',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          titleColor: 'text-orange-600 dark:text-orange-400'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          titleColor: 'text-blue-600 dark:text-blue-400'
        }
      default:
        return {
          icon: '⚠️',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          titleColor: 'text-orange-600 dark:text-orange-400'
        }
    }
  }

  const styles = getTypeStyles()

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (!loading) {
      onConfirm()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="text-2xl">{styles.icon}</div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${styles.titleColor}`}>
                {title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {message}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${styles.confirmButton}`}
                >
                  {loading && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
