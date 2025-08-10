# Security Implementation Guide

This document outlines the security measures implemented in the WhatsApp Web.js Frontend application.

## 🛡️ Security Features Implemented

### 1. Rate Limiting
- **Library**: `next-rate-limit`
- **Implementation**: `/src/lib/rate-limit.ts`
- **Configuration**:
  - **General API**: 100 requests per 15 minutes
  - **Auth endpoints**: 5 requests per 15 minutes
  - **Heavy operations** (AI chat, file uploads): 20 requests per 15 minutes

**Usage Example**:
```typescript
import { withRateLimit } from '@/lib/rate-limit';

export const POST = withRateLimit(handler, 'auth');
```

### 2. Request Validation with Zod
- **Library**: `zod`
- **Implementation**: `/src/lib/validation.ts`
- **Features**:
  - Type-safe request validation
  - Comprehensive error messages
  - Input sanitization

**Available Schemas**:
- `loginSchema` - Login credentials validation
- `registerSchema` - User registration validation
- `sendMessageSchema` - Message sending validation
- `aiChatSchema` - AI chat validation
- And many more...

**Usage Example**:
```typescript
import { withValidation, loginSchema } from '@/lib/validation';

export const POST = withValidation(loginSchema, handler);
```

### 3. CORS Configuration
- **Implementation**: `next.config.js`
- **Features**:
  - Dynamic origin validation based on environment
  - Proper preflight handling
  - Credential support

**Environment Variables**:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:4000
```

### 4. Security Headers (Helmet-style)
- **Library**: `next-secure-headers`
- **Implementation**: `next.config.js`
- **Headers Applied**:
  - Content Security Policy (CSP)
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Referrer Policy
  - Permissions Policy

### 5. Security Middleware Composer
- **Implementation**: `/src/lib/security-middleware.ts`
- **Features**:
  - Combines rate limiting, validation, auth, and CORS
  - Multiple convenience functions for different use cases
  - Type-safe middleware composition

**Usage Examples**:
```typescript
// For public endpoints with validation
export const POST = withPublicValidation(handler, schema, 'auth');

// For authenticated endpoints with validation
export const POST = withAuthAndValidation(handler, schema, 'general');

// For admin-only endpoints
export const GET = withAdminAuth(handler, schema);
```

### 6. Environment Variable Security
- **File**: `.env.local`
- **Security**: 
  - Never committed to git (in `.gitignore`)
  - Contains sensitive configuration
  - Separate from public environment variables

**Required Variables**:
```env
JWT_SECRET=your-very-secure-jwt-secret-here-change-in-production
JWT_REFRESH_SECRET=your-very-secure-jwt-refresh-secret-here-change-in-production
DATABASE_URL=file:./dev.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:4000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
BACKEND_URL=http://localhost:3000
```

## 🚦 Security Middleware Usage Guide

### Basic Usage

#### Public Endpoint with Validation
```typescript
import { withPublicValidation } from '@/lib/security-middleware';
import { loginSchema } from '@/lib/validation';

export const POST = withPublicValidation(async (request, body) => {
  const { email, password } = body;
  // Handler logic here
}, loginSchema, 'auth');
```

#### Authenticated Endpoint
```typescript
import { withAuthAndValidation } from '@/lib/security-middleware';
import { sendMessageSchema } from '@/lib/validation';

export const POST = withAuthAndValidation(async (request, body, user) => {
  const { to, message, deviceId } = body;
  // Handler logic here
}, sendMessageSchema, 'general');
```

#### Admin-Only Endpoint
```typescript
import { withAdminAuth } from '@/lib/security-middleware';
import { createUserSchema } from '@/lib/validation';

export const POST = withAdminAuth(async (request, body, user) => {
  const { email, password, role } = body;
  // Handler logic here
}, createUserSchema);
```

### Advanced Usage with Custom Options
```typescript
import { withSecurity } from '@/lib/security-middleware';
import { customSchema } from '@/lib/validation';

