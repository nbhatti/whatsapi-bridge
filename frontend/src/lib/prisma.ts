import { PrismaClient } from '../generated/prisma'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Ensure we don't create multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
