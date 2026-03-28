import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || 'a3751a33-9ed6-4662-9ae3-870939002fcc';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const setCode = searchParams.get('setCode');
    const sources = searchParams.get('sources')?.split(',') || ['tcgplayer', 'pricecharting'];
    
    const supabase = getSupabase();
    const prices: any = {};
    
    if (cardId) {
      const { data: cardPrices } = await supabase
        .from('CardPrice')
        .select('*')
        .eq('cardid', cardId)
        .order('date', { ascending: false })
        .limit(90);
      
      if (cardPrices?.length) {
        prices.database = cardPrices.map((p: any) => ({
          low: p.pricelow,
          mid: p.pricemid,
          high: p.pricehigh,
          market: p.pricemarket,
          date: p.date,
          source: p.source
        }));
      }
      
      const { data: card } = await supabase
        .from('Card')
        .select('pokemontcgid')
        .eq('id', cardId)
        .single();
      
      if (card?.pokemontcgid) {
        try {
          const response = await fetch(`${POKEMON_TCG_API_URL}/cards/${card.pokemontcgid}`, {
            headers: { 'X-Api-Key': POKEMON_TCG_API_KEY }
          });
          
          if (response.ok) {
            const data = await response.json();
            const tcgData = data.data?.[0];
            
            if (tcgData?.tcgplayer?.prices) {
              prices.tcgplayer = tcgData.tcgplayer.prices;
            }
          }
        } catch (e) {
          console.error('Pokemon TCG API error:', e);
        }
      }
    }
    
    if (setCode) {
      const { data: setCards } = await supabase
        .from('Card')
        .select('id, name, setcode, cardnumber')
        .eq('setcode', setCode.toLowerCase())
        .limit(10);
      
      if (setCards?.length) {
        const cardIds = setCards.map((c: any) => c.id);
        
        const { data: avgPrices } = await supabase
          .from('CardPrice')
          .select('cardid, pricemarket')
          .in('cardid', cardIds)
          .order('date', { ascending: false });
        
        const cardPriceMap = new Map();
        for (const p of avgPrices || []) {
          if (!cardPriceMap.has(p.cardid)) {
            cardPriceMap.set(p.cardid, p.pricemarket);
          }
        }
        
        prices.setAverages = setCards.map((c: any) => ({
          ...c,
          price: cardPriceMap.get(c.id) || null
        }));
      }
    }
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in pricing GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { cardId, price } = body;
    
    if (!cardId || !price) {
      return NextResponse.json({ error: 'cardId and price required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('CardPrice')
      .insert({
        cardid: cardId,
        pricelow: price.low,
        pricemid: price.mid,
        pricehigh: price.high,
        pricemarket: price.market,
        date: new Date().toISOString(),
        source: 'manual'
      });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in pricing POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
