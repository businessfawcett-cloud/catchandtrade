import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';
import { getUserIdFromToken } from '@/lib/auth';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Verify user owns this portfolio
    const { data: portfolio } = await supabase
      .from('Portfolio')
      .select('userid')
      .eq('id', id)
      .single();
    
    if (!portfolio || portfolio.userid !== userId) {
      return NextResponse.json({ error: 'Not authorized to view this portfolio' }, { status: 403 });
    }
    
    // Get portfolio cards
    const { data: cards } = await supabase
      .from('PortfolioCard')
      .select('*')
      .eq('portfolioid', id);
    
    // Calculate value
    let totalValue = 0;
    let cardCount = 0;
    
    if (cards && cards.length > 0) {
      for (const pc of cards) {
        const quantity = pc.quantity || 1;
        cardCount += quantity;
        
        // Get card price
        if (pc.cardId) {
          const { data: card } = await supabase
            .from('Card')
            .select('price')
            .eq('id', pc.cardId)
            .single();
          
          if (card?.price) {
            totalValue += card.price * quantity;
          }
        }
      }
    }
    
    return NextResponse.json({
      totalValue,
      cardCount,
      uniqueCards: cards?.length || 0
    });
  } catch (err) {
    console.error('Portfolio value error:', err);
    return NextResponse.json({ totalValue: 0, cardCount: 0, uniqueCards: 0 }, { status: 500 });
  }
}