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
  try {
    const target = new URL(connectionString);
    console.info('database_target', {host: target.hostname, port: target.port || '5432',hasPassword:!!target.password,masked:target.password.includes('*')});
  } catch {console.error('database_target_invalid', {quoted:/^["']/.test(connectionString),assignment:connectionString.startsWith('DATABASE_URL='),masked:connectionString.includes('****')});}
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
