import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || 'a3751a33-9ed6-4662-9ae3-870939002fcc';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockPriceHistory(cardId: string, currentPrice: number | null, days: number) {
  const data = [];
  const basePrice = currentPrice || 50;
  const now = new Date();
  
  // Generate consistent seed from cardId
  const seed = cardId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Determine a trend direction based on seed (consistent per card)
  const trendDirection = seed % 2 === 0 ? 1 : -1;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Use seeded random for consistent data
    const rand = seededRandom(seed + i);
    const variance = (rand - 0.5) * 0.1;
    const trend = (trendDirection * (days - i) / days * 0.05);
    const price = Math.max(1, basePrice * (1 + variance + trend));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    });
  }

  return data;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';

    const { data: card } = await supabase
      .from('Card')
      .select('id, pokemontcgid, name, setcode')
      .eq('id', id)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    let currentPrice: number | null = null;
    let prices: any[] = [];

    // Try to get prices from database first
    const { data: dbPrices } = await supabase
      .from('CardPrice')
      .select('pricemarket, pricelow, pricemid, pricehigh, date')
      .eq('cardid', id)
      .order('date', { ascending: true })
      .limit(90);

    if (dbPrices && dbPrices.length > 0) {
      prices = dbPrices;
      currentPrice = prices[prices.length - 1].pricemarket;
    } else if (card.pokemontcgid) {
      // Fetch from Pokemon TCG API
      try {
        const response = await fetch(`${POKEMON_TCG_API_URL}/cards/${card.pokemontcgid}`, {
          headers: { 'X-Api-Key': POKEMON_TCG_API_KEY }
        });
        
        if (response.ok) {
          const tcgData = await response.json();
          const cardData = tcgData.data?.[0];
          
          if (cardData?.tcgplayer?.prices) {
            const tcgPrices = cardData.tcgplayer.prices;
            
            // Get normal/holographic prices
            const normalPrice = tcgPrices.normal?.[0] || tcgPrices.holofoil?.[0] || {};
            currentPrice = normalPrice.market || normalPrice.median || null;
            
            // Create mock historical data with real current price
            if (currentPrice) {
              prices = generateMockPriceHistory(id, currentPrice, parseInt(period));
            }
          }
        }
      } catch (e) {
        console.error('Pokemon TCG API error:', e);
      }
    }

    // If still no prices, generate consistent mock data
    if (prices.length === 0) {
      prices = generateMockPriceHistory(id, currentPrice, parseInt(period));
      currentPrice = prices[prices.length - 1]?.price || 50;
    }

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startStr = startDate.toISOString().split('T')[0];

    const filteredPrices = prices.filter((p: any) => p.date >= startStr);
    
    if (filteredPrices.length > 0) {
      const data = filteredPrices.map((p: any) => ({
        date: p.date,
        price: p.price || p.pricemarket
      }));

      const latest = data[data.length - 1];
      const oldest = data[0];
      const change = oldest?.price ? ((latest.price - oldest.price) / oldest.price) * 100 : 0;

      return NextResponse.json({
        data,
        currentPrice: latest.price,
        change: change.toFixed(2),
        hasRealData: !!card.pokemontcgid
      });
    } else {
      const mockData = generateMockPriceHistory(id, currentPrice, periodDays);
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
