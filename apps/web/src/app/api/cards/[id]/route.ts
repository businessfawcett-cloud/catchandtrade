import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cards/:id - Get single card
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 90
        }
      }
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}