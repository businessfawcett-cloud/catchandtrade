import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.split(':')[0] || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            card: {
              include: { prices: { orderBy: { date: 'desc' }, take: 1 } },
            },
          },
        },
      },
    });

    return NextResponse.json(portfolios);
  } catch (err) {
    console.error('Portfolios GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { name, description } = await request.json();

    const portfolio = await prisma.portfolio.create({
      data: { userId, name: name || 'My Collection' },
    });

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error('Portfolios POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
