import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';
import { getUserIdFromToken } from '@/lib/auth';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export async function GET(request: NextRequest) {
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
    
    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, username, displayname, avatarid, ispublic, hidecollectionvalue')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayname,
      avatarId: user.avatarid,
      isPublic: user.ispublic,
      hideCollectionValue: user.hidecollectionvalue
    });
  } catch (err) {
    console.error('Error in /api/users/me:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}