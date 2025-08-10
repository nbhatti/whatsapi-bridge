'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  MenuItem as MenuItemComponent,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Person,
  AdminPanelSettings,
  Email,
  CalendarToday,
} from '@mui/icons-material'
import { useAuth } from '../../../hooks/use-auth'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  _count?: {
    devices: number
    activityLogs: number
  }
}

interface CreateUserData {
  email: string
  password: string
  confirmPassword: string
  role: 'user' | 'admin'
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  })
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        showNotification('Failed to fetch users', 'error')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      showNotification('Error fetching users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ open: true, message, severity })
  }

  const handleCreateUser = async () => {
    if (!createUserData.email || !createUserData.password || !createUserData.confirmPassword) {
      showNotification('Please fill in all fields', 'error')
      return
    }

    if (createUserData.password !== createUserData.confirmPassword) {
      showNotification('Passwords do not match', 'error')
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createUserData.email,
          password: createUserData.password,
          confirmPassword: createUserData.confirmPassword,
          role: createUserData.role,
        }),
      })

      if (response.ok) {
        showNotification('User created successfully', 'success')
        setCreateDialogOpen(false)
        setCreateUserData({ email: '', password: '', confirmPassword: '', role: 'user' })
        fetchUsers()
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Failed to create user', 'error')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showNotification('Error creating user', 'error')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showNotification('User deleted successfully', 'success')
        fetchUsers()
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Failed to delete user', 'error')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showNotification('Error deleting user', 'error')
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedUser(null)
  }

  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system users and their permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Devices</TableCell>
                    <TableCell>Activity</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}
                          >
                            {userItem.role === 'admin' ? <AdminPanelSettings /> : <Person />}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2">
                              {userItem.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {userItem.id.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={userItem.role}
                          color={userItem.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          icon={userItem.role === 'admin' ? <AdminPanelSettings /> : <Person />}
                        />
                      </TableCell>
                      <TableCell>
                        {userItem._count?.devices || 0} devices
                      </TableCell>
                      <TableCell>
                        {userItem._count?.activityLogs || 0} actions
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, userItem)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={handleMenuClose}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent 
          onClick={() => {
            handleMenuClose()
            if (selectedUser) {
              handleDeleteUser(selectedUser.id)
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <Delete />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={createUserData.email}
              onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={createUserData.password}
              onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={createUserData.confirmPassword}
              onChange={(e) => setCreateUserData({ ...createUserData, confirmPassword: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={createUserData.role}
                onChange={(e) => setCreateUserData({ ...createUserData, role: e.target.value as 'user' | 'admin' })}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser} variant="contained">
            Create User
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
