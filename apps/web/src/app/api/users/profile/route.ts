import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseUrl, getSupabaseKey } from '@/lib/api';

const supabase = getSupabase();
const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, avatarId, isPublic, hideCollectionValue, country, twitterHandle, instagramHandle, tiktokHandle } = body;
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Decode token to get user ID (token is base64 of id:email)
    let userId;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0];
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // If username is being changed, check it's available
    if (username) {
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', userId)
        .single();
      
      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }
    
    // Update user profile
    const updateData: any = {};
    if (username) updateData.username = username.toLowerCase();
    if (displayName !== undefined) updateData.displayname = displayName;
    if (avatarId !== undefined) updateData.avatarid = avatarId;
    if (isPublic !== undefined) updateData.ispublic = isPublic;
    if (hideCollectionValue !== undefined) updateData.hidecollectionvalue = hideCollectionValue;
    if (country !== undefined) updateData.country = country;
    if (twitterHandle !== undefined) updateData.twitterhandle = twitterHandle;
    if (instagramHandle !== undefined) updateData.instagramhandle = instagramHandle;
    if (tiktokHandle !== undefined) updateData.tiktokhandle = tiktokHandle;
    
    const { data: user, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, username, displayname, avatarid')
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayname,
      avatarId: user.avatarid
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}