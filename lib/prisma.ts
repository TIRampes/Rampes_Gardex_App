import { PrismaClient } from '@prisma/client'

// On utilise un singleton pour éviter de créer plusieurs instances lors du hot reload en dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()
// On assigne le singleton uniquement en dev
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
