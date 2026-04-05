import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'providers') {
      return NextResponse.json({
        google: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'REPLACE_WITH_GOOGLE_OAUTH_KEY',
        apple: !!process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_ID !== 'REPLACE_WITH_APPLE_KEY',
        email: true
      });
    }
    
    return NextResponse.json({
      message: 'Auth API',
      endpoints: {
        'GET /api/auth?action=providers': 'Get available auth providers',
        'POST /api/auth/logout': 'Logout user'
      }
    });
  } catch (error) {
    console.error('Error in auth GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'logout') {
      return NextResponse.json({ success: true, message: 'Logged out' });
    }
    
    // Handle refresh token endpoint (no action parameter needed for frontend compatibility)
    if (action === 'refresh' || request.url.endsWith('/api/auth/refresh')) {
      const body = await request.json();
      const { refreshToken } = body;
      
      if (!refreshToken) {
        return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
      }
      
      try {
        const decoded = Buffer.from(refreshToken, 'base64').toString();
        const userId = decoded.split(':')[0];
        
        const supabase = getSupabase();
        const { data: user } = await supabase
          .from('User')
          .select('id, email')
          .eq('id', userId)
          .single();
          
        if (!user) {
          return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }
        
        const token = await generateToken(user.id, user.email);
        const newRefreshToken = await generateRefreshToken(user.id, user.email);
        
        return NextResponse.json({ token, refreshToken: newRefreshToken });
      } catch (err) {
        return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
