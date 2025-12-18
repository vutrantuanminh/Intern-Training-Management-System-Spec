import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Create Prisma client with logging in development
export const prisma = new PrismaClient({
    log: env.isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
