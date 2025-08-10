import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

const BACKEND_URL = 'http://localhost:3000/api/v1'
const API_KEY = 'test-api-key-123'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication first
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    // Proxy request to WhatsApp backend
    const backendResponse = await fetch(`${BACKEND_URL}/devices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('Backend error:', backendResponse.status, errorText)
      return NextResponse.json(
        { error: 'Backend service unavailable' }, 
        { status: backendResponse.status }
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    // Use provided name or generate one automatically
    const deviceName = name && typeof name === 'string' && name.trim().length > 0 
      ? name.trim() 
      : `Device-${Date.now()}`

    // Generate a new device ID
    const deviceId = `device-${Date.now()}`
    const waDeviceId = `wa-device-${Date.now()}`

    const newDevice = {
      id: deviceId,
      name: deviceName,
      waDeviceId,
      status: 'connecting' as const,
      lastSeen: new Date().toISOString(),
      userId: authResult.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        messagesReceived: 0,
        messagesSent: 0,
        contacts: 0,
        groups: 0
      }
    }

    // Store the device
    devices.set(deviceId, newDevice)

    // In a real implementation, you would:
    // 1. Save the device to your database
    // 2. Initialize the WhatsApp Web.js client
    // 3. Start the QR code generation process
    // 4. Emit real-time events via Socket.IO

    return NextResponse.json(newDevice, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
