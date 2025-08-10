# Analytics & Device Health Dashboard

This document provides a comprehensive overview of the Analytics & Device Health Dashboard implementation for the WhatsApp Web.js REST API wrapper frontend.

## Features Implemented

### 1. Summary Cards
Four key metric cards displaying:
- **Messages Sent Today**: Total messages sent in the current day
- **Success Rate**: Percentage of successfully delivered messages
- **Active Devices**: Number of currently connected devices
- **Queue Depth**: Number of messages pending processing

### 2. Interactive Charts

#### Hourly Message Activity (Line Chart)
- Displays hourly message activity for the current day
- Shows both sent and received messages
- Built with Recharts
- Real-time data updates every 10 seconds

#### Message Queue Status (Pie Chart)
- Visual representation of message queue distribution
- Categories: Pending, Processing, Completed, Failed
- Color-coded for easy identification

#### Weekly Trend (Bar Chart)
- Shows message volume trends over the past week
- Daily breakdown of total message activity

### 3. Device Health Monitoring
- Individual device health cards
- Health scores with color-coded status indicators:
  - **Excellent** (90-100%): Green
  - **Good** (70-89%): Blue  
  - **Poor** (40-69%): Orange
  - **Critical** (0-39%): Red
- Real-time device status updates

### 4. Redis Statistics Panel
Comprehensive Redis monitoring including:
- Connected clients count
- Memory usage (human-readable format)
- Operations per second
- System uptime
- Keyspace hit/miss ratios
- Total commands processed

### 5. Auto-refresh & Real-time Updates
- **SWR Integration**: Automatic data fetching and caching
- **10-second refresh interval**: Configurable auto-refresh
- **Manual refresh**: Refresh button for immediate updates
- **Error handling**: Graceful error states and loading indicators

## Technical Architecture

### API Endpoints

#### `/api/analytics`
**GET** - Returns comprehensive dashboard analytics data:
```typescript
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
```

#### `/api/devices/[deviceId]/messages/status`
**GET** - Returns detailed device message status and health:
```typescript
interface DeviceMessageStatus {
  deviceId: string
  deviceName: string
  status: string
  health: {
    score: number
    status: string
    uptime: number
    avgResponseTime: number
    errorRate: number
    lastHealthCheck: string
  }
  messageStats: {
    totalSent: number
    totalReceived: number
    totalFailed: number
    successRate: number
    avgMessagesPerHour: number
    peakHour: string
    peakMessages: number
  }
  recentMessages: Array<{
    id: string
    timestamp: string
    type: string
    status: string
    recipient?: string
    sender?: string
    responseTime?: number
    error?: string
  }>
}
```

### Frontend Components

#### Dashboard Page (`/dashboard/page.tsx`)
Main dashboard component featuring:
- **SWR data fetching** with 10-second refresh interval
- **Responsive grid layout** using Material-UI Grid system
- **Chart components** using Recharts library
- **Loading and error states**
- **Manual refresh capability**

#### Key Components:
1. **DashboardCard**: Reusable metric card component
2. **DeviceHealthCard**: Individual device health display
3. **Chart Components**: Line, Bar, and Pie charts using Recharts

### Libraries & Dependencies

#### Core Dependencies
- **SWR**: Data fetching and caching (`npm install swr`)
- **Recharts**: Chart library (`npm install recharts`)
- **Material-UI**: UI components (already installed)

#### Chart Components Used
- `LineChart`: For hourly message activity
- `BarChart`: For weekly trends  
- `PieChart`: For queue status distribution
- `ResponsiveContainer`: For responsive chart sizing

## Configuration

### Auto-refresh Settings
```typescript
const { data: analytics, error, mutate } = useSWR<AnalyticsData>(
  '/api/analytics',
  fetcher,
  {
    refreshInterval: 10000, // 10 seconds
    revalidateOnFocus: false,
  }
)
```

### Chart Colors
```typescript
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
```

