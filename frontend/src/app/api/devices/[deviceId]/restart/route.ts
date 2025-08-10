import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock database - same as other device routes
const devices = new Map([
  ['device-1', {
    id: 'device-1',
    name: 'Main WhatsApp',
    waDeviceId: 'wa-device-123',
    status: 'connected' as const,
    lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    userId: 'user-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    stats: {
      messagesReceived: 1250,
      messagesSent: 890,
      contacts: 156,
      groups: 23
    }
  }],
  ['device-2', {
    id: 'device-2',
    name: 'Business Account',
    waDeviceId: 'wa-device-456',
    status: 'disconnected' as const,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    userId: 'user-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    stats: {
      messagesReceived: 430,
      messagesSent: 320,
      contacts: 89,
      groups: 8
    }
  }],
  ['device-3', {
    id: 'device-3',
    name: 'Support Bot',
    waDeviceId: 'wa-device-789',
    status: 'error' as const,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    userId: 'user-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    stats: {
      messagesReceived: 75,
      messagesSent: 45,
      contacts: 34,
      groups: 2
    }
  }]
])

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
            const params = await context.params

    const deviceId = params.deviceId
    const device = devices.get(deviceId)

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (device.userId !== authResult.user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update device status to connecting
    const updatedDevice = {
      ...device,
      status: 'connecting' as const,
      updatedAt: new Date().toISOString()
    }

    devices.set(deviceId, updatedDevice)

    // In a real implementation, you would:
    // 1. Stop the existing WhatsApp Web.js client
    // 2. Clean up resources
    // 3. Start a new client instance
    // 4. Emit real-time status updates via Socket.IO

    // Simulate async restart process
    setTimeout(() => {
      const finalStatus = Math.random() > 0.2 ? 'connected' : 'error'
      const restartedDevice = {
        ...updatedDevice,
        status: finalStatus as const,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      devices.set(deviceId, restartedDevice)
      
      // In a real app, you would emit Socket.IO event here
      console.log(`Device ${deviceId} restart completed with status: ${finalStatus}`)
    }, 3000)

    return NextResponse.json({
      message: 'Device restart initiated',
      device: updatedDevice
    }, { status: 200 })
  } catch (error) {
    console.error('Error restarting device:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
