import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status') || 'ACTIVE';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const setCode = searchParams.get('setCode');
    
    const supabase = getSupabase();
    
    let query = supabase
      .from('Listing')
      .select(`
        *,
        card:Card(id, name, setname, setcode, cardnumber, rarity, imageurl),
        seller:User(id, username, displayname)
      `)
      .eq('status', status)
      .order('createdat', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (sellerId) {
      query = query.eq('sellerid', sellerId);
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Listings error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const { count } = await supabase
      .from('Listing')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    
    return NextResponse.json({
      listings: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error in listings GET:', error);
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
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { cardId, price, condition, isGraded, grade, gradingCompany, quantity = 1, description } = body;
    
    if (!cardId || !price) {
      return NextResponse.json({ error: 'cardId and price required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('Listing')
      .insert({
        sellerid: userId,
        cardid: cardId,
        price: parseFloat(price),
        condition: condition || 'NEAR_MINT',
        isgraded: isGraded || false,
        grade: grade,
        gradingcompany: gradingCompany,
        quantity: quantity,
        description: description,
        status: 'ACTIVE',
        createdat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in listings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
