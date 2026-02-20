/**
 * @file db.ts
 * @description Configures and exports a singleton PrismaClient instance.
 * 
 * WHY THIS PATTERN?
 * - Next.js hot-reloads modules in development, which can create multiple 
 *   PrismaClient instances and exhaust database connections.
 * - We use `globalThis` to cache the client across hot reloads.
 * - In production, `globalThis` isn't shared across serverless instances, 
 *   so each instance gets its own client (which is correct).
 * 
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

// Configure the PostgreSQL adapter for Prisma
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma