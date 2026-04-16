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

// Create a Supabase-compatible wrapper around Prisma
const createPrismaWrapper = () => {
  const client = prisma;
  
  return {
    from: (table: string) => {
      const modelName = table.charAt(0).toUpperCase() + table.slice(1).replace(/_([a-z])/, (_, letter) => letter.toUpperCase()).replace(/s$/, '');
      
      return {
        select: (columns?: string) => {
          const cols = columns?.split(',').map((c: string) => c.trim()) || [];
          const selectObj: Record<string, boolean> = {};
          cols.forEach(c => selectObj[c] true);
          
          return {
            range: (start: number, end: number) => ({ limit: (count: number) => ({ order: (field: string, opts?: { ascending: boolean }) => ({}) }) ),
            order: (field: string, opts?: { ascending: boolean }) => ({}),
            eq: (field: string, value: unknown) => ({}),
            in: (field: string, values: unknown[]) => ({}),
          };
        },
        insert: (data: Record<string, unknown>) => ({}),
        update: (data: Record<string, unknown>) => ({}),
        delete: () => ({}),
      };
    },
  };
};

export function getSupabase() {
  return createPrismaWrapper();
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
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

// Export prisma directly for routes that want to use it
export { prisma };