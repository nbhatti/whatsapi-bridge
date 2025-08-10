'use client'

import React, { useState } from 'react'
import { Device } from '../../stores/realtime-store'
import { useSocketContext } from '../../contexts/SocketContext'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface DeviceActionsProps {
  devices: Device[]
  onRefresh?: () => void
}

export const DeviceActions: React.FC<DeviceActionsProps> = ({ 
  devices, 
  onRefresh 
}) => {
  const { isConnected, emit } = useSocketContext()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant?: 'warning' | 'danger' | 'info';
    onConfirm?: () => void;
  }>({ open: false, title: '', message: '' })

  const connectedDevices = devices.filter(d => d.status === 'connected')
  const disconnectedDevices = devices.filter(d => d.status === 'disconnected')
  const errorDevices = devices.filter(d => d.status === 'error')

  const showNoSelectionAlert = () => {
    setConfirmDialog({
      open: true,
      title: 'No Devices Selected',
      message: 'Please select devices to perform this action.',
      variant: 'info',
      onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false })
    })
  }

  const showDeleteConfirmation = (action: () => void) => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete ${selectedDevices.length} device(s)? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, open: false })
        action()
      }
    })
  }

  const performBulkAction = async (action: 'restart' | 'delete') => {
    setLoading(action)

    try {
      const promises = selectedDevices.map(async (deviceId) => {
        if (action === 'restart') {
          if (isConnected) {
            emit('device:restart', deviceId)
          }
          return fetch(`/api/devices/${deviceId}/restart`, {
            method: 'POST',
          })
        } else if (action === 'delete') {
          return fetch(`/api/devices/${deviceId}`, {
            method: 'DELETE',
          })
        }
      })

      await Promise.all(promises)
      setSelectedDevices([])
      onRefresh?.()
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
      setConfirmDialog({
        open: true,
        title: 'Action Failed',
        message: `Failed to ${action} some devices. Please try again.`,
        variant: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false })
      })
    } finally {
      setLoading(null)
    }
  }

  const handleBulkAction = (action: 'restart' | 'delete') => {
    if (selectedDevices.length === 0) {
      showNoSelectionAlert()
      return
    }

    if (action === 'delete') {
      showDeleteConfirmation(() => performBulkAction(action))
    } else {
      performBulkAction(action)
    }
  }

  const showRestartErrorsConfirmation = () => {
    setConfirmDialog({
      open: true,
      title: 'Restart Error Devices',
      message: `Restart ${errorDevices.length} device(s) with errors?`,
      variant: 'warning',
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, open: false })
        performRestartAllErrorDevices()
      }
    })
  }

  const performRestartAllErrorDevices = async () => {
    setLoading('restart-errors')

    try {
      const promises = errorDevices.map(async (device) => {
        if (isConnected) {
          emit('device:restart', device.id)
        }
        return fetch(`/api/devices/${device.id}/restart`, {
          method: 'POST',
        })
      })

      await Promise.all(promises)
      onRefresh?.()
    } catch (error) {
      console.error('Failed to restart error devices:', error)
      setConfirmDialog({
        open: true,
        title: 'Restart Failed',
        message: 'Failed to restart some devices. Please try again.',
        variant: 'warning',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false })
      })
    } finally {
      setLoading(null)
    }
  }

  const handleRestartAllErrorDevices = () => {
    if (errorDevices.length === 0) return
    showRestartErrorsConfirmation()
  }

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    )
  }

  const selectAllDevices = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([])
    } else {
      setSelectedDevices(devices.map(d => d.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {devices.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Devices</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {connectedDevices.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connected</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {disconnectedDevices.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Disconnected</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600 dark:text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {errorDevices.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh All
          </button>

          {errorDevices.length > 0 && (
            <button
              onClick={handleRestartAllErrorDevices}
              disabled={loading === 'restart-errors'}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {loading === 'restart-errors' ? (
                <svg className="w-4 h-4 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Restart Error Devices ({errorDevices.length})
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {devices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Bulk Actions
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDevices.length} of {devices.length} selected
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedDevices.length === devices.length}
                  onChange={selectAllDevices}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Select All
                </span>
              </label>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedDevices.length > 0 && (
                  <span>Selected devices: {selectedDevices.join(', ')}</span>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleBulkAction('restart')}
                disabled={selectedDevices.length === 0 || loading === 'restart'}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading === 'restart' ? (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restarting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Restart Selected
                  </>
                )}
              </button>

              <button
                onClick={() => handleBulkAction('delete')}
                disabled={selectedDevices.length === 0 || loading === 'delete'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading === 'delete' ? (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Device Selection List */}
          {devices.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {devices.map(device => (
                  <label key={device.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.id)}
                      onChange={() => toggleDeviceSelection(device.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {device.name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          device.status === 'connected' ? 'bg-green-100 text-green-800' :
                          device.status === 'disconnected' ? 'bg-red-100 text-red-800' :
                          device.status === 'connecting' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {device.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {device.id}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={() => confirmDialog.onConfirm?.()}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={loading !== null}
        confirmText={confirmDialog.variant === 'danger' ? 'Delete' : 'Confirm'}
      />
    </div>
  )
}
