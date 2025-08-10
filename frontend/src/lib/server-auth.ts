import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { Role } from './auth-config';
import { verifyAccessToken } from './jwt';
import { getTokenFromRequest } from './cookies';

export interface ServerUser {
  id: string;
  email: string;
  role: Role;
}

export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const userEmail = headersList.get('x-user-email');
    const userRole = headersList.get('x-user-role');

    if (!userId || !userEmail || !userRole) {
      return null;
    }

    return {
      id: userId,
      email: userEmail,
      role: userRole as Role,
    };
  } catch {
    return null;
  }
}

export async function requireServerAuth(): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireServerAdmin(): Promise<ServerUser> {
  const user = await requireServerAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

// Verify auth from request
export async function verifyAuth(request: NextRequest): Promise<{ success: boolean; user?: ServerUser; error?: string }> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return { success: false, error: 'Missing authentication token' };
    }

    const payload = verifyAccessToken(token);
    
    if (!payload || !payload.userId) {
      return { success: false, error: 'Invalid token' };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
      },
    };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

// Get full user data from database
export async function getServerUserWithDetails(): Promise<any | null> {
  const user = await getServerUser();
  if (!user) return null;

  return await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      devices: {
        select: {
          id: true,
          name: true,
          waDeviceId: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          devices: true,
          activityLogs: true,
        },
      },
    },
  });
}
