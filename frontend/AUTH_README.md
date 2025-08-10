# Authentication System

This Next.js application implements a secure JWT-based authentication system with role-based access control.

## Features

- **JWT Authentication**: Access tokens (15 min) and refresh tokens (7 days)
- **Secure Cookies**: HTTP-only cookies for token storage
- **Password Security**: Argon2 password hashing
- **Role-based Access**: Admin and User roles
- **Session Management**: Refresh tokens stored in database
- **Middleware Protection**: Automatic route protection
- **Activity Logging**: User action tracking

## API Endpoints

### Authentication Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh access token

### Admin Routes

- `GET /api/admin/users` - List all users (Admin only)
- `POST /api/admin/users` - Create new user (Admin only)
- `GET /api/admin/users/[userId]` - Get user details (Admin only)
- `PUT /api/admin/users/[userId]` - Update user (Admin only)
- `DELETE /api/admin/users/[userId]` - Delete user (Admin only)

## Setup

### 1. Environment Variables

Copy `env.example` to `.env.local` and configure:

```bash
cp env.example .env.local
```

Set secure JWT secrets:

```env
ACCESS_TOKEN_SECRET="your-super-secure-access-token-secret"
REFRESH_TOKEN_SECRET="your-super-secure-refresh-token-secret"
```

### 2. Database Migration

Run Prisma migrations:

```bash
npx prisma migrate dev
```

### 3. Create Admin User

```bash
npm run create-admin
```

Or with custom credentials:

```bash
ADMIN_EMAIL="admin@yourcompany.com" ADMIN_PASSWORD="secure-password" npm run create-admin
```

## Usage

### Server-Side Authentication

```typescript
import { getServerUser, requireServerAdmin } from '@/lib/server-auth';

// Optional authentication
export default async function Page() {
  const user = await getServerUser();
  return <div>Welcome {user?.email || 'Guest'}</div>;
}

// Required authentication
export default async function ProtectedPage() {
  const user = await requireServerAuth();
  return <div>Welcome {user.email}</div>;
}

// Admin required
export default async function AdminPage() {
  const admin = await requireServerAdmin();
  return <div>Admin: {admin.email}</div>;
}
```

### API Route Protection

```typescript
import { requireAuth, requireAdmin } from '@/lib/auth-guards';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.success) {
    return createUnauthorizedResponse(authResult.error);
  }
  // Handle authenticated request
}
```

### Client-Side Usage

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// Get current user
const userResponse = await fetch('/api/auth/me');
const { user } = await userResponse.json();

// Logout
await fetch('/api/auth/logout', { method: 'POST' });
```

## Security Features

### Password Security
- Argon2id hashing with secure parameters
- Minimum 6 characters (configurable)

### JWT Tokens
- Access tokens: 15 minutes lifetime
- Refresh tokens: 7 days lifetime
- Secure, HTTP-only cookies
- Automatic token refresh

### Session Management
- Refresh tokens stored in database with expiry
- Session cleanup on logout
- Expired session cleanup

### Route Protection
- Middleware-based page protection
- Role-based access control
- Automatic redirects for unauthenticated users

## Middleware Configuration

Protected routes are defined in `src/middleware.ts`:

```typescript
const protectedPaths = ['/dashboard', '/devices', '/users', '/admin'];
const adminPaths = ['/admin', '/users'];
```

## Database Schema

The auth system uses these Prisma models:

- **User**: Stores user credentials and profile info
- **Session**: Manages refresh tokens and expiry
- **ActivityLog**: Tracks user actions for auditing

## Development

### Testing Authentication

1. Create admin user: `npm run create-admin`
2. Start dev server: `npm run dev`
3. Navigate to `/login`
4. Use admin credentials to login
5. Access protected routes like `/dashboard`

### Adding New Roles

1. Update `ROLES` in `src/lib/auth-config.ts`
2. Update role validation in API routes
3. Add role-specific guards in `src/lib/auth-guards.ts`
4. Update middleware if needed

## Security Considerations

- Always use HTTPS in production
- Set secure JWT secrets (use random 32+ character strings)
- Regularly rotate JWT secrets
- Monitor activity logs for suspicious activity
- Implement rate limiting for auth endpoints
- Consider implementing account lockout after failed attempts

## Troubleshooting

### Common Issues

1. **"Invalid or expired token"**: Token may have expired, try refreshing
2. **"Insufficient permissions"**: User doesn't have required role
3. **Cookie issues**: Check secure/sameSite settings for your domain
4. **Database connection**: Ensure DATABASE_URL is correct

### Debugging

Enable debug logging by adding to your `.env.local`:

```env
DEBUG=true
```
