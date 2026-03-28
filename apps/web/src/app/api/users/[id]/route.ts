import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = getSupabase();
    
    // Try to find user by username (case insensitive)
    const { data: user, error } = await supabase
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
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Users can only update their own profile
    if (id !== userId) {
      return NextResponse.json({ error: 'Can only update your own profile' }, { status: 403 });
    }
    
    const supabase = getSupabase();
    
    const updateData: any = {};
    if (body.displayName !== undefined) updateData.displayname = body.displayName;
    if (body.avatarId !== undefined) updateData.avatarid = body.avatarId;
    if (body.isPublic !== undefined) updateData.ispublic = body.isPublic;
    if (body.hideCollectionValue !== undefined) updateData.hidecollectionvalue = body.hideCollectionValue;
    if (body.twitterHandle !== undefined) updateData.twitterhandle = body.twitterHandle;
    if (body.instagramHandle !== undefined) updateData.instagramhandle = body.instagramHandle;
    if (body.tiktokHandle !== undefined) updateData.tiktokhandle = body.tiktokHandle;
    
    const { data, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      id: data.id,
      username: data.username,
      displayName: data.displayname,
      avatarId: data.avatarid,
      isPublic: data.ispublic,
      hideCollectionValue: data.hidecollectionvalue
    });
  } catch (error) {
    console.error('Error in users/:id PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Users can only delete their own account
    if (id !== userId) {
      return NextResponse.json({ error: 'Can only delete your own account' }, { status: 403 });
    }
    
    const supabase = getSupabase();
    
    // Soft delete by setting deleted flag or anonymizing
    const { error } = await supabase
      .from('User')
      .update({ 
        email: `deleted_${userId}@deleted.com`,
        username: 'deleted',
        displayname: 'Deleted User',
        deletedat: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Error in users/:id DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
