'use client'

import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme()

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} theme`}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        className="transition-transform hover:scale-110"
        aria-label="toggle theme"
      >
        {mode === 'dark' ? (
          <Brightness7 className="text-yellow-400" />
        ) : (
          <Brightness4 className="text-slate-700" />
        )}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
