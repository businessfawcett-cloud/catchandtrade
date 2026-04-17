import { NextResponse } from 'next/server';
import { getSupabaseUrl, getSupabaseKey } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    
    const res = await fetch(`${supabaseUrl}/rest/v1/PokemonSet?select=id,name,code&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Query failed', status: res.status }, { status: 500 });
    }
    
    const data = await res.json();
    return NextResponse.json({ 
      status: 'ok',
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      sampleData: data
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}