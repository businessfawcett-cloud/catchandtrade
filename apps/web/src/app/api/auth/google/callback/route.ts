import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const SUPABASE_KEY = 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

export async function GET(request: NextRequest) {
  console.log('Callback invoked, env vars:', {
    clientId: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'missing'
  });
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  console.log('Code present:', !!code);

  if (!code) {
    return NextResponse.redirect('/login?error=no_code');
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  console.log('Using credentials, ID length:', GOOGLE_CLIENT_ID?.length);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 });
  }

  const REDIRECT_URI = 'https://catchandtrade.com/api/auth/google/callback';

  try {
    console.log('Exchanging code...');
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

    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token error:', errorData);
      return NextResponse.json({ error: 'Token exchange failed', details: errorData }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Got access token');

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userResponse.json();
    console.log('Got user:', googleUser.email);

    // Check/create user in Supabase
    const userQuery = await fetch(`${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(googleUser.email)}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const users = await userQuery.json();
    let user = users && Array.isArray(users) && users.length > 0 ? users[0] : null;

    if (!user) {
      console.log('Creating new user...');
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
          createdat: new Date().toISOString()
        })
      });
      
      console.log('Create response status:', createResponse.status);
      
      if (createResponse.ok) {
        const newUsers = await createResponse.json();
        console.log('Created user response:', newUsers);
        user = newUsers && Array.isArray(newUsers) && newUsers.length > 0 ? newUsers[0] : null;
      }
    }

    console.log('User object:', user);

    if (!user) {
      console.error('User not found or created');
      return NextResponse.redirect('/login?error=user_not_found');
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');
    
    const redirectUrl = new URL('/login', request.nextUrl.origin);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({ id: user.id, email: user.email, username: user.username }));

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}