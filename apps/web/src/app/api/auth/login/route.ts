import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, username, password')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}