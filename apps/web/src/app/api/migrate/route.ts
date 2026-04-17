import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    return NextResponse.json({ 
      status: 'ok',
      result: result,
      dbConnected: true
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: String(error),
      dbConnected: false
    }, { status: 500 });
  }
}