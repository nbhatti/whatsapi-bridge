# Frontend Architecture Guide

This document provides a comprehensive overview of the WhatsApp Web.js REST API Wrapper frontend architecture, including frontend layers, state management, and API contract specifications.

## 🏗️ Architecture Overview

The frontend follows a modern React architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Components    │  │     Pages       │  │    Layouts   │ │
│  │   (src/components)│  │   (src/app)     │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Hooks       │  │     Stores      │  │   Contexts   │ │
│  │   (src/hooks)   │  │  (src/stores)   │  │(src/contexts)│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   API Routes    │  │   Prisma ORM    │  │  Socket.IO   │ │
│  │  (src/app/api)  │  │  (src/lib/db)   │  │ (real-time)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure & Responsibilities

### Frontend Layers

#### 1. **Presentation Layer** (`src/app/`, `src/components/`)

**Responsibilities:**
- User interface rendering
- User interaction handling  
- Route management
- Component composition

**Key Files:**
```
src/app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Home page
├── dashboard/                 # Dashboard pages
│   └── page.tsx
├── devices/                   # Device management
│   ├── page.tsx              # Device list
│   └── new/page.tsx          # Add new device
├── chat/page.tsx             # Chat interface
├── ai/page.tsx               # AI chat interface
└── login/page.tsx            # Authentication

src/components/
├── chat/                     # Chat-related components
│   ├── ChatsList.tsx         # Chat list sidebar
│   ├── MessageThread.tsx     # Message display
│   ├── MessageComposer.tsx   # Message input
│   └── LocationPicker.tsx    # Location sharing
├── devices/                  # Device management
│   ├── DeviceList.tsx        # Device grid/list
│   ├── DeviceActions.tsx     # Device controls
│   └── DeviceLogs.tsx        # Device monitoring
├── ai/                       # AI components
│   ├── AIChatInterface.tsx   # AI chat UI
│   └── AISidebar.tsx         # AI controls
├── Navigation.tsx            # Main navigation
└── ThemeToggle.tsx          # Theme switcher
```

#### 2. **Business Logic Layer** (`src/hooks/`, `src/stores/`, `src/contexts/`)

**Responsibilities:**
- State management
- Business logic implementation
- Data transformation
- Side effects handling

**Key Components:**

**Contexts** (`src/contexts/`):
```typescript
// Authentication Context
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Socket Context
interface SocketContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: unknown) => void
}

// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}
```

**Stores** (`src/stores/`):
```typescript
// Realtime Store (Zustand)
interface RealtimeState {
  // Messages
  messages: Message[]
  messageCount: number
  
  // Devices  
  devices: Device[]
  activeDeviceCount: number
  
  // Statistics
  stats: Stats | null
  
  // Connection state
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  
  // Actions
  addMessage: (message: Message) => void
  updateDevice: (device: Device) => void
  updateStats: (stats: Partial<Stats>) => void
  setConnectionStatus: (status: string) => void
}
```

#### 3. **Data Access Layer** (`src/app/api/`, `prisma/`)

**Responsibilities:**
- API endpoint implementation
- Database operations
- Real-time communication
- External service integration

**API Routes Structure:**
```
src/app/api/
├── auth/                     # Authentication endpoints
│   ├── login/route.ts        # POST /api/auth/login
│   ├── logout/route.ts       # POST /api/auth/logout
│   ├── me/route.ts          # GET /api/auth/me
│   └── refresh/route.ts      # POST /api/auth/refresh
├── devices/                  # Device management
│   ├── route.ts             # GET/POST /api/devices
│   └── [deviceId]/          # Device-specific operations
│       ├── route.ts         # GET/PUT/DELETE /api/devices/:id
│       ├── logs/route.ts    # GET /api/devices/:id/logs
│       └── restart/route.ts  # POST /api/devices/:id/restart
├── messages/                 # Message operations
│   ├── send/route.ts        # POST /api/messages/send
│   └── search/route.ts      # GET /api/messages/search
├── contacts/                 # Contact management
│   └── route.ts             # GET/POST /api/contacts
└── analytics/                # Analytics data
    └── route.ts             # GET /api/analytics
```

## 🔄 State Management Architecture

### Zustand Store Pattern

The application uses **Zustand** for state management with the following structure:

```typescript
// Store Creation Pattern
export const useRealtimeStore = create<RealtimeState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      messages: [],
      devices: [],
      stats: null,
      
      // Actions (mutations)
      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
          messageCount: state.messages.length + 1
        }))
      },
      
      // Computed getters
      getActiveDevices: () => get().devices.filter(d => d.status === 'connected')
    })),
    { name: 'realtime-store' }
  )
)

// Optimized Selectors
export const useMessages = () => useRealtimeStore(state => state.messages)
export const useDevices = () => useRealtimeStore(state => state.devices)
export const useActiveDevices = () => useRealtimeStore(state => 
  state.devices.filter(device => device.status === 'connected')
)
```

