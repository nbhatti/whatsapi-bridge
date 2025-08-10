import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from './rate-limit';
import { withValidation } from './validation';
import { verifyAuth } from './server-auth';

// Security middleware options
export interface SecurityOptions<TBody> {
  rateLimitType?: 'general' | 'auth' | 'heavy';
  requireAuth?: boolean;
  requireAdmin?: boolean;
  bodySchema?: z.ZodSchema<TBody> | null;
  skipCORS?: boolean;
}

// CORS middleware
function withCORS<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse | Response>
) {
  return async function corsHandler(request: NextRequest, ...args: T) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    const response = await handler(request, ...args);
    
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Credentials': 'true',
    };
    
    if (response instanceof NextResponse) {
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    // For regular Response objects
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: { ...response.headers, ...corsHeaders },
    });
    
    return newResponse;
  };
}

// Helper function to get allowed origin
function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  
  return allowedOrigins[0]; // Default to first allowed origin
}

// Authentication middleware
function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse | Response>,
  requireAdmin: boolean = false
) {
  return async function authHandler(request: NextRequest, ...args: T) {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    if (requireAdmin && authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, authResult.user, ...args);
  };
}

// Main security middleware composer
export function withSecurity<TBody, TParams extends any[]>(
  handler: (
    request: NextRequest,
    validatedBody: TBody | null,
    user: any,
    ...args: TParams
  ) => Promise<NextResponse | Response>,
  options: SecurityOptions<TBody> = {}
) {
  const {
    rateLimitType = 'general',
    requireAuth = true,
    requireAdmin = false,
    bodySchema = null,
    skipCORS = false,
  } = options;
  
  let securedHandler = handler;
  
  // Apply validation if schema is provided
  if (bodySchema) {
    securedHandler = withValidation(bodySchema, 
      async (request: NextRequest, validatedBody: TBody | null, ...args: TParams) => {
        if (requireAuth) {
          return withAuth(
            (req, user) => handler(req, validatedBody, user, ...args),
            requireAdmin
          )(request);
        }
        return handler(request, validatedBody, null, ...args);
      }
    );
  } else {
    // No validation, but may need auth
    if (requireAuth) {
      securedHandler = withAuth(
        (request, user, ...args) => handler(request, null, user, ...args),
        requireAdmin
      );
    } else {
      securedHandler = (request: NextRequest, ...args: TParams) => 
        handler(request, null, null, ...args);
    }
  }
  
  // Apply rate limiting
  securedHandler = withRateLimit(securedHandler, rateLimitType);
  
  // Apply CORS if not skipped
  if (!skipCORS) {
    securedHandler = withCORS(securedHandler);
  }
  
  return securedHandler;
}

// Simplified versions for common use cases
export function withAuthAndValidation<TBody>(
  handler: (request: NextRequest, body: TBody, user: any) => Promise<NextResponse | Response>,
  bodySchema: z.ZodSchema<TBody>,
  rateLimitType: 'general' | 'auth' | 'heavy' = 'general'
) {
  return withSecurity(
    async (request, validatedBody, user) => {
      return handler(request, validatedBody!, user);
    },
    {
      bodySchema,
      rateLimitType,
      requireAuth: true,
    }
  );
}

export function withPublicValidation<TBody>(
  handler: (request: NextRequest, body: TBody) => Promise<NextResponse | Response>,
  bodySchema: z.ZodSchema<TBody>,
  rateLimitType: 'general' | 'auth' | 'heavy' = 'auth' // Auth endpoints are usually public but heavily rate limited
) {
  return withSecurity(
    async (request, validatedBody) => {
      return handler(request, validatedBody!);
    },
    {
      bodySchema,
      rateLimitType,
      requireAuth: false,
    }
  );
}

export function withAdminAuth<TBody = null>(
  handler: (request: NextRequest, body: TBody | null, user: any) => Promise<NextResponse | Response>,
  bodySchema?: z.ZodSchema<TBody>
) {
  return withSecurity(
    async (request, validatedBody, user) => {
      return handler(request, validatedBody, user);
    },
    {
      bodySchema: bodySchema || null,
      rateLimitType: 'general',
      requireAuth: true,
      requireAdmin: true,
    }
  );
}

// Security headers middleware for additional protection
export function addSecurityHeaders(response: NextResponse | Response): NextResponse | Response {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  
  if (response instanceof NextResponse) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
  
  // For regular Response objects
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: { ...response.headers, ...headers },
  });
}
