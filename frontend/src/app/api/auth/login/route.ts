import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setTokenCookies } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { withPublicValidation } from '@/lib/security-middleware';
import { loginSchema } from '@/lib/validation';

export const POST = withPublicValidation(async (request: NextRequest, body) => {
  try {
    const { email, password } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Clean up any expired sessions for this user
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Generate JWT ID for refresh token
    const jwtId = randomBytes(32).toString('hex');

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
      jwtId,
    });

    // Store refresh token in database
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        jwtId,
        refreshToken: refreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'login',
        meta: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        },
      },
    });

    // Create response and set cookies
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

    setTokenCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, loginSchema, 'auth');
