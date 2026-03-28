import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'ACG'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    let query = supabase.from('GradingSubmission').select('*').eq('userid', userId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('submittedat', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in grading GET:', error);
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
    const { cardId, gradingCompany, serviceLevel, cardCondition } = body;
    
    if (!cardId || !gradingCompany) {
      return NextResponse.json({ error: 'cardId and gradingCompany required' }, { status: 400 });
    }
    
    if (!GRADING_COMPANIES.includes(gradingCompany.toUpperCase())) {
      return NextResponse.json({ error: `Invalid grading company. Must be one of: ${GRADING_COMPANIES.join(', ')}` }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('GradingSubmission')
      .insert({
        userid: userId,
        cardid: cardId,
        gradingcompany: gradingCompany.toUpperCase(),
        servicelevel: serviceLevel || 'STANDARD',
        cardcondition: cardCondition || 'NEAR_MINT',
        status: 'SUBMITTED',
        submittedat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in grading POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
