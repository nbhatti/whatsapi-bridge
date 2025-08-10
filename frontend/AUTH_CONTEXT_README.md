# Authentication Context Implementation

This document explains the authentication context implementation for the WhatsApp Web.js REST API wrapper frontend.

## Files Created

### 1. `src/contexts/auth-context.tsx`
The main authentication context that provides:
- **User state management**: Current user information and loading states
- **Authentication functions**: `login()`, `logout()`, and `refreshUser()`
- **Automatic token refresh**: Silent refresh on 401 responses
- **Global fetch interceptor**: Automatically handles authentication for all API calls

#### Key Features:
- **HTTP-only cookie support**: Works with the backend's cookie-based authentication
- **Automatic retry logic**: On 401 responses, attempts to refresh tokens and retry the original request
- **Loading states**: Provides loading indicators during authentication operations
- **Error handling**: Graceful error handling with user-friendly messages

### 2. `src/hooks/use-auth.ts`
A convenience hook that exports the authentication context and types for easy importing throughout the application.

### 3. `src/components/auth-example.tsx`
A complete example component demonstrating how to use the authentication context with:
- Login form with email/password
- User information display when logged in
- Logout functionality
- Loading states and error handling

### 4. Updated `src/app/layout.tsx`
The root layout now includes the `AuthProvider` wrapper, making authentication available throughout the entire application.

## Usage Examples

### Basic Authentication Hook Usage
```tsx
import { useAuth } from '../hooks/use-auth'

function MyComponent() {
  const { user, loading, login, logout } = useAuth()

  if (loading) return <div>Loading...</div>
  
  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return <LoginForm onLogin={login} />
}
```

### Making Authenticated API Calls
```tsx
function MyComponent() {
  const { user } = useAuth()
  
  useEffect(() => {
    if (user) {
      // This will automatically include authentication and handle token refresh
      fetch('/api/some-protected-endpoint')
        .then(res => res.json())
        .then(data => console.log(data))
    }
  }, [user])
}
```

### Login Function Usage
```tsx
const handleLogin = async (credentials) => {
  const result = await login(credentials)
  
  if (result.success) {
    // Login successful, user state automatically updated
    console.log('Login successful!')
  } else {
    // Handle error
    console.error('Login failed:', result.error)
  }
}
```

## Technical Implementation Details

### Token Refresh Strategy
The authentication context implements automatic token refresh using the following strategy:

1. **Global Fetch Interceptor**: All API requests (except auth endpoints) are automatically intercepted
2. **401 Detection**: When a 401 response is received, the context attempts to refresh the token
3. **Silent Refresh**: The refresh happens transparently using the `/api/auth/refresh` endpoint
4. **Request Retry**: If refresh succeeds, the original request is automatically retried
5. **Logout on Failure**: If refresh fails, the user is automatically logged out

### Cookie-Based Authentication
The implementation works seamlessly with HTTP-only cookies:
- **Security**: Tokens are stored in secure, HTTP-only cookies managed by the backend
- **Automatic Inclusion**: Cookies are automatically included in all requests via `credentials: 'include'`
- **Cross-Site Protection**: Configured with appropriate SameSite and Secure flags

### Error Handling
- **Network Errors**: Gracefully handled with user-friendly messages
- **Authentication Errors**: Proper error states with detailed feedback
- **Loading States**: Clear loading indicators during async operations

## Integration with Backend

The authentication context integrates with the following backend endpoints:

- **POST `/api/auth/login`**: User login with email/password
- **POST `/api/auth/logout`**: User logout and session cleanup
- **POST `/api/auth/refresh`**: Silent token refresh
- **GET `/api/auth/me`**: Get current user information

## Security Considerations

1. **HTTP-Only Cookies**: Tokens are not accessible to JavaScript, preventing XSS attacks
2. **Automatic Refresh**: Tokens are refreshed silently, maintaining security without user friction
3. **Secure Transmission**: All authentication requests use HTTPS in production
4. **Session Management**: Proper cleanup of expired sessions on the backend

## Next Steps

To use this authentication system in your components:

1. Import the `useAuth` hook from `src/hooks/use-auth`
2. Use the provided `user`, `loading`, `login`, `logout`, and `refreshUser` functions
3. The authentication state will be automatically managed across your entire application
4. All API requests will automatically include authentication and handle token refresh

The authentication context is now fully integrated and ready for use throughout the application!
