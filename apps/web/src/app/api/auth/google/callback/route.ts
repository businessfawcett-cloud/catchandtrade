import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://catchandtrade.com/api/auth/google/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || errorDescription) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect('/login?error=' + encodeURIComponent(error || errorDescription || 'unknown'));
  }

  if (!code) {
    console.error('No code in callback');
    return NextResponse.redirect('/login?error=no_code');
  }

  try {
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);

    if (!tokenData.access_token) {
      console.error('No access token:', tokenData);
      return NextResponse.redirect('/login?error=token_failed');
    }

    console.log('Fetching user info...');
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userResponse.json();
    console.log('Google user:', googleUser);

    if (!googleUser.email) {
      return NextResponse.redirect('/login?error=no_email');
    }

    console.log('Looking up user in database:', googleUser.email);
    const { data: existingUser } = await supabase
      .from('User')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    let user;
    if (existingUser) {
      console.log('Found existing user:', existingUser.id);
      user = existingUser;
    } else {
      console.log('Creating new user...');
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

    console.log('Creating token for user:', user.id);
    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

    const redirectUrl = new URL('/login', request.nextUrl.origin);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({ id: user.id, email: user.email, username: user.username }));

    console.log('Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect('/login?error=callback_failed');
  }
}