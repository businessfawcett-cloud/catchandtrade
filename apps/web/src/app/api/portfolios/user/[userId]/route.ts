import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: params.userId, isPublic: true },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { card: true },
        },
      },
    });

    return NextResponse.json(portfolios);
  } catch (error) {
    console.error('Error fetching user portfolios:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
