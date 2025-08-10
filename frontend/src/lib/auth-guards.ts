import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from './cookies';
import { verifyAccessToken, TokenPayload } from './jwt';
import { ROLES, Role } from './auth-config';

export interface AuthResult {
  success: boolean;
  user?: TokenPayload;
  error?: string;
}

export function authenticateRequest(request: NextRequest): AuthResult {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return { success: false, error: 'Invalid or expired token' };
  }

  return { success: true, user: payload };
}

export function requireAuth(request: NextRequest): AuthResult {
  return authenticateRequest(request);
}

export function requireRole(request: NextRequest, requiredRole: Role): AuthResult {
  const authResult = authenticateRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user!.role !== requiredRole) {
    return { success: false, error: 'Insufficient permissions' };
  }

  return authResult;
}

export function requireAdmin(request: NextRequest): AuthResult {
  return requireRole(request, ROLES.ADMIN);
}

export function requireUser(request: NextRequest): AuthResult {
  const authResult = authenticateRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Both admin and user roles can access user-level endpoints
  const userRole = authResult.user!.role;
  if (userRole !== ROLES.ADMIN && userRole !== ROLES.USER) {
    return { success: false, error: 'Invalid role' };
  }

  return authResult;
}

// Utility to create unauthorized response
export function createUnauthorizedResponse(error: string = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error }, { status: 401 });
}

// Utility to create forbidden response
export function createForbiddenResponse(error: string = 'Forbidden'): NextResponse {
  return NextResponse.json({ error }, { status: 403 });
}
