import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock Redis stats (in a real implementation, you'd query actual Redis)
const mockRedisStats = {
  connectedClients: 5,
  usedMemory: '2.5MB',
  usedMemoryHuman: '2.50M',
  keyspaceHits: 12567,
  keyspaceMisses: 234,
  totalCommandsProcessed: 45678,
  instantaneousOpsPerSec: 12,
  uptime: 86400 * 3, // 3 days in seconds
}

// Mock message queue data
const mockQueueData = [
  { name: 'pending', value: 15 },
  { name: 'processing', value: 3 },
  { name: 'completed', value: 1248 },
  { name: 'failed', value: 7 },
]

// Mock analytics data
function generateAnalyticsData() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Generate hourly data for today
  const hourlyData = []
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0')
    hourlyData.push({
      hour: `${hour}:00`,
      messagesSent: Math.floor(Math.random() * 50) + 10,
      messagesReceived: Math.floor(Math.random() * 80) + 20,
      successRate: Math.floor(Math.random() * 15) + 85, // 85-100% success rate
    })
  }

  // Calculate totals for today
  const totalMessagesSentToday = hourlyData.reduce((sum, item) => sum + item.messagesSent, 0)
  const totalMessagesReceivedToday = hourlyData.reduce((sum, item) => sum + item.messagesReceived, 0)
  const avgSuccessRate = Math.round(hourlyData.reduce((sum, item) => sum + item.successRate, 0) / hourlyData.length)

  // Active devices count (from device status)
  const activeDevicesCount = 2 // Connected devices from our mock data

  // Queue depth (total pending + processing)
  const queueDepth = mockQueueData
    .filter(item => ['pending', 'processing'].includes(item.name))
    .reduce((sum, item) => sum + item.value, 0)

  // Device health scores
  const deviceHealthScores = [
    { deviceId: 'device-1', deviceName: 'Main WhatsApp', healthScore: 95, status: 'excellent' },
    { deviceId: 'device-2', deviceName: 'Business Account', healthScore: 45, status: 'poor' },
    { deviceId: 'device-3', deviceName: 'Support Bot', healthScore: 25, status: 'critical' },
  ]

  // Weekly trend data
  const weeklyTrend = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    weeklyTrend.push({
      day: dayName,
      messages: Math.floor(Math.random() * 1000) + 500,
      successRate: Math.floor(Math.random() * 10) + 90,
    })
  }

  return {
    summary: {
      messagesSentToday: totalMessagesSentToday,
      messagesReceivedToday: totalMessagesReceivedToday,
      successRate: avgSuccessRate,
      activeDevices: activeDevicesCount,
      queueDepth,
    },
    hourlyData,
    weeklyTrend,
    queueStats: mockQueueData,
    deviceHealth: deviceHealthScores,
    redisStats: mockRedisStats,
    lastUpdated: now.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const analyticsData = generateAnalyticsData()
    return NextResponse.json(analyticsData, { status: 200 })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
