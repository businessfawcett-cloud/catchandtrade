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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status') as any;

    const where: any = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { card: { select: { id: true, name: true, setName: true, setCode: true, cardNumber: true, imageUrl: true } } } },
        buyer: { select: { id: true, username: true, displayName: true } },
        seller: { select: { id: true, username: true, displayName: true } },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error in orders GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const buyerId = getUserId(request.headers.get('Authorization'));
    if (!buyerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId, shippingAddress } = await request.json();
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing is not available' }, { status: 400 });

    const platformFee = listing.buyNowPrice * (listing.commissionPct / 100);
    const sellerPayout = listing.buyNowPrice - platformFee;

    const order = await prisma.order.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        amount: listing.buyNowPrice,
        platformFee,
        sellerPayout,
        status: 'PENDING',
        shippingAddress: shippingAddress || undefined,
      },
    });

    await prisma.listing.update({ where: { id: listingId }, data: { status: 'SOLD' } });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in orders POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, status, trackingNumber } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true, sellerId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.buyerId !== userId && order.sellerId !== userId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (status === 'DELIVERED') updateData.completedAt = new Date();

    const updated = await prisma.order.update({ where: { id: orderId }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in orders PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
