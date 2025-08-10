import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock database - in a real app, you would use your database
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }
    const params = await context.params

    const deviceId = params.deviceId
    const device = devices.get(deviceId)

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (device.userId !== authResult.user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(device, { status: 200 })
  } catch (error) {
    console.error('Error fetching device:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }
    const params = await context.params

    const deviceId = params.deviceId
    const device = devices.get(deviceId)

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (device.userId !== authResult.user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, status } = body

    // Update device
    const updatedDevice = {
      ...device,
      ...(name && { name: name.trim() }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    }

    devices.set(deviceId, updatedDevice)

    return NextResponse.json(updatedDevice, { status: 200 })
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }
    const params = await context.params

    const deviceId = params.deviceId
    const device = devices.get(deviceId)

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (device.userId !== authResult.user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete device
    devices.delete(deviceId)

    // In a real implementation, you would also:
    // 1. Stop the WhatsApp Web.js client
    // 2. Clean up any related resources
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json({ message: 'Device deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
