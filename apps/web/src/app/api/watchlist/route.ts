import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userid;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userid = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { data: watchlistItems, error } = await supabase
      .from('WatchlistItem')
      .select('*, card:Card(*)')
      .eq('userid', userid)
      .order('addedAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(watchlistItems || []);
  } catch (err) {
    console.error('Watchlist GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userid;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userid = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { cardid } = body;
    
    if (!cardid) {
      return NextResponse.json({ error: 'cardid required' }, { status: 400 });
    }
    
    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('WatchlistItem')
      .select('id')
      .eq('userid', userid)
      .eq('cardid', cardid)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'Already in watchlist' }, { status: 400 });
    }
    
    const { data: item, error } = await supabase
      .from('WatchlistItem')
      .insert({
        userid,
        cardid
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }
    
    return NextResponse.json(item);
  } catch (err) {
    console.error('Watchlist POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userid;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userid = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const cardid = searchParams.get('cardid');
    
    if (!cardid) {
      return NextResponse.json({ error: 'cardid required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('WatchlistItem')
      .delete()
      .eq('userid', userid)
      .eq('cardid', cardid);
    
    if (error) {
      console.error('Error removing from watchlist:', error);
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Watchlist DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}