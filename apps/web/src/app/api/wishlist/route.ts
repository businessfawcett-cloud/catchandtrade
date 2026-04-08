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
    
    // Get wishlist items with card details
    const { data: items, error } = await supabase
      .from('WishlistItem')
      .select('*, card:Card(*)')
      .eq('userid', userid)
      .order('addedAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching wishlist items:', error);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(items || []);
  } catch (err) {
    console.error('Wishlist items GET error:', err);
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
    const userid = getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { cardId, targetPrice, notes } = body;
    
    if (!cardId) {
      return NextResponse.json({ error: 'cardId required' }, { status: 400 });
    }
    
    // Check if card exists
    const { data: card } = await supabase
      .from('Card')
      .select('id')
      .eq('id', cardId)
      .single();
      
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    
    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('WishlistItem')
      .select('id')
      .eq('userid', userid)
      .eq('cardid', cardId)
      .single();
      
    if (existing) {
      return NextResponse.json({ error: 'Card already in wishlist' }, { status: 409 });
    }
    
    // Add to wishlist
    const wishlistId = 'wi-' + Buffer.from(userid + cardId + Date.now().toString()).toString('base64').substring(0, 20);
    
    const { data: item, error } = await supabase
      .from('WishlistItem')
      .insert({
        id: wishlistId,
        userid: userid,
        cardid: cardId,
        targetprice: targetPrice || null,
        notes: notes || null,
        addedat: new Date().toISOString()
      })
      .select('*, card:Card(*)')
      .single();
    
    if (error) {
      console.error('Error adding to wishlist:', error);
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
    }
    
    return NextResponse.json(item);
  } catch (err) {
    console.error('Wishlist POST error:', err);
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
    const userid = getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    
    if (!cardId) {
      return NextResponse.json({ error: 'cardId required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('WishlistItem')
      .delete()
      .eq('userid', userid)
      .eq('cardid', cardId);
    
    if (error) {
      console.error('Error deleting wishlist item:', error);
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Wishlist DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}