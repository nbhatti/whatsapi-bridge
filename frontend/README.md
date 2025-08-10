# WhatsApp Web.js REST API Wrapper - Frontend

A modern React frontend application built with Next.js 15 and TypeScript for managing WhatsApp Web.js instances via REST API. Features real-time messaging, device management, analytics dashboard, and AI chat integration.

## 🚀 Features

- **Next.js 15** with App Router and React 19
- **TypeScript** for type safety
- **Material-UI (MUI)** for modern UI components
- **Tailwind CSS** for utility-first styling
- **Real-time messaging** with Socket.IO integration
- **State management** with Zustand
- **Authentication** with JWT and secure session handling
- **Database** integration with Prisma ORM
- **Testing** with Jest, React Testing Library, and Cypress
- **Code quality** with ESLint, Prettier, and Husky
- **Deployment** ready with Docker support

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL (for production) or SQLite (for development)
- Docker (optional, for containerized deployment)

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)

Run the setup script to get started quickly:

```bash
./scripts/setup.sh
```

### Option 2: Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-min-64-characters-long
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-min-64-characters-long

# Database Configuration
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_db"  # PostgreSQL for production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:4000

# API Configuration
BACKEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
```

### 3. Database Setup

Initialize and migrate the database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Create Admin User (Optional)

Create an initial admin user:

```bash
npm run create-admin
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:4000](http://localhost:4000)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── devices/           # Device management
│   │   ├── chat/              # Chat interface
│   │   ├── ai/                # AI chat integration
│   │   └── login/             # Authentication
│   ├── components/            # Reusable UI components
│   │   ├── chat/              # Chat-related components
│   │   ├── devices/           # Device management components
│   │   └── ai/                # AI interface components
│   ├── contexts/              # React contexts
│   │   ├── auth-context.tsx   # Authentication context
│   │   ├── SocketContext.tsx  # Socket.IO context
│   │   └── ThemeContext.tsx   # Theme management
│   ├── stores/                # Zustand state stores
│   │   └── realtime-store.ts  # Real-time data store
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── prisma/                    # Database schema and migrations
├── __tests__/                 # Test files
├── cypress/                   # E2E tests
└── docs/                      # Documentation
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT tokens (min 64 chars) | `your-super-secret-jwt-key-min-64-characters-long` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens (min 64 chars) | `your-super-secret-jwt-refresh-key-min-64-characters-long` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` or `postgresql://...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `BACKEND_URL` | Backend API URL | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,http://localhost:4000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window (ms) | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `RATE_LIMIT_AUTH_MAX` | Max auth attempts per window | `5` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXTAUTH_URL` | NextAuth URL (production) | `https://yourdomain.com` |

## 🛠️ Available Scripts

### Development

```bash
npm run dev          # Start development server on port 4000
npm run build        # Build for production
npm run start        # Start production server on port 3000
```

### Code Quality

```bash
npm run lint         # Run ESLint with zero warnings policy
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Testing

```bash
npm run test         # Run unit tests with Jest
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:api     # Run API-specific tests
npm run test:e2e     # Run end-to-end tests with Cypress
npm run test:all     # Run all tests (unit + api + e2e)
```

### Cypress E2E Testing

```bash
npm run cypress:open # Open Cypress interactive mode
npm run cypress:run  # Run Cypress tests headlessly
```

### Database

```bash
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma migrate   # Run database migrations
npx prisma studio    # Open Prisma Studio (database GUI)
```

### Utilities

```bash
npm run create-admin # Create an admin user interactively
```

## 🐳 Docker Deployment

### Development with Docker

```bash
docker-compose up --build
```

### Production Deployment

1. Copy the production environment template:
   ```bash
   cp .env.production.template .env.production
   ```

2. Update the production environment variables in `.env.production`

3. Build and deploy:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

## 🔑 Authentication

The application uses JWT-based authentication with the following features:

- **Secure session management** with HTTP-only cookies
- **Automatic token refresh** on API requests
- **Role-based access control** (user/admin)
- **Rate limiting** on authentication endpoints
- **Password hashing** with Argon2

### Login Process

1. User submits credentials to `/api/auth/login`
2. Server validates credentials and generates JWT tokens
3. Tokens are stored in HTTP-only cookies
4. Frontend automatically handles token refresh on API calls

## 📱 Real-time Features

The application includes real-time capabilities:

- **Live message updates** via Socket.IO
- **Device status monitoring** with automatic reconnection
- **Real-time analytics** and statistics
- **Push notifications** for important events

## 🎨 UI Components

Built with Material-UI (MUI) and Tailwind CSS:

- **Responsive design** that works on all devices
- **Dark/Light theme** support
- **Accessibility** compliant components
- **Modern design** with consistent styling

## 📊 Monitoring & Analytics

Built-in analytics dashboard featuring:

- **Message statistics** (sent, received, by type)
- **Device performance** metrics
- **User activity** tracking
- **Real-time charts** with Chart.js and Recharts

## 🔒 Security Features

- **JWT token** authentication with refresh mechanism
- **CORS protection** with configurable origins
- **Rate limiting** to prevent abuse
- **Input validation** with Zod schemas
- **Secure headers** with `next-secure-headers`
- **SQL injection** protection with Prisma ORM

## 🚀 Performance Optimizations

- **Server-side rendering** (SSR) with Next.js
- **Static generation** for optimal performance
- **Code splitting** and lazy loading
- **Image optimization** with Next.js Image component
- **Bundle analysis** tools included
- **Efficient state management** with Zustand

## 📚 Additional Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Security Considerations](SECURITY.md)
- [Testing Strategy](TESTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test:all`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the [documentation](docs/)
- Open an [issue](https://github.com/your-repo/issues)
- Join our [Discord community](https://discord.gg/your-invite)
