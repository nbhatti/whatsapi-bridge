'use client'

import React from 'react'
import useSWR from 'swr'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material'
import { Navigation } from '../../components/Navigation'
import {
  Message,
  CheckCircle,
  Devices,
  QueuePlayNext,
  Refresh,
  TrendingUp,
  Memory,
  Speed,
  Error,
  Warning,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url, {
      credentials: 'include', // Include cookies for authentication
    })
    
    if (!res.ok) {
      const error = new Error('Failed to fetch') as any
      error.status = res.status
      error.statusText = res.statusText
      throw error
    }
    
    return res.json()
  } catch (error) {
    // Return demo data if API is not available
    console.warn('API not available, using demo data:', error)
    return getDemoData()
  }
}

// Demo data for when API is not available
const getDemoData = (): AnalyticsData => ({
  summary: {
    messagesSentToday: 1247,
    messagesReceivedToday: 856,
    successRate: 98.5,
    activeDevices: 3,
    queueDepth: 12
  },
  hourlyData: [
    { hour: '00:00', messagesSent: 45, messagesReceived: 32, successRate: 98 },
    { hour: '01:00', messagesSent: 38, messagesReceived: 28, successRate: 97 },
    { hour: '02:00', messagesSent: 42, messagesReceived: 35, successRate: 99 },
    { hour: '03:00', messagesSent: 55, messagesReceived: 41, successRate: 96 },
    { hour: '04:00', messagesSent: 67, messagesReceived: 52, successRate: 98 },
    { hour: '05:00', messagesSent: 89, messagesReceived: 73, successRate: 99 },
  ],
  weeklyTrend: [
    { day: 'Monday', messages: 1420, successRate: 98.2 },
    { day: 'Tuesday', messages: 1650, successRate: 97.8 },
    { day: 'Wednesday', messages: 1890, successRate: 99.1 },
    { day: 'Thursday', messages: 1745, successRate: 98.7 },
    { day: 'Friday', messages: 2105, successRate: 97.5 },
    { day: 'Saturday', messages: 1823, successRate: 98.9 },
    { day: 'Sunday', messages: 1567, successRate: 99.3 },
  ],
  queueStats: [
    { name: 'Pending', value: 8 },
    { name: 'Processing', value: 3 },
    { name: 'Completed', value: 1 },
    { name: 'Failed', value: 0 },
  ],
  deviceHealth: [
    { deviceId: 'dev-001', deviceName: 'Primary Device', healthScore: 95, status: 'excellent' },
    { deviceId: 'dev-002', deviceName: 'Secondary Device', healthScore: 87, status: 'good' },
    { deviceId: 'dev-003', deviceName: 'Backup Device', healthScore: 72, status: 'good' },
  ],
  redisStats: {
    connectedClients: 12,
    usedMemory: '45MB',
    usedMemoryHuman: '45.2MB',
    keyspaceHits: 15420,
    keyspaceMisses: 342,
    totalCommandsProcessed: 89456,
    instantaneousOpsPerSec: 23,
    uptime: 432000
  },
  lastUpdated: new Date().toISOString()
})

