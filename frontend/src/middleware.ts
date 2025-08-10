import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/cookies';
import { verifyAccessTokenEdge } from '@/lib/jwt-edge';

// Define protected routes
const protectedPaths = [
  '/dashboard',
  '/devices',
  '/users',
  '/admin',
];

const adminPaths = [
  '/admin',
  '/users',
];

const authPaths = [
  '/login',
  '/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);
  const user = token ? await verifyAccessTokenEdge(token) : null;

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check if the current path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    // If no valid token, redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if admin access is required
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
    if (isAdminPath && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard?error=insufficient_permissions', request.url));
    }
  }

  // Add user info to headers for server components (if authenticated)
  const response = NextResponse.next();
  if (user) {
    response.headers.set('x-user-id', user.userId);
    response.headers.set('x-user-email', user.email);
    response.headers.set('x-user-role', user.role);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
