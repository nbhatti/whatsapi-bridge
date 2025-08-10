import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const address = formData.get('address') as string;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      chatId,
      message,
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/${file.name}` // In a real app, you'd upload to storage
      } : undefined,
      location: latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      } : undefined
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