interface AnalyticsData {
  summary: {
    messagesSentToday: number
    messagesReceivedToday: number
    successRate: number
    activeDevices: number
    queueDepth: number
  }
  hourlyData: Array<{
    hour: string
    messagesSent: number
    messagesReceived: number
    successRate: number
  }>
  weeklyTrend: Array<{
    day: string
    messages: number
    successRate: number
  }>
  queueStats: Array<{
    name: string
    value: number
  }>
  deviceHealth: Array<{
    deviceId: string
    deviceName: string
    healthScore: number
    status: string
  }>
  redisStats: {
    connectedClients: number
    usedMemory: string
    usedMemoryHuman: string
    keyspaceHits: number
    keyspaceMisses: number
    totalCommandsProcessed: number
    instantaneousOpsPerSec: number
    uptime: number
  }
  lastUpdated: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

function DashboardCard({ 
  title, 
  value, 
  icon, 
  color = 'primary.main',
  subtitle,
  trend 
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="h-full shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <Box className="flex items-center justify-between mb-4">
          <Box sx={{ color }} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
            {icon}
          </Box>
          {trend && (
            <TrendingUp 
              sx={{ 
                color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'warning.main',
                transform: trend === 'down' ? 'rotate(180deg)' : 'none'
              }} 
            />
          )}
        </Box>
        <Typography variant="h3" className="font-bold mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 font-medium">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" className="text-gray-500 dark:text-gray-500">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

function DeviceHealthCard({ device }: { device: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success'
      case 'good': return 'info'
      case 'poor': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle />
      case 'good': return <CheckCircle />
      case 'poor': return <Warning />
      case 'critical': return <Error />
      default: return <CheckCircle />
    }
  }

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <Box className="flex items-center justify-between mb-2">
          <Typography variant="subtitle1" className="font-medium">
            {device.deviceName}
          </Typography>
          <Chip
            icon={getStatusIcon(device.status)}
            label={device.status}
            color={getStatusColor(device.status) as any}
            size="small"
          />
        </Box>
        <Box className="mb-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-1">
            Health Score: {device.healthScore}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={device.healthScore}
            color={getStatusColor(device.status) as any}
            className="h-2 rounded"
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { data: analytics, error, mutate } = useSWR<AnalyticsData>(
    '/api/analytics',
    fetcher,
    {
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      revalidateOnFocus: false,
    }
  )

  const handleRefresh = () => {
    mutate()
  }

  if (error) {
    return (
      <>
        <Navigation />
        <Container maxWidth="xl" className="py-8">
          <Box className="text-center">
            <Typography variant="h6" color="error" gutterBottom>
              Failed to load dashboard data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error?.status === 401 ? 'Authentication required. Please log in.' : 'Unable to fetch analytics data.'}
            </Typography>
          </Box>
        </Container>
      </>
    )
  }

  if (!analytics || !analytics.summary) {
    return (
      <>
        <Navigation />
        <Container maxWidth="xl" className="py-8">
          <Box className="text-center">
            <Typography variant="h6">Loading dashboard...</Typography>
            <LinearProgress className="mt-4" />
          </Box>
        </Container>
      </>
    )
  }

  const { 
    summary, 
    hourlyData = [], 
    weeklyTrend = [], 
    queueStats = [], 
    deviceHealth = [], 
    redisStats = {
      connectedClients: 0,
      usedMemory: '0MB',
      usedMemoryHuman: '0MB', 
      keyspaceHits: 0,
      keyspaceMisses: 0,
      totalCommandsProcessed: 0,
      instantaneousOpsPerSec: 0,
      uptime: 0
    }
  } = analytics

  return (
    <>
      <Navigation />
      <Container maxWidth="xl" className="py-8">
      {/* Header */}
      <Box className="flex items-center justify-between mb-8">
        <Box>
          <Typography variant="h4" className="font-bold mb-2">
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
            Real-time insights into your WhatsApp messaging system
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={handleRefresh} className="bg-white dark:bg-gray-800 shadow-md">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={4}>
        {/* Summary Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Messages Sent Today"
            value={summary.messagesSentToday}
            icon={<Message />}
            color="primary.main"
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Success Rate"
            value={`${summary.successRate}%`}
            icon={<CheckCircle />}
            color="success.main"
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Active Devices"
            value={summary.activeDevices}
            icon={<Devices />}
            color="info.main"
            trend="neutral"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Queue Depth"
            value={summary.queueDepth}
            icon={<QueuePlayNext />}
            color="warning.main"
            trend="down"
          />
        </Grid>

        {/* Charts Row 1 */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="p-6 h-96">
            <Typography variant="h6" className="mb-4">
              Hourly Message Activity
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="messagesSent" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Messages Sent"
                />
                <Line 
                  type="monotone" 
                  dataKey="messagesReceived" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Messages Received"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper className="p-6 h-96">
            <Typography variant="h6" className="mb-4">
              Message Queue Status
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={queueStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {queueStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Charts Row 2 */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="p-6 h-96">
            <Typography variant="h6" className="mb-4">
              Weekly Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="messages" fill="#8884d8" name="Total Messages" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper className="p-6">
            <Typography variant="h6" className="mb-4">
              Device Health
            </Typography>
            <Box className="max-h-80 overflow-y-auto">
              {deviceHealth.map((device) => (
                <DeviceHealthCard key={device.deviceId} device={device} />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Redis Stats */}
        <Grid size={12}>
          <Paper className="p-6">
            <Typography variant="h6" className="mb-4 flex items-center">
              <Memory className="mr-2" />
              Redis Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <Typography variant="h4" className="font-bold">
                    {redisStats.connectedClients}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Connected Clients
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <Typography variant="h4" className="font-bold">
                    {redisStats.usedMemoryHuman}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Memory Used
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <Typography variant="h4" className="font-bold">
                    {redisStats.instantaneousOpsPerSec}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ops/Second
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <Typography variant="h4" className="font-bold">
                    {Math.round(redisStats.uptime / 86400)}d
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Keyspace Hits: {redisStats.keyspaceHits.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Keyspace Misses: {redisStats.keyspaceMisses.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Commands: {redisStats.totalCommandsProcessed.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="textSecondary">
                    Hit Rate: {((redisStats.keyspaceHits / (redisStats.keyspaceHits + redisStats.keyspaceMisses)) * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box className="mt-8 text-center">
        <Typography variant="body2" color="textSecondary">
          Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
        </Typography>
      </Box>
      </Container>
    </>
  )
}
