import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const client = await supabase();
    
    // Try to find user by username (case insensitive)
    const { data: user, error } = await client
      .from('User')
      .select('id, username, displayname, avatarid, ispublic, hidecollectionvalue, twitterhandle, instagramhandle, tiktokhandle')
      .eq('username', id.toLowerCase())
      .single();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayname,
      avatarId: user.avatarid,
      isPublic: user.ispublic,
      hideCollectionValue: user.hidecollectionvalue,
      twitterHandle: user.twitterhandle,
      instagramHandle: user.instagramhandle,
      tiktokHandle: user.tiktokhandle
    });
  } catch (error) {
    console.error('Error in users/:id GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    // TODO: Implement PUT handler for users/:id
    return NextResponse.json({ message: 'users/:id PUT endpoint', id, body });
  } catch (error) {
    console.error('Error in users/:id PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // TODO: Implement DELETE handler for users/:id
    return NextResponse.json({ message: 'users/:id DELETE endpoint', id });
  } catch (error) {
    console.error('Error in users/:id DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
