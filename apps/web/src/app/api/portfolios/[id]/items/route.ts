import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';
import { verifyToken } from '@/lib/auth';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

async function getUserIdFromToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  if (payload?.userId) {
    return payload.userId;
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userid = await getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id: portfolioid } = params;
    
    // Verify portfolio belongs to user
    const { data: portfolio } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('id', portfolioid)
      .eq('userid', userid)
      .single();
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    // Get portfolio items with card details
    const { data: items, error } = await supabase
      .from('PortfolioCard')
      .select('*, card:Card(*)')
      .eq('portfolioid', portfolioid)
      .order('addedAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching portfolio items:', error);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(items || []);
  } catch (err) {
    console.error('Portfolio items GET error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userid = await getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id: portfolioid } = params;
    const body = await request.json();
    const { cardId, quantity, condition, isGraded, gradeCompany, gradeValue, purchasePrice, notes, gradingService } = body;
    
    // Support both gradeCompany (from body) and gradingService (from marketplace page)
    const companyValue = gradeCompany || gradingService || null;
    
    if (!cardId) {
      return NextResponse.json({ error: 'cardId required' }, { status: 400 });
    }
    
    // Verify portfolio belongs to user
    const { data: portfolio } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('id', portfolioid)
      .eq('userid', userid)
      .single();
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    // Use REST API for insert since Supabase client has issues
    const itemId = 'pc-' + Buffer.from(portfolioid + cardId + Date.now().toString()).toString('base64').substring(0, 20);
    
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/PortfolioCard`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: itemId,
        portfolioId: portfolioid,
        cardId: cardId,
        quantity: quantity || 1,
        condition: condition || 'NEAR_MINT',
        isGraded: isGraded || false,
        gradeCompany: companyValue,
        gradeValue: gradeValue || null,
        purchasePrice: purchasePrice || null,
        notes: notes || null
      })
    });
    
    if (!insertResponse.ok) {
      const errText = await insertResponse.text();
      console.error('Error adding to portfolio:', errText);
      return NextResponse.json({ error: 'Failed to add card to portfolio' }, { status: 500 });
    }
    
    const items = await insertResponse.json();
    const item = Array.isArray(items) ? items[0] : items;
    
    // Fetch card details
    const { data: card } = await supabase
      .from('Card')
      .select('*')
      .eq('id', cardId)
      .single();
    
    return NextResponse.json({ ...item, card });
  } catch (err) {
    console.error('Portfolio items POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userid = await getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id: portfolioid, itemId } = params;
    const body = await request.json();
    
    // Verify portfolio belongs to user
    const { data: portfolio } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('id', portfolioid)
      .eq('userid', userid)
      .single();
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    const updateData: any = {};
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.isGraded !== undefined) updateData.isGraded = body.isGraded;
    if (body.gradeCompany !== undefined) updateData.gradeCompany = body.gradeCompany;
    if (body.gradeValue !== undefined) updateData.gradeValue = body.gradeValue;
    if (body.purchasePrice !== undefined) updateData.purchasePrice = body.purchasePrice;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    const { data: item, error } = await supabase
      .from('PortfolioCard')
      .update(updateData)
      .eq('id', itemId)
      .eq('portfolioid', portfolioid)
      .select('*, card:Card(*)')
      .single();
    
    if (error) {
      console.error('Error updating portfolio item:', error);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
    
    return NextResponse.json(item);
  } catch (err) {
    console.error('Portfolio items PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const userid = await getUserIdFromToken(token);
    if (!userid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { id: portfolioid, itemId } = params;
    
    // Verify portfolio belongs to user
    const { data: portfolio } = await supabase
      .from('Portfolio')
      .select('id')
      .eq('id', portfolioid)
      .eq('userid', userid)
      .single();
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    const { error } = await supabase
      .from('PortfolioCard')
      .delete()
      .eq('id', itemId)
      .eq('portfolioid', portfolioid);
    
    if (error) {
      console.error('Error deleting portfolio item:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio items DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}