import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const page = parseInt(searchParams.get('page') || '1');
    const setCode = searchParams.get('setCode');
    const sort = searchParams.get('sort') || 'newest';
    const searchQuery = searchParams.get('q') || '';

    const where: Record<string, unknown> = {};
    
    if (setCode) {
      where.setCode = setCode;
    }

    if (searchQuery && searchQuery.trim().length >= 2) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { setName: { contains: searchQuery, mode: 'insensitive' } },
        { setCode: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'name':
        orderBy.name = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const cards = await prisma.card.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy,
      select: {
        id: true,
        name: true,
        setName: true,
        setCode: true,
        cardNumber: true,
        gameType: true,
        rarity: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    const results = cards;

    return NextResponse.json({ cards: results, total: results.length });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}