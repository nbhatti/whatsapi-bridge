/**
 * API Route to proxy QR PNG requests to backend
 * This is needed because img src can't send custom headers for authentication
 */

import { NextRequest } from 'next/server'

export async function GET(request: NextRequest, props: { params: Promise<{ deviceId: string }> }) {
  const params = await props.params;
  const deviceId = params.deviceId

  if (!deviceId) {
    return new Response('Device ID required', { status: 400 })
  }

  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123'
    
    // Fetch QR image from backend with proper headers
    const response = await fetch(`${backendUrl}/api/v1/devices/${deviceId}/qr.png`, {
      headers: {
        'X-API-Key': apiKey,
      },
    })

    if (!response.ok) {
      console.error(`Backend QR fetch failed: ${response.status} ${response.statusText}`)
      return new Response('Failed to fetch QR code', { status: response.status })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    
    // Return the image with proper headers
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('QR image proxy error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
