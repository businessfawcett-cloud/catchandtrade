import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const set = await prisma.pokemonSet.findUnique({
      where: { code: params.code },
    });

    if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 });

    const cards = await prisma.card.findMany({
      where: { setCode: params.code },
      orderBy: { cardNumber: 'asc' },
    });

    return NextResponse.json({ set, cards });
  } catch (error) {
    console.error('Error in sets/[code] GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