### Context Providers Hierarchy

```jsx
// Root Layout Provider Structure
<AuthProvider>
  <ThemeProvider>
    <SocketProvider>
      <MUIThemeProvider>
        <CssBaseline />
        <Navigation />
        {children}
      </MUIThemeProvider>
    </SocketProvider>
  </ThemeProvider>
</AuthProvider>
```

### Data Flow Pattern

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│ Component   │───▶│   Store     │
│ Interaction │    │  (Action)   │    │ (Mutation)  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  UI Update  │◀───│   React     │◀───│   State     │
│             │    │ Re-render   │    │   Change    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔌 API Contract Specification

### Authentication Endpoints

#### POST `/api/auth/login`
```typescript
// Request
interface LoginRequest {
  email: string
  password: string
}

// Response (200)
interface LoginResponse {
  success: true
  user: {
    id: string
    email: string
    role: 'user' | 'admin'
    createdAt: string
  }
}

// Response (401)
interface LoginErrorResponse {
  error: string
  success: false
}
```

#### GET `/api/auth/me`
```typescript
// Response (200)
interface MeResponse {
  user: {
    id: string
    email: string
    role: 'user' | 'admin'
    createdAt: string
    devices?: Device[]
    _count?: {
      devices: number
      activityLogs: number
    }
  }
}
```

### Device Management Endpoints

#### GET `/api/devices`
```typescript
// Response (200)
interface DevicesResponse {
  devices: Device[]
}

interface Device {
  id: string
  name: string
  waDeviceId: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  qrCode?: string
  lastSeen?: string
  userId: string
  createdAt: string
  updatedAt: string
  stats?: {
    messagesReceived: number
    messagesSent: number
    contacts: number
    groups: number
  }
}
```

#### POST `/api/devices`
```typescript
// Request
interface CreateDeviceRequest {
  name: string
}

// Response (201)
interface CreateDeviceResponse {
  device: Device
}
```

#### GET `/api/devices/[deviceId]`
```typescript
// Response (200)
interface DeviceResponse {
  device: Device
}

// Response (404)
interface NotFoundResponse {
  error: 'Device not found'
}
```

### Message Endpoints

#### POST `/api/messages/send`
```typescript
// Request (FormData)
interface SendMessageRequest {
  chatId: string          // WhatsApp chat ID
  message?: string        // Text message
  file?: File            // Media file
  latitude?: string      // Location latitude
  longitude?: string     // Location longitude
  address?: string       // Location address
}

// Response (200)
interface SendMessageResponse {
  success: true
  messageId: string
  timestamp: string
  chatId: string
  message?: string
  file?: {
    name: string
    size: number
    type: string
    url: string
  }
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}
```

#### GET `/api/messages/search`
```typescript
// Query Parameters
interface SearchParams {
  q: string               // Search query
  deviceId?: string       // Filter by device
  chatId?: string        // Filter by chat
  from?: string          // Start date (ISO)
  to?: string            // End date (ISO)
  limit?: number         // Results limit
  offset?: number        // Pagination offset
}

// Response (200)
interface SearchResponse {
  messages: Message[]
  totalCount: number
  hasMore: boolean
}

interface Message {
  id: string
  from: string
  to: string
  body: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  deviceId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  metadata?: {
    fileName?: string
    mimeType?: string
    size?: number
    duration?: number
  }
}
```

### Real-time Events (Socket.IO)

#### Client-to-Server Events
```typescript
// Join room for device updates
socket.emit('join-device', { deviceId: string })

// Send message
socket.emit('send-message', {
  deviceId: string
  chatId: string
  message: string
  type: 'text' | 'image' | 'document'
})
```

#### Server-to-Client Events
```typescript
// New message received
socket.on('message', (message: Message) => {
  // Handle incoming message
})

// Device status updated
socket.on('device-status', (data: {
  deviceId: string
  status: 'connected' | 'disconnected' | 'error'
  qrCode?: string
}) => {
  // Handle device status change
})

// Statistics updated
socket.on('stats-update', (stats: Stats) => {
  // Handle stats update
})

// Connection status
socket.on('connection-status', (status: {
  isConnected: boolean
  deviceCount: number
  activeDevices: number
}) => {
  // Handle connection status
})
```

## 🎭 Component Communication Patterns

