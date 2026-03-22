import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const SUPABASE_KEY = 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || errorDescription) {
    return NextResponse.redirect('https://catchandtrade.com/login?error=' + encodeURIComponent(error || errorDescription || 'unknown'));
  }

  if (!code) {
    return NextResponse.redirect('https://catchandtrade.com/login?error=no_code');
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect('https://catchandtrade.com/login?error=oauth_not_configured');
  }

  const REDIRECT_URI = 'https://catchandtrade.com/api/auth/google/callback';

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
      return NextResponse.redirect('https://catchandtrade.com/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect('https://catchandtrade.com/login?error=no_email');
    }

    // Find user by email - try lowercase and original
    const userEmail = googleUser.email.toLowerCase();
    
    // Direct lookup - try by ID if this is a known Google ID
    const googleId = googleUser.id;
    
    // Check by googleid first
    const byGoogleIdQuery = await fetch(`${SUPABASE_URL}/rest/v1/User?googleid=eq.${googleId}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    let users = await byGoogleIdQuery.json();
    let user = users && Array.isArray(users) && users.length > 0 ? users[0] : null;
    
    // If not found, try by email
    if (!user) {
      const byEmailQuery = await fetch(`${SUPABASE_URL}/rest/v1/User?email=ilike.*${encodeURIComponent(userEmail)}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      users = await byEmailQuery.json();
      user = users && Array.isArray(users) && users.length > 0 ? users[0] : null;
    }

    // If still not found, create a new user
    if (!user) {
      const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          email: userEmail,
          username: googleUser.name || userEmail.split('@')[0],
          googleid: googleId,
          createdat: new Date().toISOString()
        })
      });
      
      if (createResponse.ok) {
        const newUsers = await createResponse.json();
        user = newUsers && Array.isArray(newUsers) && newUsers.length > 0 ? newUsers[0] : null;
      }
    }

    if (!user) {
      return NextResponse.redirect('https://catchandtrade.com/login?error=user_not_found');
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');
    
    const redirectUrl = new URL('https://catchandtrade.com/login');
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({ id: user.id, email: user.email, username: user.username }));

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect('https://catchandtrade.com/login?error=callback_failed');
  }
}