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

    const portfolio = await prisma.portfolio.findFirst({ where: { id: params.id, userId }, select: { id: true } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const items = await prisma.portfolioItem.findMany({
      where: { portfolioId: params.id },
      include: { card: true },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error('Portfolio items GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolio = await prisma.portfolio.findFirst({ where: { id: params.id, userId }, select: { id: true } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const body = await request.json();
    const { cardId, quantity, condition, isGraded, gradeCompany, gradingService, gradeValue, purchasePrice, notes } = body;

    if (!cardId) return NextResponse.json({ error: 'cardId required' }, { status: 400 });

    const item = await prisma.portfolioItem.create({
      data: {
        portfolioId: params.id,
        cardId,
        quantity: quantity || 1,
        condition: condition || 'NEAR_MINT',
        isGraded: isGraded || false,
        gradeCompany: gradeCompany || gradingService || null,
        gradeValue: gradeValue || null,
        purchasePrice: purchasePrice || null,
        notes: notes || null,
      },
      include: { card: true },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error('Portfolio items POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolio = await prisma.portfolio.findFirst({ where: { id: params.id, userId }, select: { id: true } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId') || (params as any).itemId;
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

    await prisma.portfolioItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio items DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
