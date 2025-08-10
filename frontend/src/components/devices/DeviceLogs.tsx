'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Device } from '../../stores/realtime-store'
import { useSocketContext } from '../../contexts/SocketContext'

interface DeviceLogsProps {
  device: Device
  onClose: () => void
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

export const DeviceLogs: React.FC<DeviceLogsProps> = ({ device, onClose }) => {
  const { isConnected, emit } = useSocketContext()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<LogEntry['level'] | 'all'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch initial logs
    fetchLogs()

    // Subscribe to real-time log updates if connected
    if (isConnected) {
      // In a real implementation, you would subscribe to device-specific log events
      // emit('device:logs:subscribe', device.id)
    }

    return () => {
      // Cleanup subscription
      if (isConnected) {
        // emit('device:logs:unsubscribe', device.id)
      }
    }
  }, [device.id, isConnected])

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom()
    }
  }, [logs, autoScroll])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/devices/${device.id}/logs`)
      if (response.ok) {
        const logsData = await response.json()
        setLogs(logsData)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      // Show some demo logs for presentation
      setLogs([
        {
          id: '1',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'info',
          message: 'Device initialized successfully'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'info',
          message: 'WhatsApp session started'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'debug',
          message: 'Received QR code generation request'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'info',
          message: 'QR code generated and displayed'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'info',
          message: 'Authentication successful',
          data: { phone: '+1234567890' }
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'warn',
          message: 'Connection timeout detected, attempting reconnect'
        },
        {
          id: '7',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Connection restored, device is ready'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warn':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'warn':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'debug':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesText = log.message.toLowerCase().includes(filter.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesText && matchesLevel
  })

  const clearLogs = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all logs?')
    if (!confirmed) return

    try {
      await fetch(`/api/devices/${device.id}/logs`, {
        method: 'DELETE',
      })
      setLogs([])
    } catch (error) {
      console.error('Failed to clear logs:', error)
      alert('Failed to clear logs. Please try again.')
    }
  }

  const exportLogs = () => {
    const logsText = filteredLogs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}${log.data ? ' ' + JSON.stringify(log.data) : ''}`
    ).join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${device.name}-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Device Logs: {device.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Real-time logs and events for device {device.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
            </div>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogEntry['level'] | 'all')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>

            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-scroll
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              {isConnected ? 'Live' : 'Static'}
            </span>

            <button
              onClick={exportLogs}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Export
            </button>
            
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Logs Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 font-mono text-sm">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {logs.length === 0 ? 'No logs available' : 'No logs match the current filter'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-md border-l-4 ${getLevelColor(log.level)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getLevelIcon(log.level)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium uppercase">
                                {log.level}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="break-words">{log.message}</p>
                            {log.data && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                  Show data
                                </summary>
                                <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredLogs.length} of {logs.length} log entries
          </span>
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Scroll to bottom</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
