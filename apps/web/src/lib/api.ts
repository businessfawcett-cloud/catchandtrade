import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export function getSupabase() {
  return prisma;
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijnajdpcplapwiyvzsdh.supabase.co';
}

export function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_KEY || '';
}

export function getWebUrl() {
  return process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://catchandtrade.com';
}

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'https://catchandtrade.com/api';
}