## Authentication & Security

### Route Protection
- Dashboard route (`/dashboard`) is protected by middleware
- Requires valid authentication token
- Automatic redirect to login if unauthenticated

### API Security
- All API endpoints require authentication
- Token-based authentication with automatic refresh
- User session validation on each request

## Navigation Integration

### Updated Navigation
- Dashboard link added with dashboard icon
- Navigation title links to dashboard
- Proper active state highlighting

### Route Structure
```
/ (home) -> redirects to /dashboard if authenticated
/login -> authentication page
/dashboard -> main analytics dashboard
/devices -> device management
/chat -> chat interface
/groups -> group management
/contacts -> contact management
```

## Responsive Design

### Mobile-First Approach
- **Grid breakpoints**: xs (mobile), sm (tablet), md (desktop), lg (large desktop)
- **Card layouts**: Stack vertically on mobile, side-by-side on desktop
- **Chart responsiveness**: Charts scale appropriately across all screen sizes
- **Touch-friendly**: Interactive elements sized for mobile interaction

### Breakpoint Usage
```typescript
<Grid container spacing={4}>
  <Grid item xs={12} sm={6} md={3}> // Summary cards
  <Grid item xs={12} lg={8}>        // Main charts
  <Grid item xs={12} lg={4}>        // Sidebar widgets
</Grid>
```

## Dark Mode Support

### Theme Integration
- Full Material-UI theme integration
- Automatic dark/light mode switching
- Consistent color schemes across all components
- Charts adapt to theme colors

## Performance Optimizations

### Data Fetching
- **SWR caching**: Reduces redundant API calls
- **Background refresh**: Updates data without blocking UI
- **Error boundary**: Graceful error handling
- **Loading states**: Smooth user experience during data loading

### Component Optimization
- **React.memo**: For static components
- **useCallback**: For stable function references
- **Responsive containers**: Efficient chart rendering

## Mock Data

The implementation includes comprehensive mock data for demonstration:
- **3 sample devices** with varying health scores
- **24-hour hourly data** with realistic message volumes
- **7-day weekly trends** showing realistic patterns
- **Redis statistics** mimicking real Redis metrics
- **Queue data** with realistic distribution

## Future Enhancements

### Planned Features
1. **Real-time WebSocket updates** for live data streaming
2. **Customizable dashboard widgets** with drag-and-drop
3. **Alert notifications** for critical device health issues
4. **Export functionality** for reports (PDF, CSV)
5. **Advanced filtering** and date range selection
6. **Device comparison** views
7. **Performance metrics** trending over time

### Scalability Considerations
- **Pagination** for large device lists
- **Data aggregation** for historical data
- **Caching strategies** for frequently accessed metrics
- **Rate limiting** for API endpoints

## Troubleshooting

### Common Issues

1. **Charts not rendering**
   - Ensure Recharts is properly installed
   - Check browser console for JavaScript errors
   - Verify data format matches expected schema

2. **Auto-refresh not working**
   - Check SWR configuration
   - Verify network connectivity
   - Check browser developer tools for failed requests

3. **Authentication issues**
   - Clear browser cookies and localStorage
   - Check if user session is valid
   - Verify API endpoint authentication

### Development Tips

1. **Testing with mock data**: The implementation includes comprehensive mock data for testing
2. **Browser DevTools**: Use Network tab to monitor API calls and refresh intervals
3. **Console logging**: Enable for debugging data flow and component renders

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Next.js 15.4.6+

### Installation Steps
```bash
# Install required dependencies
npm install swr recharts

# Start development server
npm run dev

# Access dashboard at http://localhost:4000/dashboard
```

### Environment Setup
Ensure proper environment variables are configured for:
- Database connections
- Redis configuration  
- Authentication secrets
- API base URLs

This dashboard provides a comprehensive real-time monitoring solution for WhatsApp Web.js operations with professional-grade analytics and device health monitoring capabilities.
