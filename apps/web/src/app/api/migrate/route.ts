import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://catchandtrade_db_p6co_user:kmLyUdkbsl7AiD1JO0kWtTiG5yGudInp@dpg-d7h5rodckfvc739ql21g-a/catchandtrade_db_p6co?sslmode=require'
    }
  }
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    return Response.json({ 
      status: 'ok',
      connected: true
    });
  } catch (error) {
    return Response.json({ 
      status: 'error',
      error: String(error),
      connected: false
    }, { status: 500 });
  }
}