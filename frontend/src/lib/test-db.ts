import { prisma } from './prisma'

/**
 * Test database connection and basic operations
 */
export async function testDatabaseConnection() {
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Test query - count users
    const userCount = await prisma.user.count()
    console.log(`📊 Current users in database: ${userCount}`)

    return { success: true, userCount }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  } finally {
    await prisma.$disconnect()
  }
}

// Export types for easy access
export type { User, Session, Device, MessageLog, ActivityLog } from '../generated/prisma'
