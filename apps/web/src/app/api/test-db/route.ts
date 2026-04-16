import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await prisma.pokemonSet.count();
    return NextResponse.json({ 
      status: 'ok',
      setsCount: count,
      dbUrl: process.env.DATABASE_URL ? 'present' : 'MISSING'
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ 
      status: 'error',
      error: String(error),
      message: err.message 
    }, { status: 500 });
  }
}