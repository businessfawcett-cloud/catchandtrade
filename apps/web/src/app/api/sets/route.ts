import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sets = await prisma.pokemonSet.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        releaseYear: true,
        imageUrl: true,
        totalCards: true,
      },
      orderBy: { releaseYear: 'desc' },
    });

    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Error in sets GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}