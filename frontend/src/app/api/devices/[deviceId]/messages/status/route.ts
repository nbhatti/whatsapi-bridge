import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock message status data for each device
const deviceMessageStatus = new Map([
  ['device-1', {
    deviceId: 'device-1',
    deviceName: 'Main WhatsApp',
    status: 'connected',
    health: {
      score: 95,
      status: 'excellent',
      uptime: 98.5,
      avgResponseTime: 1200, // ms
      errorRate: 1.5, // %
      lastHealthCheck: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    },
    messageStats: {
      totalSent: 1847,
      totalReceived: 2156,
      totalFailed: 23,
      successRate: 98.8,
      avgMessagesPerHour: 76,
      peakHour: '14:00',
      peakMessages: 145,
    },
    recentMessages: [
      {
        id: 'msg-001',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        type: 'sent',
        status: 'delivered',
        recipient: '+1234567890',
        responseTime: 1150,
      },
      {
        id: 'msg-002',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        type: 'received',
        status: 'processed',
        sender: '+0987654321',
        responseTime: 850,
      },
      {
        id: 'msg-003',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        type: 'sent',
        status: 'failed',
        recipient: '+1122334455',
        error: 'Network timeout',
        responseTime: null,
      },
    ],
  }],
  ['device-2', {
    deviceId: 'device-2',
    deviceName: 'Business Account',
    status: 'disconnected',
    health: {
      score: 45,
      status: 'poor',
      uptime: 67.3,
      avgResponseTime: 3500, // ms
      errorRate: 15.2, // %
      lastHealthCheck: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    messageStats: {
      totalSent: 567,
      totalReceived: 423,
      totalFailed: 89,
      successRate: 84.8,
      avgMessagesPerHour: 23,
      peakHour: '10:00',
      peakMessages: 67,
    },
    recentMessages: [
      {
        id: 'msg-201',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        type: 'sent',
        status: 'failed',
        recipient: '+5566778899',
        error: 'Device disconnected',
        responseTime: null,
      },
      {
        id: 'msg-202',
        timestamp: new Date(Date.now() - 7500000).toISOString(), // 2.1 hours ago
        type: 'sent',
        status: 'delivered',
        recipient: '+4455667788',
        responseTime: 2800,
      },
    ],
  }],
  ['device-3', {
    deviceId: 'device-3',
    deviceName: 'Support Bot',
    status: 'error',
    health: {
      score: 25,
      status: 'critical',
      uptime: 34.7,
      avgResponseTime: 5200, // ms
      errorRate: 28.5, // %
      lastHealthCheck: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    },
    messageStats: {
      totalSent: 234,
      totalReceived: 145,
      totalFailed: 67,
      successRate: 71.5,
      avgMessagesPerHour: 8,
      peakHour: '09:00',
      peakMessages: 23,
    },
    recentMessages: [
      {
        id: 'msg-301',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        type: 'sent',
        status: 'failed',
        recipient: '+9988776655',
        error: 'Authentication failed',
        responseTime: null,
      },
    ],
  }],
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const { deviceId } = await params

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' }, 
        { status: 400 }
      )
    }

    const deviceStatus = deviceMessageStatus.get(deviceId)
    
    if (!deviceStatus) {
      return NextResponse.json(
        { error: 'Device not found' }, 
        { status: 404 }
      )
    }

    // Add real-time timestamp
    const enrichedStatus = {
      ...deviceStatus,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(enrichedStatus, { status: 200 })
  } catch (error) {
    console.error('Error fetching device message status:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
