'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '../../components/Navigation'
import { useAuth } from '../../hooks/use-auth'

interface Group {
  id: string
  name: string
  description: string
  participants: string[]
  participantCount: number
  icon: string | null
  inviteCode: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  lastMessage: {
    text: string
    timestamp: string
    sender: string
  } | null
}

interface Contact {
  id: string
  name: string
  phone: string
}

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [showParticipantsModal, setShowParticipantsModal] = useState<Group | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])

  // Form states
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  useEffect(() => {
    fetchGroups()
    fetchContacts()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      const data = await response.json()
      setGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()
      setContacts(data.contacts.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })))
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
    }
  }

  const handleCreateGroup = async () => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          participants: selectedParticipants
        })
      })

      if (!response.ok) throw new Error('Failed to create group')
      
      await fetchGroups()
      resetCreateForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup) return

    try {
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription
        })
      })

      if (!response.ok) throw new Error('Failed to update group')
      
      await fetchGroups()
      setEditingGroup(null)
      resetCreateForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete group')
      
      await fetchGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
    }
  }

  const handleAddParticipants = async (groupId: string, participantIds: string[]) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds })
      })

      if (!response.ok) throw new Error('Failed to add participants')
      
      await fetchGroups()
      setShowParticipantsModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add participants')
    }
  }

  const handleRemoveParticipant = async (groupId: string, participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return

    try {
      const response = await fetch(`/api/groups/${groupId}/participants?participantId=${participantId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove participant')
      
      await fetchGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove participant')
    }
  }

  const resetCreateForm = () => {
    setGroupName('')
    setGroupDescription('')
    setSelectedParticipants([])
    setShowCreateModal(false)
  }

  const openEditModal = (group: Group) => {
    setEditingGroup(group)
    setGroupName(group.name)
    setGroupDescription(group.description)
    setShowCreateModal(true)
  }

  const formatLastMessage = (lastMessage: Group['lastMessage']) => {
    if (!lastMessage) return 'No messages yet'
    const date = new Date(lastMessage.timestamp)
    return `${lastMessage.text} • ${date.toLocaleDateString()}`
  }

  const getPresenceIndicator = (presence: string) => {
    const colors = {
      online: 'bg-green-400',
      offline: 'bg-gray-400',
      away: 'bg-yellow-400'
    }
    return colors[presence as keyof typeof colors] || 'bg-gray-400'
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Groups</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Group
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {group.icon ? (
                      <img src={group.icon} alt={group.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{group.participantCount} participants</p>
                    </div>
                  </div>
                  
                  {group.isAdmin && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(group)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {group.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{group.description}</p>
                )}

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {formatLastMessage(group.lastMessage)}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowParticipantsModal(group)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage Participants
                  </button>
                  
                  {group.isAdmin && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter group name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter group description"
                  />
                </div>

                {!editingGroup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Participants
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                      {contacts.map((contact) => (
                        <label key={contact.id} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, contact.id])
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(id => id !== contact.id))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {contact.name} ({contact.phone})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  disabled={!groupName.trim() || (!editingGroup && selectedParticipants.length === 0)}
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
                <button
                  onClick={() => {
                    resetCreateForm()
                    setEditingGroup(null)
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipantsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Manage Participants - {showParticipantsModal.name}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Participants ({showParticipantsModal.participantCount})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {showParticipantsModal.participants.map((participantId) => {
                      const contact = contacts.find(c => c.id === participantId)
                      return (
                        <div key={participantId} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {contact ? `${contact.name} (${contact.phone})` : `User ${participantId}`}
                          </span>
                          {showParticipantsModal.isAdmin && participantId !== user?.id && (
                            <button
                              onClick={() => handleRemoveParticipant(showParticipantsModal.id, participantId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {showParticipantsModal.isAdmin && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add New Participants
                    </h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                      {contacts
                        .filter(contact => !showParticipantsModal.participants.includes(contact.id))
                        .map((contact) => (
                          <label key={contact.id} className="flex items-center py-1">
                            <input
                              type="checkbox"
                              checked={selectedParticipants.includes(contact.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedParticipants([...selectedParticipants, contact.id])
                                } else {
                                  setSelectedParticipants(selectedParticipants.filter(id => id !== contact.id))
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {contact.name} ({contact.phone})
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-6">
                {showParticipantsModal.isAdmin && selectedParticipants.length > 0 && (
                  <button
                    onClick={() => handleAddParticipants(showParticipantsModal.id, selectedParticipants)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                  >
                    Add Selected
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowParticipantsModal(null)
                    setSelectedParticipants([])
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
