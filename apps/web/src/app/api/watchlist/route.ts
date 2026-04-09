import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUrl, getSupabaseKey } from '@/lib/api';

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
    
    // Use REST API
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    
    const res = await fetch(`${supabaseUrl}/rest/v1/WatchlistItem?userid=eq.${userid}&order=addedAt.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      }
    });
    
    const watchlistItems = await res.json();
    
    if (!watchlistItems || watchlistItems.length === 0) {
      return NextResponse.json([]);
    }
    
    // Fetch card details for each item
    const cardIds = watchlistItems.map((item: any) => item.cardid);
    const cardsRes = await fetch(`${supabaseUrl}/rest/v1/Card?id=in.(${cardIds.join(',')})`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      }
    });
    const cards = await cardsRes.json();
    
    const cardsMap = new Map(cards.map((c: any) => [c.id, c]));
    
    const itemsWithCards = watchlistItems.map((item: any) => ({
      ...item,
      card: cardsMap.get(item.cardid) || null
    }));
    
    return NextResponse.json(itemsWithCards);
  } catch (err) {
    console.error('Watchlist GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Watchlist POST called');
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userid;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userid = decoded.split(':')[0];
      console.log('User ID:', userid);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('Request body:', body);
    const { cardId, cardid } = body;
    const finalCardId = cardId || cardid;
    
     if (!finalCardId) {
       return NextResponse.json({ error: 'cardid required' }, { status: 400 });
     }
     
     // Use REST API directly
     const supabaseUrl = getSupabaseUrl();
     const supabaseKey = getSupabaseKey();
     console.log('Using Supabase:', supabaseUrl);
     
     // Check if already exists
     const checkRes = await fetch(`${supabaseUrl}/rest/v1/WatchlistItem?userid=eq.${userid}&cardid=eq.${finalCardId}`, {
       headers: {
         'apikey': supabaseKey,
         'Authorization': `Bearer ${supabaseKey}`
       }
     });
     const existing = await checkRes.json();
     console.log('Existing check:', existing);
     
     if (existing && existing.length > 0) {
       return NextResponse.json({ error: 'Already in watchlist' }, { status: 400 });
     }
     
     // Insert
     const watchlistId = 'wi-' + Buffer.from(userid + finalCardId + Date.now().toString()).toString('base64').substring(0, 20);
     const insertRes = await fetch(`${supabaseUrl}/rest/v1/WatchlistItem`, {
       method: 'POST',
       headers: {
         'apikey': supabaseKey,
         'Authorization': `Bearer ${supabaseKey}`,
         'Content-Type': 'application/json',
         'Prefer': 'return=representation'
       },
       body: JSON.stringify({
         id: watchlistId,
         userid: userid,
         cardid: finalCardId
       })
     });
     
     if (!insertRes.ok) {
       const errText = await insertRes.text();
       console.error('Insert error:', errText);
       return NextResponse.json({ error: 'Failed to add to watchlist: ' + errText }, { status: 500 });
     }
     
     const item = await insertRes.json();
     return NextResponse.json(Array.isArray(item) ? item[0] : item);
  } catch (err) {
    console.error('Watchlist POST error:', err);
    return NextResponse.json({ error: 'Server error: ' + String(err) }, { status: 500 });
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
     const cardidParam = searchParams.get('cardid') || searchParams.get('cardId');
     
     if (!cardidParam) {
       return NextResponse.json({ error: 'cardid required' }, { status: 400 });
     }
     
     // Use REST API
     const supabaseUrl = getSupabaseUrl();
     const supabaseKey = getSupabaseKey();
     
     const deleteRes = await fetch(`${supabaseUrl}/rest/v1/WatchlistItem?userid=eq.${userid}&cardid=eq.${cardidParam}`, {
       method: 'DELETE',
       headers: {
         'apikey': supabaseKey,
         'Authorization': `Bearer ${supabaseKey}`
       }
     });
     
     if (!deleteRes.ok) {
       const errText = await deleteRes.text();
       console.error('Delete error:', errText);
       return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
     }
     
     return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Watchlist DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}