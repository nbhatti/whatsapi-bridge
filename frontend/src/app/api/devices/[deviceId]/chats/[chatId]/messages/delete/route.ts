import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_KEY = process.env.WHATSAPP_API_KEY || 'test-api-key-123';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ deviceId: string; chatId: string }> }
) {
  const params = await props.params;
  try {
    const { deviceId, chatId } = params;
    const body = await request.json();
    
    console.log('🗑️ Deleting chat message via proxy:', { deviceId, chatId, body });

    const response = await fetch(`${BACKEND_URL}/api/v1/devices/${deviceId}/chats/${chatId}/messages/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || `HTTP ${response.status}: ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data || data
    });
    
  } catch (error) {
    console.error('❌ Chat message delete proxy error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
