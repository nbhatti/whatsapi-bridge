'use client'

import React, { useEffect, useState } from 'react'
import { useSocketContext } from '../contexts/SocketContext'
import { useConnectionStatus } from '../stores/realtime-store'
import { testSocketConnection, logEnvironmentVariables } from '../utils/socket-test'

export function SocketDebugger() {
  const { isConnected, connect, disconnect, emit } = useSocketContext()
  const connectionStatus = useConnectionStatus()
  const [showDebug, setShowDebug] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const runConnectionTest = async () => {
    const results: string[] = []
    
    // Log environment variables
    logEnvironmentVariables()
    
    // Test socket connection
    const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000'
    const path = process.env.NEXT_PUBLIC_WEBSOCKET_PATH || '/ws'
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
    const deviceId = 'test-device-id'
    
    await testSocketConnection(url, path, apiKey, deviceId)
    
    results.push('Connection test completed. Check console for details.')
    setTestResults(results)
  }

  const testEmit = () => {
    if (isConnected) {
      emit('test', { message: 'Hello from debugger', timestamp: Date.now() })
      setTestResults(prev => [...prev, 'Test message emitted'])
    } else {
      setTestResults(prev => [...prev, 'Cannot emit: socket not connected'])
    }
  }

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Show Socket Debugger"
      >
        🔌
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Socket Debugger</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {connectionStatus}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Connected:</span>
          <span className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={connect}
            disabled={isConnected}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Disconnect
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={runConnectionTest}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Test Connection
          </button>
          <button
            onClick={testEmit}
            disabled={!isConnected}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Emit
          </button>
        </div>
        
        {testResults.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Test Results:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
