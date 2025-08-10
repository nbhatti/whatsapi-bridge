import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from "@/lib/server-auth";

// Mock data for groups - shared with main groups route
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

// Mock contacts for participant selection
const contacts = new Map([
  ['user-2', { id: 'user-2', name: 'John Smith', phone: '+1234567890' }],
  ['user-3', { id: 'user-3', name: 'Sarah Johnson', phone: '+1234567891' }],
  ['user-4', { id: 'user-4', name: 'Mike Brown', phone: '+1234567892' }],
  ['user-5', { id: 'user-5', name: 'Emma Wilson', phone: '+1234567893' }],
  ['user-6', { id: 'user-6', name: 'David Davis', phone: '+1234567894' }],
  ['user-7', { id: 'user-7', name: 'Lisa Garcia', phone: '+1234567895' }],
  ['user-8', { id: 'user-8', name: 'Tom Miller', phone: '+1234567896' }],
  ['user-9', { id: 'user-9', name: 'Anna Anderson', phone: '+1234567897' }],
  ['user-10', { id: 'user-10', name: 'Chris Taylor', phone: '+1234567898' }],
])

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
            const params = await context.params

    const groupId = params.groupId
    const group = groups.get(groupId)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is admin
    if (!group.isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { participantIds } = body

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant ID is required' },
        { status: 400 }
      )
    }

    // Validate that participants exist (in real app, check contacts/users)
    const validParticipantIds = participantIds.filter(id => contacts.has(id))
    const newParticipants = validParticipantIds.filter(id => !group.participants.includes(id))

    if (newParticipants.length === 0) {
      return NextResponse.json(
        { error: 'No new participants to add' },
        { status: 400 }
      )
    }

    // Update group with new participants
    const updatedGroup = {
      ...group,
      participants: [...group.participants, ...newParticipants],
      participantCount: group.participantCount + newParticipants.length,
      updatedAt: new Date().toISOString()
    }

    groups.set(groupId, updatedGroup)

    // In a real implementation, you would:
    // 1. Update the group in your database
    // 2. Make API call to backend to add participants to WhatsApp group
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json({
      success: true,
      addedParticipants: newParticipants,
      group: updatedGroup
    }, { status: 200 })
  } catch (error) {
    console.error('Error adding participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 })
            const params = await context.params

    const groupId = params.groupId
    const group = groups.get(groupId)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is admin
    if (!group.isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      )
    }

    if (!group.participants.includes(participantId)) {
      return NextResponse.json(
        { error: 'Participant not found in group' },
        { status: 404 }
      )
    }

    // Remove participant
    const updatedParticipants = group.participants.filter(id => id !== participantId)
    
    const updatedGroup = {
      ...group,
      participants: updatedParticipants,
      participantCount: updatedParticipants.length,
      updatedAt: new Date().toISOString()
    }

    groups.set(groupId, updatedGroup)

    // In a real implementation, you would:
    // 1. Update the group in your database
    // 2. Make API call to backend to remove participant from WhatsApp group
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json({
      success: true,
      removedParticipant: participantId,
      group: updatedGroup
    }, { status: 200 })
  } catch (error) {
    console.error('Error removing participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
