'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Stack,
  CircularProgress 
} from '@mui/material'
import { WhatsApp, Api } from '@mui/icons-material'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../hooks/use-auth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <CircularProgress />
      </div>
    )
  }

  // Show landing page only for non-authenticated users
  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with theme toggle */}
      <Box className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </Box>
      
      <Container maxWidth="md" className="pt-20 pb-10">
        <Box className="text-center">
          {/* Hero Section */}
          <Box className="mb-12">
            <WhatsApp sx={{ fontSize: 80, color: '#25D366', mb: 2 }} />
            <Typography 
              variant="h2" 
              component="h1" 
              className="font-bold text-gray-900 dark:text-gray-100 mb-4"
            >
              WhatsApp API Wrapper
            </Typography>
            <Typography 
              variant="h6" 
              className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              A modern frontend application for WhatsApp Web.js REST API with
              seamless theme switching powered by Material-UI and Tailwind CSS
            </Typography>
          </Box>

          {/* Feature Cards */}
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={4} 
            className="mb-8"
          >
            <Card className="flex-1 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <Api sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" className="font-semibold mb-3">
                  REST API Integration
                </Typography>
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                  Full-featured REST API wrapper for WhatsApp Web.js with comprehensive 
                  endpoint coverage
                </Typography>
              </CardContent>
            </Card>

            <Card className="flex-1 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <Box className="flex items-center justify-center mb-2">
                  <Box className="text-4xl">🎨</Box>
                </Box>
                <Typography variant="h5" className="font-semibold mb-3">
                  Hybrid UI Design
                </Typography>
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                  Beautiful combination of Material-UI components with Tailwind CSS 
                  utilities for rapid development
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className="justify-center">
            <Button 
              variant="contained" 
              size="large"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
              href="/dashboard"
            >
              Get Started
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-3"
            >
              View Documentation
            </Button>
          </Stack>
        </Box>
      </Container>
    </div>
  );
}
