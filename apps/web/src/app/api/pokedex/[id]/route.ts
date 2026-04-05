import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const supabase = getSupabase();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    const { data: card, error } = await supabase
      .from('Card')
      .select('id, name, setname, setcode, cardnumber, rarity, imageurl, hp, types, weakness, retreat, attacks')
      .eq('id', id)
      .single();
      
    if (error || !card) {
      return NextResponse.json({ error: 'Pokemon not found' }, { status: 404 });
    }
    
    return NextResponse.json({ pokemon: card });
  } catch (err) {
    console.error('Error fetching pokemon:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}