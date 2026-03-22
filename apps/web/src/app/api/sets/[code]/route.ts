import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;

  const { data: set, error } = await supabase
    .from('PokemonSet')
    .select('id, name, code, releaseyear, imageurl, totalcards')
    .eq('code', code)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  const { data: cards } = await supabase
    .from('Card')
    .select('id, name, setcode, setname, cardnumber, rarity, imageurl, gametype')
    .eq('setcode', code)
    .order('cardnumber', { ascending: true });

  const mappedSet = {
    ...set,
    imageUrl: set.imageurl,
    releaseYear: set.releaseyear,
    totalCards: set.totalcards
  };

  const mappedCards = (cards || []).map((card: any) => ({
    ...card,
    imageUrl: card.imageurl,
    setCode: card.setcode,
    setName: card.setname,
    cardNumber: card.cardnumber,
    gameType: card.gametype
  }));

  return NextResponse.json({ set: mappedSet, cards: mappedCards });
}