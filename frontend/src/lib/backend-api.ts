/**
 * Backend API Service
 * Connects frontend to the WhatsApp backend server on port 3000
 */

interface BackendDevice {
  id?: string // For frontend compatibility
  deviceId: string // Backend uses deviceId
  name?: string // Backend may not have name field
  clientName: string | null
  phoneNumber: string | null
  status: 'ready' | 'qr' | 'error' | 'disconnected' | 'connecting' | 'loading'
  lastSeen: number
  createdAt: number
  qr?: string
  stats?: {
    messagesReceived: number
    messagesSent: number
    contacts: number
    groups: number
  }
}

interface BackendChat {
  id: string // This is the chat identifier (like '120363160877619681@g.us')
  chatId?: string // Optional, use id if not present
  name: string
  isGroup: boolean
  participants?: string[]
  lastMessage?: {
    id?: string
    body: string
    timestamp: number
    fromMe: boolean
    author?: string
    type?: string
  }
  unreadCount: number
  pinned?: boolean // Backend uses 'pinned' not 'isPinned'
  archived?: boolean // Backend uses 'archived' not 'isArchived' 
  muted?: boolean // Backend has 'muted' field
  profilePicUrl?: string
  timestamp: number
}

interface BackendMessage {
  id: string | { _serialized: string; id?: string; fromMe?: boolean; remote?: string }
  body: string
  timestamp: number
  fromMe: boolean
  author?: string
  type: string // 'chat', 'image', 'call_log', 'e2e_notification', 'ptt', etc.
  hasMedia: boolean
  isForwarded?: boolean
  isStarred?: boolean
  // Enhanced Media Support
  mediaInfo?: {
    mimetype: string
    filesize?: number
    filename?: string
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker'
    downloadUrl: string
    thumbnailUrl?: string
    duration?: number | string // For audio/video
    dimensions?: { // For images/videos
      width: number
      height: number
    }
  }
  // Legacy fields for backward compatibility
  mediaType?: string
  mediaKey?: string
  directPath?: string
  deprecatedMms3Url?: string
  mimetype?: string
  duration?: number // For audio/video messages
  title?: string // For URL previews
  links?: Array<{ link: string; isSuspicious: boolean }>
  quotedMessage?: BackendMessage // Enhanced quoted message
  quotedMsg?: BackendMessage // Legacy
  location?: {
    latitude: number
    longitude: number
    description?: string // Enhanced location
    address?: string // Legacy
  }
  // Reactions support
  reactions?: Array<{
    id: string
    aggregateEmoji: string
    hasReactionByMe: boolean
  }>
  // Mention-related fields
  mentionedIds?: string[] // Array of contact IDs that were mentioned
  mentions?: Array<{
    id: string
    name?: string
    number?: string
    formattedName?: string
  }>
  // Group/chat metadata
  notifyName?: string // Display name of the sender
  vCards?: string[] // Contact cards
  groupMentions?: string[] // Special group mentions like @everyone
  // Raw data from WhatsApp.js
  _data?: {
    id?: any
    type?: string
    body?: string
    callOutcome?: string
    isVideoCall?: boolean
    callDuration?: number
    notifyName?: string
    mentionedIds?: string[]
    vCards?: any[]
    [key: string]: any
  }
}

class BackendAPIService {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor() {
    this.baseUrl = '/api/backend' // Use Next.js API proxy routes
    this.apiKey = 'test-api-key-123' // This will be handled by the proxy routes
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    }

