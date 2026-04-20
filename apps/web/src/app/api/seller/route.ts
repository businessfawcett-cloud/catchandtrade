import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { return Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString().split(':')[0]; }
  catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (sellerId) {
      const seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: { id: true, username: true, displayName: true, avatarId: true, isVerifiedSeller: true },
      });

      if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

      const listings = await prisma.listing.findMany({
        where: { sellerId, status: 'ACTIVE' },
        include: { card: true },
      });

      return NextResponse.json({ seller, listings, reviews: [], rating: null });
    }

    const sellers = await prisma.user.findMany({
      where: { isVerifiedSeller: true },
      select: { id: true, username: true, displayName: true, avatarId: true },
      take: 20,
    });

    return NextResponse.json({ sellers });
  } catch (error) {
    console.error('Error in seller GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request.headers.get('Authorization'));
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // sellerInfo is not a field in Prisma schema currently — mark user as verified seller
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerifiedSeller: true },
      select: { id: true, username: true, isVerifiedSeller: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in seller PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
