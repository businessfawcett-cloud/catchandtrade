import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

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
      userId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status');
    
    const supabase = getSupabase();
    
    let query = supabase
      .from('Order')
      .select(`
        *,
        items:OrderItem(*, card:Card(id, name, setname, setcode, cardnumber, imageurl)),
        buyer:User(id, username, displayname),
        seller:User(id, username, displayname)
      `);
    
    if (role === 'buyer') {
      query = query.eq('buyerid', userId);
    } else {
      query = query.eq('sellerid', userId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('createdat', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in orders GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let buyerId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      buyerId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { listingId, quantity = 1, shippingAddress } = body;
    
    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data: listing } = await supabase
      .from('Listing')
      .select('*, card:Card(*)')
      .eq('id', listingId)
      .single();
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing is not available' }, { status: 400 });
    }
    
    const totalAmount = listing.price * quantity;
    
    const { data: order, error } = await supabase
      .from('Order')
      .insert({
        buyerid: buyerId,
        sellerid: listing.sellerid,
        listingid: listingId,
        status: 'PENDING',
        totalamount: totalAmount,
        quantity,
        shippingaddress: shippingAddress,
        createdat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    await supabase
      .from('Listing')
      .update({ status: 'PENDING' })
      .eq('id', listingId);
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in orders POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { orderId, status, trackingNumber } = body;
    
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data: order } = await supabase
      .from('Order')
      .select('buyerid, sellerid')
      .eq('id', orderId)
      .single();
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (order.buyerid !== userId && order.sellerid !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingnumber = trackingNumber;
    updateData.updatedat = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('Order')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in orders PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
