import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    userId = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString().split(':')[0];
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const setCards = await prisma.card.findMany({
    where: { setCode: params.code.toLowerCase() },
    select: { id: true, name: true, cardNumber: true, rarity: true },
    orderBy: { cardNumber: 'asc' },
  });

  if (!setCards.length) return NextResponse.json({ error: 'Set not found' }, { status: 404 });

  const portfolios = await prisma.portfolio.findMany({ where: { userId }, select: { id: true } });
  const portfolioIds = portfolios.map((p) => p.id);

  const userItems = await prisma.portfolioItem.findMany({
    where: { portfolioId: { in: portfolioIds }, cardId: { in: setCards.map((c) => c.id) } },
    select: { cardId: true },
  });

  const ownedIds = new Set(userItems.map((i) => i.cardId));
  const ownedCards = setCards.filter((c) => ownedIds.has(c.id));
  const missingCards = setCards.filter((c) => !ownedIds.has(c.id));
  const progress = setCards.length > 0 ? Math.round((ownedCards.length / setCards.length) * 1000) / 10 : 0;

  return NextResponse.json({
    progress,
    ownedCards: ownedCards.map((c) => c.id),
    missingCards: missingCards.map((c) => c.id),
    totalCards: setCards.length,
    ownedCount: ownedCards.length,
  });
}
