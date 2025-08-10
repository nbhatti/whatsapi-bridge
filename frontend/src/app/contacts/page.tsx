'use client'

import React, { useState, useEffect } from 'react'
import { Navigation } from '../../components/Navigation'
import { useAuth } from '../../hooks/use-auth'

interface Contact {
  id: string
  name: string
  phone: string
  avatar: string | null
  presence: 'online' | 'offline' | 'away' | 'unknown'
  lastSeen: string | null
  isBlocked: boolean
  isFavorite: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showQuickChatModal, setShowQuickChatModal] = useState<Contact | null>(null)
  const [showEditModal, setShowEditModal] = useState<Contact | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [presenceFilter, setPresenceFilter] = useState<string>('all')
  const [favoriteFilter, setFavoriteFilter] = useState(false)

  // Form states
  const [importText, setImportText] = useState('')
  const [quickMessage, setQuickMessage] = useState('')
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({})

  useEffect(() => {
    fetchContacts()
  }, [searchQuery, presenceFilter, favoriteFilter])

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (presenceFilter !== 'all') params.append('presence', presenceFilter)
      if (favoriteFilter) params.append('favorite', 'true')

      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()
      setContacts(data.contacts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleImportContacts = async () => {
    try {
      // Parse import text (expecting CSV format: name,phone,notes)
      const lines = importText.trim().split('\n').filter(line => line.trim())
      const contactsToImport = []

      for (const line of lines) {
        const [name, phone, notes = ''] = line.split(',').map(s => s.trim())
        if (name && phone) {
          contactsToImport.push({ name, phone, notes })
        }
      }

      if (contactsToImport.length === 0) {
        setError('No valid contacts found in import data')
        return
      }

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contactsToImport,
          source: 'manual_import'
        })
      })

      if (!response.ok) throw new Error('Failed to import contacts')
      
      const result = await response.json()
      alert(`Import completed: ${result.results.imported} imported, ${result.results.skipped} skipped, ${result.results.errors.length} errors`)
      
      await fetchContacts()
      setShowImportModal(false)
      setImportText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import contacts')
    }
  }

  const handleQuickChat = async () => {
    if (!showQuickChatModal || !quickMessage.trim()) return

    try {
      const response = await fetch(`/api/contacts/${showQuickChatModal.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: quickMessage.trim(),
          type: 'text'
        })
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const result = await response.json()
      alert(`Message sent to ${showQuickChatModal.name}!`)
      
      setShowQuickChatModal(null)
      setQuickMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleUpdateContact = async () => {
    if (!showEditModal || !editingContact.name?.trim()) return

    try {
      const response = await fetch(`/api/contacts/${showEditModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContact)
      })

      if (!response.ok) throw new Error('Failed to update contact')
      
      await fetchContacts()
      setShowEditModal(null)
      setEditingContact({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete contact')
      
      await fetchContacts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact')
    }
  }

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !contact.isFavorite })
      })

      if (!response.ok) throw new Error('Failed to update favorite')
      
      await fetchContacts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite')
    }
  }

  const getPresenceIndicator = (presence: string) => {
    const colors = {
      online: 'bg-green-400',
      offline: 'bg-gray-400',
      away: 'bg-yellow-400',
      unknown: 'bg-gray-300'
    }
    return colors[presence as keyof typeof colors] || 'bg-gray-400'
  }

  const getPresenceText = (contact: Contact) => {
    switch (contact.presence) {
      case 'online':
        return 'Online'
      case 'offline':
        return contact.lastSeen 
          ? `Last seen ${new Date(contact.lastSeen).toLocaleString()}`
          : 'Offline'
      case 'away':
        return 'Away'
      default:
        return 'Unknown'
    }
  }

  const openEditModal = (contact: Contact) => {
    setShowEditModal(contact)
    setEditingContact({
      name: contact.name,
      notes: contact.notes,
      isFavorite: contact.isFavorite,
      isBlocked: contact.isBlocked
    })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import Contacts
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Presence
              </label>
              <select
                value={presenceFilter}
                onChange={(e) => setPresenceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="away">Away</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={favoriteFilter}
                  onChange={(e) => setFavoriteFilter(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Favorites only
                </span>
              </label>
            </div>
          </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {contacts.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No contacts found</p>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Import your first contacts
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full" />
                          ) : (
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div 
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getPresenceIndicator(contact.presence)}`}
                          ></div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                            {contact.isFavorite && (
                              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                            {contact.isBlocked && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{contact.phone}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">{getPresenceText(contact)}</p>
                          {contact.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Note: {contact.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleFavorite(contact)}
                          className={`p-2 rounded-lg ${contact.isFavorite 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-gray-50'
                          }`}
                          title={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => setShowQuickChatModal(contact)}
                          disabled={contact.isBlocked}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg disabled:text-gray-400 disabled:hover:bg-transparent"
                          title="Quick chat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => openEditModal(contact)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                          title="Edit contact"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete contact"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import Contacts Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Import Contacts
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Data (CSV Format)
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Format: name,phone,notes (one per line)
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                    placeholder="John Smith,+1234567890,Project lead&#10;Sarah Johnson,+1234567891,Designer&#10;Mike Brown,+1234567892"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleImportContacts}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                  disabled={!importText.trim()}
                >
                  Import Contacts
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportText('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Chat Modal */}
        {showQuickChatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Quick Chat - {showQuickChatModal.name}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleQuickChat}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  disabled={!quickMessage.trim()}
                >
                  Send Message
                </button>
                <button
                  onClick={() => {
                    setShowQuickChatModal(null)
                    setQuickMessage('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Contact Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Edit Contact - {showEditModal.name}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingContact.name || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editingContact.notes || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingContact.isFavorite || false}
                      onChange={(e) => setEditingContact({ ...editingContact, isFavorite: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Favorite</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingContact.isBlocked || false}
                      onChange={(e) => setEditingContact({ ...editingContact, isBlocked: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Blocked</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleUpdateContact}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  disabled={!editingContact.name?.trim()}
                >
                  Update Contact
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(null)
                    setEditingContact({})
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
