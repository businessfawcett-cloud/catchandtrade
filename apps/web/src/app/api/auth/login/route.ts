import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';
import { generateToken, generateRefreshToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, username, password')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await generateToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id, user.email);

    return NextResponse.json({
      token,
      refreshToken,
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
