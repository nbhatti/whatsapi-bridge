import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('query') || '';

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock message generation
    const mockMessages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i + 1}`,
      text: i % 5 === 0 ? 'This is a longer message that demonstrates how text wrapping works in the chat interface. It should wrap properly and maintain good readability.' : `Message ${i + 1}`,
      timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString(),
      sender: i % 3 === 0 ? 'me' : 'other',
      status: i % 3 === 0 ? (['sent', 'delivered', 'read'][Math.floor(Math.random() * 3)]) : 'read',
      type: i % 10 === 0 ? 'image' : i % 15 === 0 ? 'file' : 'text',
      replyTo: i % 7 === 0 ? {
        id: `msg-${Math.max(1, i - 3)}`,
        text: 'Previous message',
        sender: i % 2 === 0 ? 'You' : `Contact ${chatId.split('-')[1]}`
      } : undefined,
      mentions: i % 8 === 0 ? ['@john', '@jane'] : undefined,
      attachmentUrl: i % 10 === 0 ? '/api/placeholder/300/200' : undefined,
      attachmentName: i % 15 === 0 ? `document-${i}.pdf` : undefined
    }));

    // Filter by query if provided
    const filteredMessages = query 
      ? mockMessages.filter(msg => 
          msg.text.toLowerCase().includes(query.toLowerCase())
        )
      : mockMessages;

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    const response = {
      success: true,
      messages: paginatedMessages,
      pagination: {
        page,
        limit,
        total: filteredMessages.length,
        totalPages: Math.ceil(filteredMessages.length / limit),
        hasMore: endIndex < filteredMessages.length
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
