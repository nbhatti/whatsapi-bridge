'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}

interface ThemeContextProviderProps {
  children: React.ReactNode
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    if (savedTheme) {
      setMode(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setMode(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    // Update document class and localStorage when theme changes
    document.documentElement.classList.toggle('dark', mode === 'dark')
    localStorage.setItem('theme', mode)
  }, [mode])

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light')
  }

  // Create MUI theme based on current mode
  const muiTheme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: '#1976d2',
            },
            secondary: {
              main: '#dc004e',
            },
            background: {
              default: '#ffffff',
              paper: '#f5f5f5',
            },
            text: {
              primary: '#171717',
              secondary: '#666666',
            },
          }
        : {
            primary: {
              main: '#90caf9',
            },
            secondary: {
              main: '#f48fb1',
            },
            background: {
              default: '#0a0a0a',
              paper: '#1a1a1a',
            },
            text: {
              primary: '#ededed',
              secondary: '#b3b3b3',
            },
          }),
    },
    typography: {
      fontFamily: [
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  })

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