### 1. **Props Down, Events Up**
```typescript
// Parent Component
const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  
  return (
    <div className="flex">
      <ChatsList 
        selectedChat={selectedChat}
        onChatSelect={setSelectedChat} 
      />
      <MessageThread 
        chatId={selectedChat}
        onMessageSent={(message) => console.log('Sent:', message)}
      />
    </div>
  )
}
```

### 2. **Context for Cross-cutting Concerns**
```typescript
// Authentication across components
const Navigation = () => {
  const { user, logout } = useAuth()
  
  return (
    <nav>
      <span>Welcome, {user?.email}</span>
      <button onClick={logout}>Logout</button>
    </nav>
  )
}
```

### 3. **Store for Shared State**
```typescript
// Shared real-time data
const DeviceList = () => {
  const devices = useDevices()
  const { updateDevice } = useRealtimeStore()
  
  return (
    <div>
      {devices.map(device => (
        <DeviceCard 
          key={device.id}
          device={device}
          onUpdate={updateDevice}
        />
      ))}
    </div>
  )
}
```

## 🔄 Data Synchronization Strategy

### Real-time Updates Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Backend   │───▶│ Socket.IO   │───▶│  Frontend   │
│   Event     │    │  Server     │    │   Client    │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Zustand   │◀───│   React     │◀───│  Component  │
│   Store     │    │   Effect    │    │   Handler   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Offline-First Strategy

1. **Optimistic Updates**: UI updates immediately, syncs with server
2. **Queue Management**: Failed requests are queued for retry
3. **Conflict Resolution**: Server state takes precedence
4. **Cache Strategy**: SWR for data fetching with revalidation

## 🧪 Testing Architecture

### Testing Pyramid Structure

```
┌─────────────────────────────────────┐
│          E2E Tests (Cypress)        │  ← Integration & User Flows
├─────────────────────────────────────┤
│     Integration Tests (Jest)        │  ← API Routes & Hooks
├─────────────────────────────────────┤
│      Component Tests (RTL)          │  ← UI Components
├─────────────────────────────────────┤
│        Unit Tests (Jest)            │  ← Utilities & Pure Functions
└─────────────────────────────────────┘
```

### Testing Patterns

**Component Testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'

const renderWithAuth = (component: React.ReactNode) => {
  return render(
    <AuthProvider>{component}</AuthProvider>
  )
}

describe('Navigation', () => {
  it('shows login button when not authenticated', () => {
    renderWithAuth(<Navigation />)
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
```

**Store Testing:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useRealtimeStore } from '@/stores/realtime-store'

describe('RealtimeStore', () => {
  it('adds messages correctly', () => {
    const { result } = renderHook(() => useRealtimeStore())
    
    act(() => {
      result.current.addMessage({
        id: '1',
        body: 'Hello',
        from: 'user1',
        to: 'user2',
        timestamp: new Date().toISOString()
      })
    })
    
    expect(result.current.messages).toHaveLength(1)
  })
})
```

## 🚀 Performance Considerations

### Code Splitting Strategy

```typescript
// Dynamic imports for route-based splitting
const DevicesPage = dynamic(() => import('./devices/page'), {
  loading: () => <DevicesSkeleton />,
  ssr: false
})

// Component-level lazy loading
const AIChatInterface = lazy(() => import('@/components/ai/AIChatInterface'))
```

### State Management Optimizations

```typescript
// Selector-based subscriptions to prevent unnecessary re-renders
const DeviceCount = () => {
  const deviceCount = useRealtimeStore(state => state.devices.length)
  return <span>{deviceCount} devices</span>
}

// Memoized selectors for complex computations
const useActiveDeviceCount = () => 
  useRealtimeStore(
    useCallback(
      state => state.devices.filter(d => d.status === 'connected').length,
      []
    )
  )
```

### Bundle Optimization

1. **Tree Shaking**: Only import used MUI components
2. **Code Splitting**: Route and component-level lazy loading
3. **Asset Optimization**: Next.js Image component for images
4. **Bundle Analysis**: webpack-bundle-analyzer integration

## 🔐 Security Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│ API Route   │───▶│  Database   │
│  (Cookies)  │    │ (JWT Auth)  │    │ (User Data) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Auto Refresh│◀───│ Middleware  │◀───│ Session     │
│   Logic     │    │ Protection  │    │ Validation  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Security Measures

1. **Input Validation**: Zod schemas for all inputs
2. **CORS Protection**: Configurable allowed origins
3. **Rate Limiting**: Per-endpoint and per-user limits
4. **CSRF Protection**: SameSite cookies
5. **XSS Prevention**: Content Security Policy headers

This architecture ensures a scalable, maintainable, and secure frontend application with clear separation of concerns and modern React patterns.
