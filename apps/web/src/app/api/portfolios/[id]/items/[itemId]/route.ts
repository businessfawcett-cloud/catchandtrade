import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserIdFromToken(token: string): string | null {
  try { return Buffer.from(token, 'base64').toString().split(':')[0] || null; }
  catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolio = await prisma.portfolio.findFirst({ where: { id: params.id, userId }, select: { id: true } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const item = await prisma.portfolioItem.findFirst({
      where: { id: params.itemId, portfolioId: params.id },
      include: { card: true },
    });

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error('Portfolio item GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolio = await prisma.portfolio.findFirst({ where: { id: params.id, userId }, select: { id: true } });
    if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });

    const body = await request.json();
    const updateData: any = {};
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.isGraded !== undefined) updateData.isGraded = body.isGraded;
    if (body.gradeCompany !== undefined) updateData.gradeCompany = body.gradeCompany;
    if (body.gradeValue !== undefined) updateData.gradeValue = body.gradeValue;
    if (body.purchasePrice !== undefined) updateData.purchasePrice = body.purchasePrice;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const item = await prisma.portfolioItem.update({
      where: { id: params.itemId },
      data: updateData,
      include: { card: true },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error('Portfolio item PUT error:', err);
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

    await prisma.portfolioItem.delete({ where: { id: params.itemId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio item DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
