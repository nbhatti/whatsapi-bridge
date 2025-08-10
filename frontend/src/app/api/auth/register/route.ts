import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setTokenCookies } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

interface RegisterRequest {
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, role = 'user' } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
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
        refreshToken: refreshToken, // In production, consider hashing this too
        expiresAt: refreshTokenExpiry,
      },
    });

    // Create response and set cookies
    const response = NextResponse.json({
      message: 'User registered successfully',
      user,
    }, { status: 201 });

    setTokenCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
