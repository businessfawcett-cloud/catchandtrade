import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@catchandtrade/db';

// GET /api/cards/:id/price-history - Get price history for a card
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const currentPrice = card.prices[0]?.priceMarket || null;

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    let priceHistory: any[] = [];
    try {
      priceHistory = await prisma.priceHistory.findMany({
        where: { 
          cardId: id,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      });
    } catch (e) {
      priceHistory = [];
    }

    if (priceHistory.length > 0) {
      const data = priceHistory.map(ph => ({
        date: ph.date.toISOString().split('T')[0],
        price: ph.price
      }));

      const latest = data[data.length - 1];
      const oldest = data[0];
      const change = oldest ? ((latest.price - oldest.price) / oldest.price) * 100 : 0;

      return NextResponse.json({
        data,
        currentPrice: latest.price,
        change: change.toFixed(2),
        hasRealData: true
      });
    } else {
      const mockData = generateMockPriceHistory(currentPrice, parseInt(period));
      const latest = mockData[mockData.length - 1];
      const oldest = mockData[0];
      const change = oldest ? ((latest.price - oldest.price) / oldest.price) * 100 : 0;

      return NextResponse.json({
        data: mockData,
        currentPrice: latest.price,
        change: change.toFixed(2),
        hasRealData: false
      });
    }
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMockPriceHistory(currentPrice: number | null, days: number) {
  const data = [];
  const basePrice = currentPrice || 50;
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const variance = (Math.random() - 0.5) * 0.3;
    const trend = (days - i) / days * 0.05;
    const price = Math.max(1, basePrice * (1 + variance + trend));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    });
  }

  return data;
}