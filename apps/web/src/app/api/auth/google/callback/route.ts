import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || errorDescription) {
    return NextResponse.redirect('/login?error=' + encodeURIComponent(error || errorDescription || 'unknown'));
  }

  if (!code) {
    return NextResponse.redirect('/login?error=no_code');
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = 'https://catchandtrade.com/api/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing OAuth credentials');
    return NextResponse.redirect('/login?error=oauth_not_configured');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect('/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect('/login?error=token_failed');
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userResponse.ok) {
      console.error('User info fetch error:', userResponse.status);
      return NextResponse.redirect('/login?error=user_info_failed');
    }

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect('/login?error=no_email');
    }

    const { data: existingUser } = await supabase
      .from('User')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          email: googleUser.email,
          username: googleUser.name || googleUser.email.split('@')[0],
          password: 'google_oauth',
          createdat: new Date().toISOString()
        })
        .select()
        .single();

      if (createError && createError.code !== '23505') {
        console.error('Error creating user:', createError);
        return NextResponse.redirect('/login?error=create_failed');
      }

      user = newUser || existingUser;
    }

    if (!user) {
      return NextResponse.redirect('/login?error=user_not_found');
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

    const redirectUrl = new URL('/login', request.nextUrl.origin);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({ id: user.id, email: user.email, username: user.username }));

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect('/login?error=callback_failed');
  }
}