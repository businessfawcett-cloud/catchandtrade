import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('Listing')
      .select(`
        *,
        card:Card(id, name, setname, setcode, cardnumber, rarity, imageurl),
        seller:User(id, username, displayname, avatarid)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in listings/:id GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    const body = await request.json();
    const supabase = getSupabase();
    
    const { data: existing } = await supabase
      .from('Listing')
      .select('sellerid')
      .eq('id', id)
      .single();
    
    if (!existing || existing.sellerid !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const updateData: any = {};
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.isGraded !== undefined) updateData.isgraded = body.isGraded;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.gradingCompany !== undefined) updateData.gradingcompany = body.gradingCompany;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    
    updateData.updatedat = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('Listing')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in listings/:id PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    const supabase = getSupabase();
    
    const { data: existing } = await supabase
      .from('Listing')
      .select('sellerid')
      .eq('id', id)
      .single();
    
    if (!existing || existing.sellerid !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('Listing')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in listings/:id DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