    try {
      const response = await fetch(url, defaultOptions)
      return response
    } catch (error) {
      console.error('Backend API request failed:', error)
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all devices
   */
  async getDevices(): Promise<BackendDevice[]> {
    const response = await this.makeRequest('/devices')
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data // Handle both {data: []} and [] response formats
  }

  /**
   * Create a new device
   */
  async createDevice(name: string): Promise<BackendDevice> {
    const response = await this.makeRequest('/devices', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get a specific device by ID
   */
  async getDevice(deviceId: string): Promise<BackendDevice> {
    const response = await this.makeRequest(`/devices/${deviceId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Delete a device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    const response = await this.makeRequest(`/devices/${deviceId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }
  }

  /**
   * Get device status and QR code
   */
  async getDeviceStatus(deviceId: string): Promise<{
    status: string
    qr?: string
    lastSeen?: string
  }> {
    const response = await this.makeRequest(`/devices/${deviceId}/status`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get QR code for device setup
   */
  async getDeviceQR(deviceId: string): Promise<{ qr: string }> {
    const response = await this.makeRequest(`/devices/${deviceId}/qr`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get contacts for a device
   */
  async getDeviceContacts(deviceId: string, filters?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<any[]> {
    const response = await this.makeRequest(`/devices/${deviceId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get chats for a device
   */
  async getDeviceChats(deviceId: string, filters?: {
    limit?: number
    offset?: number
    search?: string
    filter?: string // e.g. 'unread'
    force_refresh?: boolean
  }): Promise<BackendChat[]> {
    // Try GET first (most common pattern)
    let url = `/devices/${deviceId}/chats`
    const params = new URLSearchParams()
    
    if (filters?.limit) params.set('limit', filters.limit.toString())
    if (filters?.offset) params.set('offset', filters.offset.toString())
    // Many backends expect 'q' for search queries. Use 'q' instead of 'search'.
    if (filters?.search) params.set('q', filters.search)
    if (filters?.filter) params.set('filter', filters.filter)
    if (typeof filters?.force_refresh === 'boolean') params.set('force_refresh', String(filters.force_refresh))
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    try {
      console.log(`Loading chats from: GET ${this.baseUrl}${url}`)
      const response = await this.makeRequest(url, {
        method: 'GET',
      })

      if (!response.ok) {
        // Try to parse JSON first, then fall back to text to capture proxy 'details'
        let errorText = ''
        let errorJson: any = null
        try { errorJson = await response.json() } catch {
          try { errorText = await response.text() } catch { /* ignore */ }
        }

        const details = errorJson?.details || errorText || errorJson?.error
        const baseMsg = `HTTP ${response.status}: ${response.statusText}`

        if (response.status === 404 || response.status === 400) {
          // Fallback strategies for common backends
          const firstTry = new URLSearchParams()
          if (filters?.limit) firstTry.set('take', String(filters.limit))
          if (filters?.offset) firstTry.set('skip', String(filters.offset))
          if (filters?.search) firstTry.set('q', filters.search)

          let altUrl = `/devices/${deviceId}/chats${firstTry.toString() ? `?${firstTry.toString()}` : ''}`
          console.warn(`Retrying chats with alternative params: GET ${this.baseUrl}${altUrl}`)
          let altResp = await this.makeRequest(altUrl, { method: 'GET' })
          if (altResp.ok) {
            const altData = await altResp.json()
            return altData.data || altData || []
          }

          // Second fallback: page/pageSize/query
          const secondTry = new URLSearchParams()
          if (filters?.limit) secondTry.set('pageSize', String(filters.limit))
          secondTry.set('page', String(Math.floor((filters?.offset ?? 0) / (filters?.limit ?? 50)) + 1))
          if (filters?.search) secondTry.set('query', filters.search)

          altUrl = `/devices/${deviceId}/chats${secondTry.toString() ? `?${secondTry.toString()}` : ''}`
          console.warn(`Retrying chats with page params: GET ${this.baseUrl}${altUrl}`)
          altResp = await this.makeRequest(altUrl, { method: 'GET' })
          if (altResp.ok) {
            const altData = await altResp.json()
            return altData.data || altData || []
          }

          // Third fallback: POST /devices/{id}/chats/list
          const body = {
            limit: filters?.limit ?? 50,
            offset: filters?.offset ?? 0,
            search: filters?.search ?? undefined
          }
          console.warn(`Retrying chats via POST list: POST ${this.baseUrl}/devices/${deviceId}/chats/list`)
          altResp = await this.makeRequest(`/devices/${deviceId}/chats/list`, {
            method: 'POST',
            body: JSON.stringify(body)
          })
          if (altResp.ok) {
            const altData = await altResp.json()
            return altData.data || altData || []
          }

          // Fourth fallback: POST /devices/{id}/chats
          console.warn(`Retrying chats via POST base: POST ${this.baseUrl}/devices/${deviceId}/chats`)
          altResp = await this.makeRequest(`/devices/${deviceId}/chats`, {
            method: 'POST',
            body: JSON.stringify(body)
          })
          if (altResp.ok) {
            const altData = await altResp.json()
            return altData.data || altData || []
          }

          // If still failing, throw enriched error
          throw new Error((details || errorJson?.error || baseMsg) + ' - Tried fallbacks: take/skip, page/pageSize, POST list, POST base')
        }
        
        // Other error codes
        throw new Error((errorJson?.error ? `${errorJson.error}. ` : '') + baseMsg + (details ? ` - ${details}` : ''))
      }

      const data = await response.json()
      return data.data || data || []
    } catch (error) {
      // If it's a network error or the endpoint doesn't exist, provide a helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Backend server not reachable. Make sure the WhatsApp backend is running on port 3000.')
      }
      throw error
    }
  }

  /**
   * Get messages for a specific chat on a device
   */
  async getChatMessages(deviceId: string, chatId: string, filters?: {
    limit?: number
    offset?: number
    before?: string
  }): Promise<BackendMessage[]> {
    // Use the correct endpoint format: GET /devices/{deviceId}/chats/{chatId}/messages
    const url = `/devices/${deviceId}/chats/${encodeURIComponent(chatId)}/messages${this.buildQueryString(filters)}`
    
    console.log(`Loading messages from: GET ${url}`);
    
    const response = await this.makeRequest(url, {
      method: 'GET',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Messages loaded successfully:`, data);
    return data.data || data || []
  }

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return ''
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.set(key, value.toString())
      }
    })
    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(deviceId: string, chatId: string, message: {
    body?: string
    text?: string
    mediaUrl?: string
    location?: { latitude: number; longitude: number; description?: string }
  }): Promise<BackendMessage> {
    // Use the unified message send endpoint from the API docs
    const response = await this.makeRequest(`/devices/${deviceId}/messages/send`, {
      method: 'POST',
      body: JSON.stringify({
        to: chatId,
        text: message.body || message.text,
        ...message
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get chats from multiple devices (aggregated view)
   */
  async getMultiDeviceChats(deviceIds: string[], filters?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<{ deviceId: string; chats: BackendChat[] }[]> {
    const response = await this.makeRequest('/devices/chats/multi', {
      method: 'POST',
      body: JSON.stringify({ deviceIds, ...filters }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get messages with enhanced media support
   */
  async getMessages(deviceId: string, chatId: string, options: {
    limit?: number
    before?: string
    after?: string
  } = {}): Promise<{
    data: BackendMessage[]
    pagination: {
      total: number
      returned: number
      hasMore: boolean
      cursors?: {
        newer?: { after: string; url: string }
        older?: { before: string; url: string }
      }
    }
  }> {
    const params = new URLSearchParams()
    
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.before) params.append('before', options.before)
    if (options.after) params.append('after', options.after)
    
    const url = `/devices/${deviceId}/chats/${chatId}/messages${params.toString() ? `?${params.toString()}` : ''}`
    const response = await this.makeRequest(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      data: result.data || [],
      pagination: result.pagination || { total: 0, returned: 0, hasMore: false }
    }
  }

  /**
   * Get media info for a message (without downloading)
   */
  async getMediaInfo(deviceId: string, messageId: string): Promise<{
    messageId: string
    hasMedia: boolean
    type: string
    downloadUrl: string
    thumbnailUrl?: string
    infoUrl: string
    duration?: number
  }> {
    const response = await this.makeRequest(`/devices/${deviceId}/messages/${messageId}/media/info`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Search messages across chats
   */
  async searchMessages(deviceId: string, query: string, options: {
    limit?: number
    chatId?: string
  } = {}): Promise<{
    data: BackendMessage[]
    query: string
    totalResults: number
    searchScope: 'single_chat' | 'all_chats'
  }> {
    const params = new URLSearchParams()
    params.append('query', query)
    
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.chatId) params.append('chatId', options.chatId)
    
    const url = `/devices/${deviceId}/messages/search?${params.toString()}`
    const response = await this.makeRequest(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      data: result.data || [],
      query: result.query || query,
      totalResults: result.totalResults || 0,
      searchScope: result.searchScope || 'all_chats'
    }
  }

  /**
   * Get media file (audio, image, etc.) for a message
   * Returns a URL that can be used directly in audio/img elements
   */
  getMediaUrl(deviceId: string, messageId: string, mediaType: 'audio' | 'image' | 'video' | 'document' = 'audio'): string {
    // Use the enhanced media download URL through API proxy
    return `/api/backend/devices/${deviceId}/messages/${messageId}/media/download?t=${Date.now()}`
  }

  /**
   * Get media thumbnail URL
   */
  getMediaThumbnailUrl(deviceId: string, messageId: string): string {
    return `/api/backend/devices/${deviceId}/messages/${messageId}/media/thumbnail?t=${Date.now()}`
  }

  /**
   * Download media file as a blob (for processing)
   */
  async downloadMedia(deviceId: string, messageId: string): Promise<Blob> {
    const response = await fetch(`/api/backend/devices/${deviceId}/messages/${messageId}/media/download`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Media download failed: ${response.status} ${errorText}`)
    }

    return await response.blob()
  }

  /**
   * Get media thumbnail as blob
   */
  async getMediaThumbnail(deviceId: string, messageId: string): Promise<Blob> {
    const response = await fetch(`/api/backend/devices/${deviceId}/messages/${messageId}/media/thumbnail`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Thumbnail download failed: ${response.status} ${errorText}`)
    }

    return await response.blob()
  }

  /**
   * Send a unified message (text, media, location) with queue reliability
   */
  async sendUnifiedMessage(deviceId: string, options: {
    to: string
    text?: string
    media?: {
      data: string // Base64 encoded
      mimetype: string
      filename?: string
    }
    location?: {
      latitude: number
      longitude: number
      description?: string
    }
    quotedMessageId?: string
    mentions?: string[]
    priority?: 'high' | 'normal' | 'low'
    useQueue?: boolean
    enableTyping?: boolean
  }): Promise<BackendMessage> {
    const response = await this.makeRequest(`/devices/${deviceId}/messages/send`, {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        useQueue: options.useQueue ?? true
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Forward a message
   */
  async forwardMessage(deviceId: string, options: {
    messageId: string
    to: string
    fromChatId?: string
    useQueue?: boolean
  }): Promise<BackendMessage> {
    const response = await this.makeRequest(`/devices/${deviceId}/messages/forward`, {
      method: 'POST',
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Delete a message
   */
  async deleteMessage(deviceId: string, options: {
    messageId: string
    forEveryone?: boolean
    fromChatId?: string
  }): Promise<{ success: boolean }> {
    const response = await this.makeRequest(`/devices/${deviceId}/messages/delete`, {
      method: 'POST',
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Forward message from a specific chat (alternative endpoint)
   */
  async forwardChatMessage(deviceId: string, chatId: string, options: {
    messageId: string
    to: string
  }): Promise<BackendMessage> {
    const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}/messages/forward`, {
      method: 'POST',
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Delete message from a specific chat (alternative endpoint)
   */
  async deleteChatMessage(deviceId: string, chatId: string, options: {
    messageId: string
    forEveryone?: boolean
  }): Promise<{ success: boolean }> {
    const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}/messages/delete`, {
      method: 'POST',
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Send location message
   */
  async sendLocation(deviceId: string, options: {
    to: string
    latitude: number
    longitude: number
    description?: string
  }): Promise<BackendMessage> {
    const response = await this.makeRequest(`/devices/${deviceId}/chats/location`, {
      method: 'POST',
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get message status and queue information
   */
  async getMessageStatus(deviceId: string, messageId?: string): Promise<{
    queue: {
      pending: number
      processing: number
      totalQueued: number
    }
    device: {
      status: string
      health: {
        status: string
        score: number
        warnings: string[]
      }
    }
    message?: any
  }> {
    const params = messageId ? `?messageId=${messageId}` : ''
    const response = await this.makeRequest(`/devices/${deviceId}/messages/status${params}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get device health status
   */
  async getDeviceHealth(deviceId: string): Promise<{
    deviceId: string
    status: 'healthy' | 'warning' | 'critical' | 'blocked'
    score: number
    metrics: {
      messagesPerHour: number
      successRate: number
      avgResponseTime: number
      disconnectionCount: number
      lastActivity: number
      warmupPhase: boolean
    }
    warnings: string[]
    lastUpdated: number
  }> {
    const response = await this.makeRequest(`/devices/${deviceId}/health`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Get device queue status
   */
  async getDeviceQueueStatus(deviceId: string): Promise<{
    deviceId: string
    queue: {
      messagesInLast60s: number
      lastMessageTime: number
      queuedMessages: number
    }
    health: {
      status: string
      score: number
      warnings: string[]
    }
    safety: {
      safe: boolean
      reason: string
    }
    recommendedDelay: number
  }> {
    const response = await this.makeRequest(`/devices/${deviceId}/queue-status`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Mark messages as read (WhatsApp doesn't have explicit read API, but this tracks our read status)
   */
  async markMessagesAsRead(deviceId: string, chatId: string, messageIds: string[]): Promise<{ success: boolean }> {
    // This might not be supported by the backend, but we'll try
    try {
      const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}/read`, {
        method: 'POST',
        body: JSON.stringify({ messageIds })
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      // If not supported, just return success - we'll handle read status client-side
      console.warn('Mark as read not supported by backend:', error)
    }
    
    return { success: true }
  }

  /**
   * Star/unstar a message
   */
  async starMessage(deviceId: string, messageId: string, star: boolean = true): Promise<{ success: boolean }> {
    try {
      const response = await this.makeRequest(`/devices/${deviceId}/messages/${messageId}/star`, {
        method: 'POST',
        body: JSON.stringify({ star })
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Star message not supported by backend:', error)
    }
    
    return { success: true }
  }

  /**
   * React to a message
   */
  async reactToMessage(deviceId: string, messageId: string, emoji: string): Promise<{ success: boolean }> {
    try {
      const response = await this.makeRequest(`/devices/${deviceId}/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Message reaction not supported by backend:', error)
    }
    
    return { success: true }
  }

  /**
   * Get chat information
   */
  async getChatInfo(deviceId: string, chatId: string): Promise<BackendChat> {
    const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || data
  }

  /**
   * Mark an entire chat as read
   * POST /devices/{deviceId}/chats/{chatId}/markRead
   */
  async markChatAsRead(deviceId: string, chatId: string, options?: { sendSeen?: boolean }): Promise<{ success: boolean }> {
    const url = `/devices/${deviceId}/chats/${encodeURIComponent(chatId)}/markRead`
    const response = await this.makeRequest(url, {
      method: 'POST',
      body: options ? JSON.stringify(options) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json().catch(() => ({ success: true }))
    return data
  }

  /**
   * Clear a chat (delete all messages)
   */
  async clearChat(deviceId: string, chatId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}/clear`, {
      method: 'POST'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Archive/unarchive a chat
   */
  async archiveChat(deviceId: string, chatId: string, archive: boolean = true): Promise<{ success: boolean }> {
    const endpoint = archive ? 'archive' : 'unarchive'
    const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}/${endpoint}`, {
      method: 'POST'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Delete a chat
   */
  async deleteChat(deviceId: string, chatId: string): Promise<{ success: boolean }> {
    const response = await this.makeRequest(`/devices/${deviceId}/chats/${chatId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Search chats
   */
  async searchChats(deviceId: string, query: string, limit: number = 10): Promise<{
    success: boolean
    query: string
    results: Array<{
      id: string
      name: string
      type: 'private' | 'group'
      unread: number
      lastMessage: string
    }>
  }> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() })
    const response = await this.makeRequest(`/devices/${deviceId}/chats/search?${params.toString()}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{ status: string; version?: string }> {
    const response = await this.makeRequest('/health')

    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`)
    }

    return await response.json()
  }
}

// Export singleton instance
export const backendAPI = new BackendAPIService()
export type { BackendDevice, BackendChat, BackendMessage }
