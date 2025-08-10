import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock data for contacts - shared with main contacts route
const contacts = new Map([
  ['contact-1', {
    id: 'contact-1',
    name: 'John Smith',
    phone: '+1234567890',
    avatar: '/avatars/john.jpg',
    presence: 'online',
    lastSeen: null,
    isBlocked: false,
    isFavorite: true,
    notes: 'Project lead',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-21T15:30:00Z'
  }],
  ['contact-2', {
    id: 'contact-2',
    name: 'Sarah Johnson',
    phone: '+1234567891',
    avatar: null,
    presence: 'offline',
    lastSeen: '2024-01-21T14:30:00Z',
    isBlocked: false,
    isFavorite: false,
    notes: '',
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-21T14:30:00Z'
  }]
])

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contactId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params

    const contactId = params.contactId
    const contact = contacts.get(contactId)

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check if contact is blocked
    if (contact.isBlocked) {
      return NextResponse.json(
        { error: 'Cannot send message to blocked contact' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { message, type = 'text' } = body

    if (!message || (typeof message !== 'string' && !message.content)) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Process different message types
    let messageContent
    let messageType = type

    switch (type) {
      case 'text':
        messageContent = typeof message === 'string' ? message : message.text
        break
      case 'media':
        messageContent = message.content
        messageType = message.mediaType || 'image'
        break
      case 'location':
        messageContent = {
          latitude: message.latitude,
          longitude: message.longitude,
          address: message.address
        }
        break
      default:
        return NextResponse.json(
          { error: 'Unsupported message type' },
          { status: 400 }
        )
    }

    // Create chat if it doesn't exist and send message
    const chatId = `chat-${contactId}`
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const sentMessage = {
      id: messageId,
      chatId,
      contactId,
      contactPhone: contact.phone,
      type: messageType,
      content: messageContent,
      timestamp: new Date().toISOString(),
      status: 'sent', // In real app: pending -> sent -> delivered -> read
      sender: authResult.user!.id,
      direction: 'outbound'
    }

    // In a real implementation, you would:
    // 1. Create or get the chat record from your database
    // 2. Save the message to your database
    // 3. Make API call to backend to send WhatsApp message
    // 4. Update message status based on WhatsApp response
    // 5. Emit real-time events via Socket.IO
    // 6. Handle message delivery status updates

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: sentMessage,
      chat: {
        id: chatId,
        contactId,
        contactName: contact.name,
        contactPhone: contact.phone,
        contactAvatar: contact.avatar,
        contactPresence: contact.presence,
        lastMessage: {
          content: typeof messageContent === 'string' ? messageContent : `[${messageType}]`,
          timestamp: sentMessage.timestamp,
          type: messageType
        },
        unreadCount: 0,
        updatedAt: sentMessage.timestamp
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error sending quick chat message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
