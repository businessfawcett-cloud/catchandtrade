import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        setName: true,
        setCode: true,
        cardNumber: true,
      },
    });
    return NextResponse.json({ cards, count: cards.length });
  } catch (error: any) {
    console.error('Cards API Error:', error);
    return NextResponse.json({ 
      error: error?.message || String(error),
      code: error?.code,
      stack: error?.stack
    }, { status: 500 });
  }
}