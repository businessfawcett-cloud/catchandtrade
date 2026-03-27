import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  let userId;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    userId = decoded.split(':')[0];
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all cards in this set
  const { data: setCards, error: setError } = await supabase
    .from('Card')
    .select('id, name, cardnumber, rarity')
    .eq('setcode', code.toLowerCase())
    .order('cardnumber', { ascending: true });

  if (setError || !setCards) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  // Get user's portfolio cards for this set
  const { data: userCards, error: userError } = await supabase
    .from('PortfolioCard')
    .select('cardId, quantity')
    .eq('userId', userId);

  if (userError) {
    return NextResponse.json({ error: 'Failed to fetch user cards' }, { status: 500 });
  }

  const ownedCardIds = new Set(userCards?.map(uc => uc.cardId) || []);
  const ownedCards = setCards.filter(c => ownedCardIds.has(c.id));
  const missingCards = setCards.filter(c => !ownedCardIds.has(c.id));
  
  const progress = setCards.length > 0 ? (ownedCards.length / setCards.length) * 100 : 0;

  return NextResponse.json({ 
    progress: Math.round(progress * 10) / 10,
    ownedCards: ownedCards.map(c => c.id),
    missingCards: missingCards.map(c => c.id),
    totalCards: setCards.length,
    ownedCount: ownedCards.length
  });
}