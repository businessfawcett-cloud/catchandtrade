import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;

  const { data, error } = await supabase
    .from('PokemonSet')
    .select('id, name, code, releaseyear, imageurl, totalcards')
    .eq('code', code)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  return NextResponse.json({ set: data });
}