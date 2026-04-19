import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL || 'postgresql://catchandtrade_db_p6co_user:kmLyUdkbsl7AiD1JO0kWtTiG5yGudInp@dpg-d7h5rodckfvc739ql21g-a.oregon-postgres.render.com/catchandtrade_db_p6co?sslmode=require';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;