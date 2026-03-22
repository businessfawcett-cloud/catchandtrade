import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateMockPrices() {
  const prices = [];
  const basePrice = 30 + Math.random() * 50;
  const now = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = (Math.random() - 0.5) * 0.2;
    const price = basePrice * (1 + variance);
    prices.push({
      priceLow: price * 0.85,
      priceMid: price,
      priceHigh: price * 1.2,
      priceMarket: price,
      date: date.toISOString(),
    });
  }
  return prices;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const { data: card, error } = await supabase
      .from('Card')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const { data: prices } = await supabase
      .from('CardPrice')
      .select('*')
      .eq('cardid', id)
      .order('date', { ascending: false })
      .limit(90);

    const finalPrices = (prices && prices.length > 0) ? prices : generateMockPrices();

    return NextResponse.json({ ...card, prices: finalPrices });
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
