import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('u');
    
    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, error: 'Username too short' });
    }
    
    // Check if username exists in database
    const { data: user, error } = await supabase
      .from('User')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which means username is available)
      console.error('Error checking username:', error);
      return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
    }
    
    // If user exists, username is taken
    const available = !user;
    
    return NextResponse.json({ available });
  } catch (err) {
    console.error('Check username error:', err);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}