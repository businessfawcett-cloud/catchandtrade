import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserIdFromToken(token: string): string | null {
  try {
    return Buffer.from(token, 'base64').toString().split(':')[0] || null;
  } catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolio = await prisma.portfolio.findFirst({
      where: { id: params.id, userId },
      include: { items: { include: { card: true } } },
    });

    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    return NextResponse.json(portfolio);
  } catch (err) {
    console.error('Portfolio GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { name, description, isPublic } = await request.json();
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const portfolio = await prisma.portfolio.updateMany({
      where: { id: params.id, userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await prisma.portfolioItem.deleteMany({ where: { portfolioId: params.id } });
    await prisma.portfolio.deleteMany({ where: { id: params.id, userId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
