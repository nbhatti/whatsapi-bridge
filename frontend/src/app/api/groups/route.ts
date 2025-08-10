import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock data for groups - in a real app, this would come from your database
const groups = new Map([
  ['group-1', {
    id: 'group-1',
    name: 'Project Team',
    description: 'Main project coordination group',
    participants: ['user-1', 'user-2', 'user-3', 'user-4'],
    participantCount: 4,
    icon: null,
    inviteCode: 'https://chat.whatsapp.com/invite1',
    isAdmin: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    lastMessage: {
      text: 'Great work everyone!',
      timestamp: '2024-01-20T15:30:00Z',
      sender: 'user-2'
    }
  }],
  ['group-2', {
    id: 'group-2',
    name: 'Family Chat',
    description: 'Family updates and photos',
    participants: ['user-1', 'user-5', 'user-6'],
    participantCount: 3,
    icon: '/avatars/family-group.jpg',
    inviteCode: 'https://chat.whatsapp.com/invite2',
    isAdmin: false,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-21T12:15:00Z',
    lastMessage: {
      text: 'See you at dinner!',
      timestamp: '2024-01-21T12:15:00Z',
      sender: 'user-5'
    }
  }],
  ['group-3', {
    id: 'group-3',
    name: 'Support Team',
    description: 'Customer support coordination',
    participants: ['user-1', 'user-7', 'user-8', 'user-9', 'user-10'],
    participantCount: 5,
    icon: null,
    inviteCode: 'https://chat.whatsapp.com/invite3',
    isAdmin: true,
    createdAt: '2024-01-08T14:00:00Z',
    updatedAt: '2024-01-21T16:45:00Z',
    lastMessage: {
      text: 'Ticket #1234 resolved',
      timestamp: '2024-01-21T16:45:00Z',
      sender: 'user-7'
    }
  }]
])

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
    }

    // In a real implementation, you would:
    // 1. Make an API call to the backend to get groups for the authenticated user
    // 2. Filter groups based on user permissions
    // 3. Include participant details

    const userGroups = Array.from(groups.values())

    return NextResponse.json(userGroups, { status: 200 })
  } catch (error) {
    console.error('Error fetching groups:', error)
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
    const { name, description, participants } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      )
    }

    // Generate a new group ID
    const groupId = `group-${Date.now()}`
    const inviteCode = `https://chat.whatsapp.com/invite${Date.now()}`

    const newGroup = {
      id: groupId,
      name: name.trim(),
      description: description?.trim() || '',
      participants: [...participants, authResult.user!.id], // Include creator
      participantCount: participants.length + 1,
      icon: null,
      inviteCode,
      isAdmin: true, // Creator is admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null
    }

    // Store the group
    groups.set(groupId, newGroup)

    // In a real implementation, you would:
    // 1. Save the group to your database
    // 2. Make API call to backend to create WhatsApp group
    // 3. Add participants to the group
    // 4. Emit real-time events via Socket.IO

    return NextResponse.json(newGroup, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
