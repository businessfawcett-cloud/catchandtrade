import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const { data, error } = await supabase
      .from('PokemonSet')
      .select('id, name, code, releaseyear, imageurl, totalcards')
      .eq('code', code)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    return NextResponse.json({ set: data });
  } catch (error) {
    console.error('Error in set GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}