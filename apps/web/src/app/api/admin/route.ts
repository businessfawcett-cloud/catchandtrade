import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';

const ADMIN_EMAILS = ['admin@catchandtrade.com'];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const email = decoded.split(':')[1];
      
      if (!ADMIN_EMAILS.includes(email?.toLowerCase())) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      userId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats') === 'true';
    
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    
    const results: any = {};
    
    if (stats) {
      const [usersRes, cardsRes, listingsRes, ordersRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/User?select=id`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }),
        fetch(`${supabaseUrl}/rest/v1/Card?select=id`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }),
        fetch(`${supabaseUrl}/rest/v1/Listing?select=id`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }),
        fetch(`${supabaseUrl}/rest/v1/Order?select=id`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } })
      ]);
      
      results.stats = {
        users: usersRes.ok ? (await usersRes.json()).length : 0,
        cards: cardsRes.ok ? (await cardsRes.json()).length : 0,
        listings: listingsRes.ok ? (await listingsRes.json()).length : 0,
        orders: ordersRes.ok ? (await ordersRes.json()).length : 0
      };
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in admin GET:', error);
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
    const { action, userId, data } = body;
    
    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseKey();
    
    switch (action) {
      case 'ban-user':
        await fetch(`${supabaseUrl}/rest/v1/User?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ banned: true })
        });
        return NextResponse.json({ success: true });
        
      case 'unban-user':
        await fetch(`${supabaseUrl}/rest/v1/User?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ banned: false })
        });
        return NextResponse.json({ success: true });
        
      case 'delete-listing':
        await fetch(`${supabaseUrl}/rest/v1/Listing?id=eq.${data.listingId}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in admin POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
