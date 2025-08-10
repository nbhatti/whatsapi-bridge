'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Person,
  Email,
  Security,
  Notifications,
  Palette,
  Language,
  History,
  Edit,
  Save,
  Cancel,
  Delete,
  VpnKey,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/use-auth'
import { useRouter } from 'next/navigation'

interface ProfileSettings {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    language: string
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
  }
}

interface ActivityLog {
  id: string
  action: string
  timestamp: string
  ip?: string
  userAgent?: string
}

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settings, setSettings] = useState<ProfileSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    appearance: {
      theme: 'system',
      language: 'en'
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30
    }
  })
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      // Fetch user activity logs (mock data for now)
      setActivityLogs([
        {
          id: '1',
          action: 'Login',
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1'
        },
        {
          id: '2',
          action: 'Password changed',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          ip: '127.0.0.1'
        }
      ])
    }
  }, [user])

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity })
  }

  const handleSaveProfile = async () => {
    // Update profile logic here
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification('Profile updated successfully', 'success')
      setEditing(false)
    } catch (error) {
      showNotification('Failed to update profile', 'error')
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill in all password fields', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 8) {
      showNotification('Password must be at least 8 characters long', 'error')
      return
    }

    try {
      // Mock API call to change password
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification('Password changed successfully', 'success')
      setChangePasswordDialogOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      showNotification('Failed to change password', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Mock API call to delete account
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification('Account deletion requested', 'info')
      setDeleteAccountDialogOpen(false)
      // In real app, this would probably redirect to a confirmation page
    } catch (error) {
      showNotification('Failed to delete account', 'error')
    }
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          Please log in to view your profile.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile & Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
                <Typography variant="h6" gutterBottom>
                  Profile Information
                </Typography>
                <Button
                  variant={editing ? "contained" : "outlined"}
                  startIcon={editing ? <Save /> : <Edit />}
                  onClick={editing ? handleSaveProfile : () => setEditing(true)}
                  sx={{ ml: 'auto' }}
                >
                  {editing ? 'Save' : 'Edit'}
                </Button>
                {editing && (
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => setEditing(false)}
                    sx={{ ml: 1 }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>

              <Box display="flex" alignItems="center" mb={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    mr: 3
                  }}
                >
                  {user.email.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user.email}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={user.role}
                    disabled
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <VpnKey />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Change Password"
                    secondary="Update your account password"
                  />
                  <IconButton 
                    edge="end" 
                    onClick={() => setChangePasswordDialogOpen(true)}
                  >
                    <Edit />
                  </IconButton>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Two-Factor Auth"
                    secondary={settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  />
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      security: { ...settings.security, twoFactorEnabled: e.target.checked }
                    })}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: e.target.checked }
                      })}
                    />
                  }
                  label="Email notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, push: e.target.checked }
                      })}
                    />
                  }
                  label="Push notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.sms}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, sms: e.target.checked }
                      })}
                    />
                  }
                  label="SMS notifications"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                {activityLogs.slice(0, 5).map((log) => (
                  <ListItem key={log.id}>
                    <ListItemIcon>
                      <History />
                    </ListItemIcon>
                    <ListItemText
                      primary={log.action}
                      secondary={new Date(log.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Danger Zone */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                These actions are permanent and cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteAccountDialogOpen(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog 
        open={changePasswordDialogOpen} 
        onClose={() => setChangePasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            helperText="Password must be at least 8 characters long"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteAccountDialogOpen}
        onClose={() => setDeleteAccountDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to delete your account? This will:
          </Typography>
          <ul>
            <li>Permanently delete your profile</li>
            <li>Remove all your devices</li>
            <li>Delete all message history</li>
            <li>Cancel any active subscriptions</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
