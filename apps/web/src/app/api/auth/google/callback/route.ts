import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const SUPABASE_KEY = 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

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
    // Exchange code for tokens
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

    // Get user info from Google
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

    // Check if user exists in Supabase using direct fetch
    const userQuery = await fetch(`${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(googleUser.email)}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const users = await userQuery.json();
    let user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      // Create new user
      const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          email: googleUser.email,
          username: googleUser.name || googleUser.email.split('@')[0],
          password: 'google_oauth',
          createdat: new Date().toISOString()
        })
      });

      if (createResponse.ok) {
        const newUsers = await createResponse.json();
        user = newUsers && newUsers.length > 0 ? newUsers[0] : null;
      }
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