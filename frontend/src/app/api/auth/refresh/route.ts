import { NextRequest, NextResponse } from 'next/server';
import { getRefreshTokenFromRequest } from '@/lib/cookies';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setTokenCookies } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request);
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not provided' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload || !payload.jwtId) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { jwtId: payload.jwtId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      );
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({
        where: { id: session.id },
      });
      
      return NextResponse.json(
        { error: 'Refresh token expired' },
        { status: 401 }
      );
    }

    if (session.refreshToken !== refreshToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Generate new tokens
    const newJwtId = randomBytes(32).toString('hex');
    
    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role as 'user' | 'admin',
    });

    const newRefreshToken = generateRefreshToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role as 'user' | 'admin',
      jwtId: newJwtId,
    });

    // Update session with new refresh token
    const newRefreshTokenExpiry = new Date();
    newRefreshTokenExpiry.setDate(newRefreshTokenExpiry.getDate() + 7);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        jwtId: newJwtId,
        refreshToken: newRefreshToken,
        expiresAt: newRefreshTokenExpiry,
      },
    });

    // Create response and set cookies
    const response = NextResponse.json({
      message: 'Tokens refreshed successfully',
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    });

    setTokenCookies(response, newAccessToken, newRefreshToken);

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
