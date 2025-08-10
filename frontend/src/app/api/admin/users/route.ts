import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { withSecurity, withAdminAuth } from '@/lib/security-middleware';
import { registerSchema } from '@/lib/validation';

// GET /api/admin/users - List all users
export const GET = withAdminAuth(async (request: NextRequest, body, user) => {
  try {

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              devices: true,
              activityLogs: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/admin/users - Create new user  
export const POST = withAdminAuth(async (request: NextRequest, body, user) => {
  try {
    // body is validated by registerSchema, so it's guaranteed to be non-null
    const { email, password, confirmPassword, role = 'user' } = body!;

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
    const newUser = await prisma.user.create({
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'create_user',
        meta: {
          createdUserId: newUser.id,
          createdUserEmail: newUser.email,
          createdUserRole: newUser.role,
        },
      },
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, registerSchema);
