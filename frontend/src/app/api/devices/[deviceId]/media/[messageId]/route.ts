import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'test-api-key-123'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ deviceId: string; messageId: string }> }
) {
  const params = await props.params;
  try {
    const { deviceId, messageId } = params
    const searchParams = request.nextUrl.searchParams
    const mediaType = searchParams.get('type') || 'audio'
    
    console.log(`🎵 Media request: ${deviceId}/${messageId} (${mediaType})`)

    // Forward request to WhatsApp backend
    const backendUrl = `${BACKEND_URL}/devices/${deviceId}/media/${messageId}?type=${mediaType}`
    
    console.log(`📡 Proxying to: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'User-Agent': 'WhatsApp-Frontend/1.0',
      },
    })

    if (!response.ok) {
      console.error(`❌ Backend media request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Media not found: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get the media content
    const mediaBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    console.log(`✅ Media loaded: ${mediaBuffer.byteLength} bytes, ${contentType}`)

    // Return the media with appropriate headers
    return new NextResponse(mediaBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': mediaBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('❌ Media proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to load media' },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
