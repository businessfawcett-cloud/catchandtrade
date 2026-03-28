import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const search = searchParams.get('search');
    
    const supabase = getSupabase();
    
    let query = supabase
      .from('User')
      .select('id, username, displayname, avatarid, ispublic, createdat', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1);
    
    if (search) {
      query = query.or(`username.ilike.%${search}%,displayname.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query.order('createdat', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      users: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error in users GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, displayName } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    
    if (username) {
      const { data: usernameTaken } = await supabase
        .from('User')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();
      
      if (usernameTaken) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }
    
    const { data, error } = await supabase
      .from('User')
      .insert({
        email: email.toLowerCase(),
        password,
        username: username?.toLowerCase(),
        displayname: displayName || username,
        createdat: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const token = Buffer.from(`${data.id}:${data.email}`).toString('base64');
    
    return NextResponse.json({
      user: { id: data.id, email: data.email, username: data.username, displayName: data.displayname },
      token
    });
  } catch (error) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
