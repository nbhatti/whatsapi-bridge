'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Types
export interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  devices?: Array<{
    id: string
    name: string
    waDeviceId: string
    status: string
    createdAt: string
  }>
  _count?: {
    devices: number
    activityLogs: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth Provider Props
interface AuthProviderProps {
  children: React.ReactNode
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Enhanced fetch function that handles token refresh on 401
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const makeRequest = async (): Promise<Response> => {
      return fetch(url, {
        ...options,
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
    }

    let response = await makeRequest()

    // If we get a 401 (Unauthorized), try to refresh the token
    if (response.status === 401) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })

        if (refreshResponse.ok) {
          // Refresh successful, retry the original request
          response = await makeRequest()
        } else {
          // Refresh failed, user needs to log in again
          setUser(null)
          setLoading(false)
        }
      } catch (refreshError) {
        // Refresh failed, user needs to log in again
        console.error('Token refresh failed:', refreshError)
        setUser(null)
        setLoading(false)
      }
    }

    return response
  }, [])

  // Get current user info
  const refreshUser = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/auth/me')
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Set demo user when API is not available
        console.warn('Auth API not available, using demo user')
        setUser({
          id: 'demo-user',
          email: 'demo@whatsapp-api.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          devices: [],
          _count: { devices: 0, activityLogs: 0 }
        })
      }
    } catch (error) {
      console.warn('Failed to fetch user, using demo user:', error)
      // Set demo user when API is not available
      setUser({
        id: 'demo-user',
        email: 'demo@whatsapp-api.com', 
        role: 'admin',
        createdAt: new Date().toISOString(),
        devices: [],
        _count: { devices: 0, activityLogs: 0 }
      })
    } finally {
      setLoading(false)
    }
  }, [authenticatedFetch])

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true)
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setLoading(false)
    }
  }, [])

  // Check authentication status on mount
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Note: Removed global fetch intercept to prevent infinite recursion
  // Individual API calls should use authenticatedFetch directly when needed

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
