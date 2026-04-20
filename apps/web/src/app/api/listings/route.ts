import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sellerId = searchParams.get('sellerId');
    const status = (searchParams.get('status') || 'ACTIVE') as any;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const where: any = { status };
    if (sellerId) where.sellerId = sellerId;
    if (minPrice) where.buyNowPrice = { ...where.buyNowPrice, gte: parseFloat(minPrice) };
    if (maxPrice) where.buyNowPrice = { ...where.buyNowPrice, lte: parseFloat(maxPrice) };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          card: { select: { id: true, name: true, setName: true, setCode: true, cardNumber: true, rarity: true, imageUrl: true } },
          seller: { select: { id: true, username: true, displayName: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error in listings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userId: string;
    try {
      userId = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString().split(':')[0];
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, price, condition, isGraded, gradeCompany, gradeValue, quantity = 1, description, title } = body;

    if (!cardId || !price) return NextResponse.json({ error: 'cardId and price required' }, { status: 400 });

    // Get card name for default title
    const card = await prisma.card.findUnique({ where: { id: cardId }, select: { name: true } });

    const listing = await prisma.listing.create({
      data: {
        sellerId: userId,
        cardId,
        title: title || card?.name || 'Card Listing',
        description: description || null,
        buyNowPrice: parseFloat(price),
        condition: condition || 'NEAR_MINT',
        isGraded: isGraded || false,
        gradeCompany: gradeCompany || null,
        gradeValue: gradeValue || null,
        status: 'ACTIVE',
        imageUrls: [],
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error in listings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
