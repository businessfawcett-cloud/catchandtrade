import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { return Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString().split(':')[0]; }
  catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'No token provided' }, { status: 401 });

    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      include: { card: true },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error('Watchlist GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'No token provided' }, { status: 401 });

    const body = await request.json();
    const cardId = body.cardId || body.cardid;
    if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_cardId: { userId, cardId } },
    });
    if (existing) return NextResponse.json({ error: 'Already in watchlist' }, { status: 400 });

    const item = await prisma.watchlistItem.create({
      data: { userId, cardId },
      include: { card: true },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error('Watchlist POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'No token provided' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId') || searchParams.get('cardid');
    if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

    await prisma.watchlistItem.deleteMany({ where: { userId, cardId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Watchlist DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
