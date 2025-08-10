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
    lastSeen: null, // null when online
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
  }],
  ['contact-3', {
    id: 'contact-3',
    name: 'Mike Brown',
    phone: '+1234567892',
    avatar: '/avatars/mike.jpg',
    presence: 'away',
    lastSeen: '2024-01-21T12:00:00Z',
    isBlocked: false,
    isFavorite: true,
    notes: 'Designer',
    createdAt: '2024-01-08T16:00:00Z',
    updatedAt: '2024-01-21T12:00:00Z'
  }],
  ['contact-4', {
    id: 'contact-4',
    name: 'Emma Wilson',
    phone: '+1234567893',
    avatar: null,
    presence: 'online',
    lastSeen: null,
    isBlocked: false,
    isFavorite: false,
    notes: 'HR Manager',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-21T16:00:00Z'
  }],
  ['contact-5', {
    id: 'contact-5',
    name: 'David Davis',
    phone: '+1234567894',
    avatar: '/avatars/david.jpg',
    presence: 'offline',
    lastSeen: '2024-01-20T18:45:00Z',
    isBlocked: false,
    isFavorite: false,
    notes: '',
    createdAt: '2024-01-05T09:30:00Z',
    updatedAt: '2024-01-20T18:45:00Z'
  }]
])

export async function GET(
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

    // In a real implementation, verify user has access to this contact

    return NextResponse.json(contact, { status: 200 })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    const { name, notes, isFavorite, isBlocked } = body

    // Update contact properties
    const updatedContact = {
      ...contact,
      ...(name && { name: name.trim() }),
      ...(notes !== undefined && { notes: notes.trim() }),
      ...(isFavorite !== undefined && { isFavorite }),
      ...(isBlocked !== undefined && { isBlocked }),
      updatedAt: new Date().toISOString()
    }

    contacts.set(contactId, updatedContact)

    // In a real implementation, you would:
    // 1. Update the contact in your database
    // 2. Make API call to backend to update contact in WhatsApp
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json(updatedContact, { status: 200 })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    contacts.delete(contactId)

    // In a real implementation, you would:
    // 1. Delete the contact from your database
    // 2. Make API call to backend to remove contact from WhatsApp
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
