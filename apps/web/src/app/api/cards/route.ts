import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const page = parseInt(searchParams.get('page') || '1');
    const setCode = searchParams.get('setCode');
    const sort = searchParams.get('sort') || 'newest';
    const searchQuery = searchParams.get('q') || '';
    const gameType = searchParams.get('gameType');

    let query = supabase
      .from('Card')
      .select('id, name, setname, setcode, cardnumber, gametype, rarity, imageurl, createdat', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1);

    if (setCode) {
        query = query.eq('setcode', setCode);
    }

    if (gameType) {
      query = query.eq('gametype', gameType);
    }

    if (searchQuery && searchQuery.trim().length >= 2) {
      const q = searchQuery.trim();
      const isCardNumberSearch = q.includes('/') || /^\d+$/.test(q);
      
      if (isCardNumberSearch) {
        const normalized = q.replace(/^0+/, '');
        query = query.or(`name.ilike.%${q}%,setname.ilike.%${q}%,setcode.ilike.%${q}%,cardnumber.ilike.%${normalized}%`);
      } else {
        query = query.or(`name.ilike.%${q}%,setname.ilike.%${q}%,setcode.ilike.%${q}%,cardnumber.ilike.%${q}%`);
      }
    }

    switch (sort) {
      case 'oldest':
        query = query.order('createdat', { ascending: true });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'price-desc':
      case 'price-asc':
        query = query.order('createdat', { ascending: false });
        break;
      default:
        query = query.order('createdat', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let cardIds = (data || []).map((c: any) => c.id);
    let priceMap: Record<string, number> = {};

    // FIXED: Use limit to get only latest price per card - O(n) instead of O(n*90)
    if (cardIds.length > 0) {
      const { data: prices } = await supabase
        .from('CardPrice')
        .select('cardid, pricemarket')
        .in('cardid', cardIds)
        .order('date', { ascending: false })
        .limit(cardIds.length); // Only fetch latest price per card!

      // Build price map - no filtering needed since we limited above
      for (const p of (prices || [])) {
        if (p.cardid && p.pricemarket) {
          priceMap[p.cardid] = p.pricemarket;
        }
      }
    }

    let results = (data || []).map((card: any) => ({
      id: card.id,
      name: card.name,
      setName: card.setname,
      setCode: card.setcode,
      cardNumber: card.cardnumber,
      gameType: card.gametype,
      rarity: card.rarity,
      imageUrl: card.imageurl,
      currentPrice: priceMap[card.id] ?? null
    }));

    if (sort === 'price-desc' || sort === 'price-asc') {
      results = results.sort((a, b) => {
        const aPrice = a.currentPrice ?? -1;
        const bPrice = b.currentPrice ?? -1;
        return sort === 'price-desc' ? bPrice - aPrice : aPrice - bPrice;
      });
    }

    return NextResponse.json({ cards: results, total: count || 0 });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
