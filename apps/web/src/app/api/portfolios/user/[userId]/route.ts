import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    
    const { data: portfolios, error } = await createClient(supabaseUrl, supabaseKey)
      .from('Portfolio')
      .select('id, name, ispublic, createdat')
      .eq('userid', userId)
      .eq('ispublic', true)
      .order('createdat', { ascending: false });
    
    if (error) {
      console.error('Error fetching portfolios:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const portfoliosWithItems = await Promise.all((portfolios || []).map(async (portfolio) => {
      const itemsResponse = await fetch(
        `${supabaseUrl}/rest/v1/PortfolioCard?portfolioId=eq.${encodeURIComponent(portfolio.id)}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      let items = itemsResponse.ok ? await itemsResponse.json() : [];
      
      if (items.length > 0) {
        const cardIds = items.map((i: any) => i.cardId);
        const cardsResponse = await fetch(
          `${supabaseUrl}/rest/v1/Card?id=in.(${cardIds.map((id: string) => encodeURIComponent(id)).join(',')})`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        const cards = cardsResponse.ok ? await cardsResponse.json() : [];
        const cardMap = new Map(cards.map((c: any) => [c.id, c]));
        
        items = items.map((item: any) => ({
          ...item,
          card: cardMap.get(item.cardId) ? {
            id: cardMap.get(item.cardId).id,
            name: cardMap.get(item.cardId).name,
            setName: cardMap.get(item.cardId).setname,
            setCode: cardMap.get(item.cardId).setcode,
            cardNumber: cardMap.get(item.cardId).cardnumber,
            rarity: cardMap.get(item.cardId).rarity,
            imageUrl: cardMap.get(item.cardId).imageurl,
            currentPrice: null
          } : null
        }));
      }
      
      return {
        id: portfolio.id,
        name: portfolio.name,
        isPublic: portfolio.ispublic,
        items: items.map((i: any) => ({
          id: i.id,
          quantity: i.quantity,
          condition: i.condition,
          card: i.card
        }))
      };
    }));
    
    return NextResponse.json(portfoliosWithItems);
  } catch (error) {
    console.error('Error fetching user portfolios:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
