import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';

    const { data: card } = await supabase
      .from('Card')
      .select('id')
      .eq('id', id)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const { data: prices } = await supabase
      .from('CardPrice')
      .select('pricemarket, date')
      .eq('cardid', id)
      .order('date', { ascending: true })
      .limit(90);

    const currentPrice = prices && prices.length > 0 ? prices[prices.length - 1].pricemarket : null;

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startStr = startDate.toISOString().split('T')[0];

    let filteredPrices = (prices || []).filter((p: any) => p.date >= startStr);
    
    if (filteredPrices.length > 0) {
      const data = filteredPrices.map((p: any) => ({
        date: p.date.split('T')[0],
        price: p.pricemarket
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
      const mockData = generateMockPriceHistory(currentPrice, periodDays);
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
