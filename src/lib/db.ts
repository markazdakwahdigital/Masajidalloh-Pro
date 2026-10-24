import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Rust-free Prisma Client works with node-postgres on Cloudflare Workers
 * (requires nodejs_compat) and in Node.js during local development.
 * Never expose DATABASE_URL to the browser.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Database connection is not configured');
  }
  const target = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || !target.hostname || !target.password || target.password.includes('*')) {
    throw new Error('Database connection URI is invalid or masked');
  }
  console.info('database_target', {host: target.hostname, port: target.port || '5432'});
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