export const POST = withSecurity(
  async (request, validatedBody, user) => {
    // Handler logic
  },
  {
    rateLimitType: 'heavy',
    requireAuth: true,
    requireAdmin: false,
    bodySchema: customSchema,
    skipCORS: false,
  }
);
```

## 🔒 Rate Limiting Details

### Rate Limit Types
1. **General** (`general`): 100 requests per 15 minutes
   - Used for regular API endpoints
   - Suitable for most operations

2. **Authentication** (`auth`): 5 requests per 15 minutes
   - Used for login, register, password reset
   - Prevents brute force attacks

3. **Heavy Operations** (`heavy`): 20 requests per 15 minutes
   - Used for AI chat, file uploads, bulk operations
   - Prevents resource exhaustion

### Rate Limit Headers
When a rate limit is applied, the following headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Window`: Time window in milliseconds
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

## 🛠️ Configuration

### Environment Variables

#### Required Security Variables
```env
# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-here-change-in-production
JWT_REFRESH_SECRET=your-very-secure-jwt-refresh-secret-here-change-in-production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:4000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Backend URL for proxying
BACKEND_URL=http://localhost:3000
```

#### Optional AI Configuration
```env
# AI Service Configuration (if using external AI)
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL=gpt-3.5-turbo
```

### Next.js Configuration
The `next.config.js` file includes:
- Security headers via `next-secure-headers`
- CORS configuration for API routes
- CSP policies for frontend security
- API proxying configuration

## 📝 Security Checklist

### ✅ Implemented
- [x] Rate limiting for all endpoint types
- [x] Request validation with Zod schemas
- [x] CORS configuration
- [x] Security headers (CSP, X-Frame-Options, etc.)
- [x] Environment variable security
- [x] Input sanitization
- [x] Authentication middleware
- [x] Admin authorization
- [x] Activity logging for sensitive operations

### 🔄 Recommended Additional Measures

#### For Production
1. **SSL/TLS**: Ensure HTTPS in production
2. **Database Security**: Use connection encryption
3. **API Monitoring**: Implement API monitoring and alerting
4. **Regular Security Updates**: Keep dependencies updated
5. **Security Testing**: Regular penetration testing
6. **Backup Security**: Secure backup procedures

#### Environment-Specific
```env
# Production
NODE_ENV=production
JWT_SECRET=<strong-production-secret>
DATABASE_URL=<encrypted-production-db-url>

# Development
NODE_ENV=development
JWT_SECRET=<development-secret>
DATABASE_URL=file:./dev.db
```

## 🚨 Security Incident Response

### Rate Limit Exceeded
- Check logs for IP patterns
- Verify legitimate vs malicious traffic
- Adjust rate limits if necessary
- Consider IP blocking for persistent abuse

### Validation Errors
- Monitor for unusual validation failure patterns
- Check for potential injection attempts
- Update validation rules if needed

### Authentication Failures
- Monitor failed login attempts
- Implement account lockout for repeated failures
- Alert on suspicious authentication patterns

## 📊 Monitoring

### Recommended Metrics
1. **Rate Limit Violations**: Track by IP and endpoint
2. **Validation Failures**: Monitor validation error rates
3. **Authentication Failures**: Track failed login attempts
4. **Response Times**: Monitor for DoS attacks
5. **Error Rates**: General application health

### Log Analysis
Security-related events are logged with:
- IP addresses
- User agents
- Request details
- Timestamps
- User context (when authenticated)

## 🤝 Contributing to Security

When adding new endpoints:
1. Always use appropriate security middleware
2. Validate all inputs with Zod schemas
3. Apply correct rate limiting based on endpoint sensitivity
4. Follow the principle of least privilege
5. Log security-relevant events

### Example New Endpoint Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndValidation } from '@/lib/security-middleware';
import { yourSchema } from '@/lib/validation';

export const POST = withAuthAndValidation(async (request, body, user) => {
  try {
    // Your endpoint logic here
    
    // Log important actions
    console.log(`Action performed by user: ${user.userId}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, yourSchema, 'general'); // Choose appropriate rate limit type
```

---

**⚠️ Important**: Remember to update the `.env.local` file with production secrets before deployment and never commit sensitive environment variables to version control.
