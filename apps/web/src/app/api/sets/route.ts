import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('PokemonSet')
      .select('id, name, code, releaseyear, imageurl, totalcards')
      .order('releaseyear', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sets: data || [] });
  } catch (error) {
    console.error('Error in sets GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}