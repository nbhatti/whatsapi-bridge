'use client'

import React, { useEffect, useState } from 'react'
import { useSocketContext } from '../contexts/SocketContext'
import { 
  useDevices, 
  useStats, 
  useActiveDevices,
  useRecentMessages
} from '../stores/realtime-store'

export const RealtimeExample: React.FC = () => {
  const { isConnected, connectionStatus, emit } = useSocketContext()
  const devices = useDevices()
  const activeDevices = useActiveDevices()
  const recentMessages = useRecentMessages(10)
  const stats = useStats()
  
  const [testMessage, setTestMessage] = useState('')

  // Subscribe to stats updates when connected
  useEffect(() => {
    if (isConnected) {
      emit('stats:subscribe')
      
      // Subscribe to device updates for user's devices
      devices.forEach(device => {
        emit('device:subscribe', device.id)
      })

      return () => {
        emit('stats:unsubscribe')
        devices.forEach(device => {
          emit('device:unsubscribe', device.id)
        })
      }
    }
  }, [isConnected, devices, emit])

  const handleSendTestMessage = () => {
    if (!testMessage.trim() || !isConnected || activeDevices.length === 0) return
    
    const device = activeDevices[0] // Use first active device
    emit('message:send', {
      deviceId: device.id,
      to: '1234567890', // Test number
      message: testMessage,
      type: 'text'
    })
    
    setTestMessage('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Real-time Socket.IO Integration</h1>
        
        {/* Connection Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={getStatusColor(connectionStatus)}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Device Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Devices ({devices.length})</h2>
          {devices.length === 0 ? (
            <p className="text-gray-500">No devices available</p>
          ) : (
            <div className="space-y-2">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <span className="font-medium">{device.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({device.waDeviceId})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'connected' ? 'bg-green-500' : 
                      device.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-600">{device.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeDevices.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              {activeDevices.length} device(s) active
            </p>
          )}
        </div>

        {/* Recent Messages */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Recent Messages ({recentMessages.length})</h2>
          {recentMessages.length === 0 ? (
            <p className="text-gray-500">No recent messages</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentMessages.map(message => (
                <div key={message.id} className="p-3 bg-white rounded border text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-blue-600">{message.from}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.body}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">To: {message.to}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      message.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      message.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      message.status === 'read' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {message.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Statistics</h2>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activeDevices}</div>
                <div className="text-sm text-gray-600">Active Devices</div>
              </div>
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.messagesPerHour}</div>
                <div className="text-sm text-gray-600">Messages/Hour</div>
              </div>
              <div className="bg-white p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.messagesPerDay}</div>
                <div className="text-sm text-gray-600">Messages/Day</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No statistics available</p>
          )}
        </div>

        {/* Test Message Sending */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Send Test Message</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected || activeDevices.length === 0}
            />
            <button
              onClick={handleSendTestMessage}
              disabled={!testMessage.trim() || !isConnected || activeDevices.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          {activeDevices.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              No active devices available for sending messages
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RealtimeExample
