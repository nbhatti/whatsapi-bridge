import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-guards';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
}

// GET /api/admin/users/[userId] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin access
    const authResult = requireAdmin(request);
    if (!authResult.success) {
      return authResult.error === 'No token provided' || authResult.error === 'Invalid or expired token'
        ? createUnauthorizedResponse(authResult.error)
        : createForbiddenResponse(authResult.error);
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        activityLogs: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            action: true,
            meta: true,
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin access
    const authResult = requireAdmin(request);
    if (!authResult.success) {
      return authResult.error === 'No token provided' || authResult.error === 'Invalid or expired token'
        ? createUnauthorizedResponse(authResult.error)
        : createForbiddenResponse(authResult.error);
    }

    const { userId } = await params;
    const body: UpdateUserRequest = await request.json();
    const { email, password, role } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from demoting themselves
    if (userId === authResult.user!.userId && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    // Validate inputs
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "user" or "admin"' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (email) updateData.email = email;
    if (password) updateData.passwordHash = await hashPassword(password);
    if (role) updateData.role = role;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        userId: authResult.user!.userId,
        action: 'update_user',
        meta: {
          updatedUserId: user.id,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    // If role was changed, invalidate all sessions for this user
    if (role) {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin access
    const authResult = requireAdmin(request);
    if (!authResult.success) {
      return authResult.error === 'No token provided' || authResult.error === 'Invalid or expired token'
        ? createUnauthorizedResponse(authResult.error)
        : createForbiddenResponse(authResult.error);
    }

    const { userId } = await params;

    // Prevent admin from deleting themselves
    if (userId === authResult.user!.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascading deletes will handle sessions, devices, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: authResult.user!.userId,
        action: 'delete_user',
        meta: {
          deletedUserId: existingUser.id,
          deletedUserEmail: existingUser.email,
          deletedUserRole: existingUser.role,
        },
      },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
