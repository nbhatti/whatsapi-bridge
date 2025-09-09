import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key-123';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    const backendUrl = `${BACKEND_BASE_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    
    // Handle binary media responses
    if (contentType?.startsWith('image/') || 
        contentType?.startsWith('video/') || 
        contentType?.startsWith('audio/') ||
        contentType?.startsWith('application/')) {
      
      const buffer = await response.arrayBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': response.headers.get('content-length') || '',
          'Content-Disposition': response.headers.get('content-disposition') || '',
          'Cache-Control': 'private, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Handle JSON responses
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with backend' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const body = await request.text();
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    const backendUrl = `${BACKEND_BASE_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with backend' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const body = await request.text();
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    const backendUrl = `${BACKEND_BASE_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with backend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    const backendUrl = `${BACKEND_BASE_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with backend' },
      { status: 500 }
    );
  }
}
