import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { return Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString().split(':')[0]; }
  catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        card: { select: { id: true, name: true, setName: true, setCode: true, cardNumber: true, rarity: true, imageUrl: true } },
        seller: { select: { id: true, username: true, displayName: true, avatarId: true } },
      },
    });

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error in listings/:id GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.listing.findUnique({ where: { id: params.id }, select: { sellerId: true } });
    if (!existing || existing.sellerId !== userId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const updateData: any = {};
    if (body.price !== undefined) updateData.buyNowPrice = parseFloat(body.price);
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.isGraded !== undefined) updateData.isGraded = body.isGraded;
    if (body.gradeCompany !== undefined) updateData.gradeCompany = body.gradeCompany;
    if (body.gradeValue !== undefined) updateData.gradeValue = body.gradeValue;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;

    const listing = await prisma.listing.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error in listings/:id PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.listing.findUnique({ where: { id: params.id }, select: { sellerId: true } });
    if (!existing || existing.sellerId !== userId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    await prisma.listing.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in listings/:id DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
