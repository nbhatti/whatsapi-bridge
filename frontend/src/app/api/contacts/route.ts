import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock data for contacts - in a real app, this would come from your database
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

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const presence = searchParams.get('presence')
    const favorite = searchParams.get('favorite')

    let userContacts = Array.from(contacts.values())

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      userContacts = userContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.phone.includes(search)
      )
    }

    // Filter by presence status
    if (presence && presence !== 'all') {
      userContacts = userContacts.filter(contact => contact.presence === presence)
    }

    // Filter by favorite status
    if (favorite === 'true') {
      userContacts = userContacts.filter(contact => contact.isFavorite)
    }

    // Sort by name
    userContacts.sort((a, b) => a.name.localeCompare(b.name))

    // In a real implementation, you would:
    // 1. Make an API call to the backend to get contacts for the authenticated user
    // 2. Get real-time presence information from WhatsApp
    // 3. Apply proper pagination

    return NextResponse.json({
      contacts: userContacts,
      total: userContacts.length
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching contacts:', error)
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
    const { contacts: importContacts, source } = body

    if (!importContacts || !Array.isArray(importContacts) || importContacts.length === 0) {
      return NextResponse.json(
        { error: 'Contacts array is required' },
        { status: 400 }
      )
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    }

    for (const contact of importContacts) {
      try {
        const { name, phone } = contact

        if (!name || !phone) {
          results.errors.push(`Missing name or phone for contact: ${JSON.stringify(contact)}`)
          continue
        }

        // Check if contact already exists
        const existingContact = Array.from(contacts.values()).find(c => c.phone === phone)
        if (existingContact) {
          results.skipped++
          continue
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/
        if (!phoneRegex.test(phone)) {
          results.errors.push(`Invalid phone number format: ${phone}`)
          continue
        }

        // Create new contact
        const contactId = `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newContact = {
          id: contactId,
          name: name.trim(),
          phone: phone.trim(),
          avatar: null,
          presence: 'unknown', // Will be updated when presence is checked
          lastSeen: null,
          isBlocked: false,
          isFavorite: false,
          notes: contact.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        contacts.set(contactId, newContact)
        results.imported++

      } catch (error) {
        results.errors.push(`Error processing contact: ${error.message}`)
      }
    }

    // In a real implementation, you would:
    // 1. Save contacts to your database
    // 2. Make API call to backend to sync with WhatsApp
    // 3. Check presence status for each contact
    // 4. Emit real-time events via Socket.IO

    return NextResponse.json({
      success: true,
      results,
      source
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
