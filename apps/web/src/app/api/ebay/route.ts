import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';

const EBAY_API_BASE = process.env.EBAY_BROWSE_API_BASE || 'https://api.ebay.com/buy/browse/v1';
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const cardId = searchParams.get('cardId');
    
    if (!query && !cardId) {
      return NextResponse.json({ error: 'q or cardId required' }, { status: 400 });
    }
    
    let searchQuery = query;
    
    if (cardId && !searchQuery) {
      const supabase = getSupabase();
      const { data: card } = await supabase
        .from('Card')
        .select('name, setname')
        .eq('id', cardId)
        .single();
      
      if (card) {
        searchQuery = `${card.name} ${card.setname} Pokemon card`;
      }
    }
    
    if (!EBAY_APP_ID || EBAY_APP_ID === 'REPLACE_WITH_EBAY_KEY') {
      return NextResponse.json({
        message: 'eBay API not configured',
        suggestion: 'Configure EBAY_APP_ID and EBAY_CERT_ID in environment variables',
        searchQuery
      });
    }
    
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope/buy.marketplace'
    });
    
    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to get eBay token' }, { status: 500 });
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    const searchUrl = `${EBAY_API_BASE}/search?q=${encodeURIComponent(searchQuery)}&limit=20`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      return NextResponse.json({ error: 'eBay search failed', details: errorText }, { status: 500 });
    }
    
    const searchData = await searchResponse.json();
    
    const items = (searchData.itemSummaries || []).map((item: any) => ({
      title: item.title,
      price: item.price?.value,
      currency: item.price?.currency,
      image: item.image?.imageUrl,
      itemId: item.itemId,
      condition: item.condition,
      url: item.itemWebUrl
    }));
    
    return NextResponse.json({ items, searchQuery });
  } catch (error) {
    console.error('Error in ebay GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { listingId, ebayItemId, price } = body;
    
    if (!listingId || !ebayItemId) {
      return NextResponse.json({ error: 'listingId and ebayItemId required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/Listing?id=eq.${encodeURIComponent(listingId)}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    const listings = await response.json();
    const listing = listings[0];
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    await fetch(
      `${supabaseUrl}/rest/v1/Listing?id=eq.${encodeURIComponent(listingId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ebayitemid: ebayItemId,
          price: price,
          listedonebay: true
        })
      }
    );
    
    return NextResponse.json({ success: true, ebayItemId });
  } catch (error) {
    console.error('Error in ebay POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
