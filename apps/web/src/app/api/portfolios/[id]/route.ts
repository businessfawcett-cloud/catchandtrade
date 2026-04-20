import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';
import { getUserIdFromToken } from '@/lib/auth';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id } = params;
    
    const { data: portfolio, error } = await supabase
      .from('Portfolio')
      .select('*')
      .eq('id', id)
      .eq('userid', userId)
      .single();
    
    if (error || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    // Get portfolio cards
    const { data: cards } = await supabase
      .from('PortfolioCard')
      .select('*')
      .eq('portfolioid', id);
    
    return NextResponse.json({ portfolio, cards: cards || [] });
  } catch (err) {
    console.error('Portfolio GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    const { name, description, isDefault } = body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('Portfolio')
        .update({ isdefault: false })
        .eq('userid', userId)
        .neq('id', id);
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isDefault !== undefined) updateData.ispublic = isDefault;
    
    const { data: portfolio, error } = await supabase
      .from('Portfolio')
      .update(updateData)
      .eq('id', id)
      .eq('userid', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating portfolio:', error);
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
    }
    
    return NextResponse.json({ portfolio });
  } catch (err) {
    console.error('Portfolio PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Delete portfolio cards first
    await supabase
      .from('PortfolioCard')
      .delete()
      .eq('portfolioId', id);
    
    // Delete portfolio
    const { error } = await supabase
      .from('Portfolio')
      .delete()
      .eq('id', id)
      .eq('userid', userId);
    
    if (error) {
      console.error('Error deleting portfolio:', error);
      return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}