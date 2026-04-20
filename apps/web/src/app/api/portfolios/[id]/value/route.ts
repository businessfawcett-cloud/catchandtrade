import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserIdFromToken(token: string): string | null {
  try { return Buffer.from(token, 'base64').toString().split(':')[0] || null; }
  catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolio = await prisma.portfolio.findFirst({
      where: { id: params.id, userId },
      include: {
        items: {
          include: {
            card: { include: { prices: { orderBy: { date: 'desc' }, take: 1 } } },
          },
        },
      },
    });

    if (!portfolio) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    let totalValue = 0;
    let cardCount = 0;

    for (const item of portfolio.items) {
      const qty = item.quantity || 1;
      cardCount += qty;
      const latestPrice = item.card.prices[0]?.priceMarket;
      if (latestPrice) totalValue += latestPrice * qty;
    }

    return NextResponse.json({ totalValue, cardCount, uniqueCards: portfolio.items.length });
  } catch (err) {
    console.error('Portfolio value error:', err);
    return NextResponse.json({ totalValue: 0, cardCount: 0, uniqueCards: 0 }, { status: 500 });
  }
}
