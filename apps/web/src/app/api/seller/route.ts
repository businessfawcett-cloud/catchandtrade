import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    
    const supabase = getSupabase();
    
    if (sellerId) {
      const { data: seller, error } = await supabase
        .from('User')
        .select('id, username, displayname, avatarid, sellerinfo')
        .eq('id', sellerId)
        .single();
      
      if (error || !seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }
      
      const { data: listings } = await supabase
        .from('Listing')
        .select('*')
        .eq('sellerid', sellerId)
        .eq('status', 'ACTIVE');
      
      const { data: reviews } = await supabase
        .from('SellerReview')
        .select('*')
        .eq('sellerid', sellerId)
        .order('createdat', { ascending: false })
        .limit(20);
      
      return NextResponse.json({
        seller,
        listings: listings || [],
        reviews: reviews || [],
        rating: reviews?.length ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length : null
      });
    }
    
    const { data: topSellers } = await supabase
      .from('User')
      .select('id, username, displayname, avatarid')
      .not('sellerinfo', 'is', null)
      .limit(20);
    
    return NextResponse.json({ sellers: topSellers || [] });
  } catch (error) {
    console.error('Error in seller GET:', error);
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
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('User')
      .update({ sellerinfo: body })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in seller PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
