import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

const BACKEND_URL = 'http://localhost:3000/api/v1'
const API_KEY = 'test-api-key-123'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ deviceId: string; chatId: string }> }
) {
  const params = await props.params;
  try {
    // Verify authentication first
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const { deviceId, chatId } = params
    const url = new URL(request.url)
    const queryString = url.search

    // URL encode the chatId to handle special characters like @
    const encodedChatId = encodeURIComponent(chatId)

    // Proxy request to WhatsApp backend
    const backendResponse = await fetch(`${BACKEND_URL}/devices/${deviceId}/chats/${encodedChatId}/messages${queryString}`, {
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
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
