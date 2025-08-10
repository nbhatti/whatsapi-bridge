import { NextRequest, NextResponse } from 'next/server';
import { getRefreshTokenFromRequest } from '@/lib/cookies';
import { clearTokenCookies } from '@/lib/cookies';
import { verifyRefreshToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);
    
    if (refreshToken) {
      // Verify refresh token to get user info for logging
      const payload = verifyRefreshToken(refreshToken);
      
      if (payload && payload.jwtId) {
        // Delete session from database
        await prisma.session.deleteMany({
          where: {
            jwtId: payload.jwtId,
          },
        });

        // Log activity
        try {
          await prisma.activityLog.create({
            data: {
              userId: payload.userId,
              action: 'logout',
              meta: {
                userAgent: request.headers.get('user-agent'),
                ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              },
            },
          });
        } catch (logError) {
          // Don't fail logout if activity logging fails
          console.error('Failed to log logout activity:', logError);
        }
      }
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      message: 'Logout successful',
    });

    clearTokenCookies(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should clear the cookies
    const response = NextResponse.json({
      message: 'Logout successful',
    });
    
    clearTokenCookies(response);
    
    return response;
  }
}
