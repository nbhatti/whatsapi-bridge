import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = requireAuth(request);
    
    if (!authResult.success) {
      return createUnauthorizedResponse(authResult.error);
    }

    const { user: tokenPayload } = authResult;

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload!.userId },
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

    if (!user) {
      return createUnauthorizedResponse('User not found');
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
