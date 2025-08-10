import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check database connectivity (optional, can be expensive)
    if (process.env.CHECK_DB_HEALTH === 'true') {
      try {
        await prisma.$queryRaw`SELECT 1`;
        healthStatus.database = 'connected';
      } catch (dbError) {
        healthStatus.database = 'disconnected';
        healthStatus.status = 'degraded';
      }
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
