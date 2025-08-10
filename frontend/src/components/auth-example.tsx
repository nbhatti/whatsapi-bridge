'use client'

import React, { useState } from 'react'
import { useAuth, type LoginCredentials } from '../hooks/use-auth'

export const AuthExample: React.FC = () => {
  const { user, loading, login, logout } = useAuth()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [loginError, setLoginError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setLoginError('')

    const result = await login(credentials)
    
    if (!result.success) {
      setLoginError(result.error || 'Login failed')
    } else {
      // Clear form on successful login
      setCredentials({ email: '', password: '' })
    }
    
    setIsSubmitting(false)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading authentication status...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
            Welcome back!
          </h2>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>ID:</strong> {user.id}</p>
            {user.devices && (
              <p><strong>Devices:</strong> {user.devices.length}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Login</h2>
          
          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800 mb-4">
              {loginError}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter your password"
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !credentials.email || !credentials.password}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
