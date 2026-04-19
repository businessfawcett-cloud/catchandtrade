import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL || 'postgresql://catchandtrade_db_p6co_user:kmLyUdkbsl7AiD1JO0kWtTiG5yGudInp@dpg-d7h5rodckfvc739ql21g-a.oregon-postgres.render.com/catchandtrade_db_p6co?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    return NextResponse.json({ 
      status: 'ok',
      connected: true,
      dbUrlPresent: !!process.env.DATABASE_URL
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      error: error?.message || String(error),
      connected: false,
      dbUrlPresent: !!process.env.DATABASE_URL
    }, { status: 500 });
  }
}