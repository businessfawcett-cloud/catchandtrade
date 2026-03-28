import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.split(':')[0];
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userid = getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { data: portfolios } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('userid', userid);
    
    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json({ pokemon: [], overview: { totalOwned: 0, uniquePokemon: 0, byType: {} } });
    }
    
    const portfolioids = portfolios.map(p => p.id);
    
    const { data: items } = await supabase
      .from('PortfolioCard')
      .select('*, card:Card(*)')
      .in('portfolioid', portfolioids);
    
    if (!items || items.length === 0) {
      return NextResponse.json({ pokemon: [], overview: { totalOwned: 0, uniquePokemon: 0, byType: {} } });
    }
    
    const pokemonMap = new Map();
    
    for (const item of items) {
      if (!item.card) continue;
      
      const cardName = item.card.name;
      const pokemonName = cardName
        .replace(/\s+(EX|VMAX|V|EX-?V|GX|V-?EX|PRISM|δ|⭐|★|☆|LV\.?X?|LV\.\d|SP|RMS|RMS-?\d|CR|SSR|UR|HR|PR|SM|RC|BR|AR)\s*$/gi, '')
        .trim();
      
      if (!pokemonMap.has(pokemonName)) {
        pokemonMap.set(pokemonName, {
          name: pokemonName,
          cards: [],
          totalOwned: 0,
          sets: new Set()
        });
      }
      
      const entry = pokemonMap.get(pokemonName);
      entry.cards.push({
        id: item.card.id,
        name: item.card.name,
        setName: item.card.setname,
        setCode: item.card.setcode,
        imageUrl: item.card.imageurl,
        quantity: item.quantity || 1
      });
      entry.totalOwned += item.quantity || 1;
      if (item.card.setname) {
        entry.sets.add(item.card.setname);
      }
    }
    
    const pokemon = Array.from(pokemonMap.values()).map(p => ({
      ...p,
      sets: Array.from(p.sets)
    }));
    
    const uniquePokemon = pokemon.length;
    const totalOwned = pokemon.reduce((sum, p) => sum + p.totalOwned, 0);
    
    return NextResponse.json({
      pokemon,
      overview: {
        totalOwned,
        uniquePokemon,
        totalCards: items.length,
        byType: {}
      }
    });
  } catch (err) {
    console.error('Pokédex overview error:', err);
    return NextResponse.json({ pokemon: [], overview: { totalOwned: 0, uniquePokemon: 0, byType: {} } }, { status: 500 });
  }
}