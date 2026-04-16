import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'exists' : 'MISSING');
    console.log('Attempting prisma query...');
    
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

    console.log('Query succeeded, found', sets.length, 'sets');
    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Error in sets GET:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}