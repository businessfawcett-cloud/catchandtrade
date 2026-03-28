import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const grade = searchParams.get('grade');
    const company = searchParams.get('company');
    
    const supabase = getSupabase();
    
    let query = supabase
      .from('GradedSlab')
      .select(`
        *,
        card:Card(id, name, setname, setcode, cardnumber, rarity, imageurl)
      `);
    
    if (userId) {
      query = query.eq('userid', userId);
    }
    
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    
    if (company) {
      query = query.eq('gradingcompany', company.toUpperCase());
    }
    
    const { data, error } = await query.order('createdat', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in slabs GET:', error);
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
    const { cardId, grade, gradingCompany, certificationNumber, imageUrl } = body;
    
    if (!cardId || !grade || !gradingCompany) {
      return NextResponse.json({ error: 'cardId, grade, and gradingCompany required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('GradedSlab')
      .insert({
        userid: userId,
        cardid: cardId,
        grade: parseInt(grade),
        gradingcompany: gradingCompany.toUpperCase(),
        certificationnumber: certificationNumber,
        imageurl: imageUrl,
        createdat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in slabs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const slabId = searchParams.get('id');
    
    if (!slabId) {
      return NextResponse.json({ error: 'slab id required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data: existing } = await supabase
      .from('GradedSlab')
      .select('userid')
      .eq('id', slabId)
      .single();
    
    if (!existing || existing.userid !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('GradedSlab')
      .delete()
      .eq('id', slabId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in slabs DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
