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

export async function GET(
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

    // In a real implementation, verify user has access to this group

    return NextResponse.json(group, { status: 200 })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Check if user is admin (in a real app, verify this from database)
    if (!group.isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon } = body

    // Update group properties
    const updatedGroup = {
      ...group,
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(icon !== undefined && { icon }),
      updatedAt: new Date().toISOString()
    }

    groups.set(groupId, updatedGroup)

    // In a real implementation, you would:
    // 1. Update the group in your database
    // 2. Make API call to backend to update WhatsApp group
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json(updatedGroup, { status: 200 })
  } catch (error) {
    console.error('Error updating group:', error)
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

    groups.delete(groupId)

    // In a real implementation, you would:
    // 1. Delete the group from your database
    // 2. Make API call to backend to leave/delete WhatsApp group
    // 3. Emit real-time events via Socket.IO

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
