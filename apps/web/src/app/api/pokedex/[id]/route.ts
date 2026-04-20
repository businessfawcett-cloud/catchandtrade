import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: params.id },
    });

    if (!card) return NextResponse.json({ error: 'Pokemon not found' }, { status: 404 });
    return NextResponse.json({ pokemon: card });
  } catch (err) {
    console.error('Error fetching pokemon:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
