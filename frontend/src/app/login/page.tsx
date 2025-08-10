'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material'
import { WhatsApp } from '@mui/icons-material'
import { useAuth } from '../../hooks/use-auth'

export default function Login() {
  // Prefill credentials in development
  const [email, setEmail] = useState(
    process.env.NEXT_PUBLIC_PREFILL_LOGIN === 'true' ? 'admin@example.com' : ''
  )
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_PREFILL_LOGIN === 'true' ? 'admin123' : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      // Redirect will be handled by the auth hook
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Container maxWidth="sm">
        <Paper className="p-8 shadow-xl">
          <Box className="text-center mb-8">
            <WhatsApp sx={{ fontSize: 60, color: '#25D366', mb: 2 }} />
            <Typography variant="h4" className="font-bold mb-2">
              Welcome Back
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sign in to your WhatsApp API account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mb-4"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mb-6"
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 py-3 mb-4"
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Box className="text-center">
            <Typography variant="body2" color="textSecondary">
              Demo credentials: admin@example.com / admin123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </div>
  )
}
