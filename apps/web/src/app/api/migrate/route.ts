import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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