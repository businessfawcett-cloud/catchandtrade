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

    const userEmail = googleUser.email.toLowerCase();
    const googleId = googleUser.id;

    // Try to find existing user by email (case-insensitive)
    const searchUrl = `${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(userEmail)}&select=*`;
    
    const userQuery = await fetch(searchUrl, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    console.log('User query status:', userQuery.status);
    
    let user = null;
    
    if (userQuery.ok) {
      const users = await userQuery.json();
      console.log('Users found:', JSON.stringify(users));
      if (users && Array.isArray(users) && users.length > 0) {
        user = users[0];
      }
    } else {
      console.log('User query error:', await userQuery.text());
    }

    // If no user found, create one
    if (!user) {
      const createUrl = `${SUPABASE_URL}/rest/v1/User`;
      
      const createResponse = await fetch(createUrl, {
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
          displayname: googleUser.name || userEmail.split('@')[0],
          createdat: new Date().toISOString()
        })
      });

      console.log('Create response status:', createResponse.status);
      
      if (createResponse.ok) {
        const newUsers = await createResponse.json();
        console.log('Created user:', JSON.stringify(newUsers));
        if (newUsers && Array.isArray(newUsers) && newUsers.length > 0) {
          user = newUsers[0];
        }
      } else {
        console.log('Create error:', await createResponse.text());
        // If create failed (maybe duplicate googleid), search by googleid
        const googleIdSearchUrl = `${SUPABASE_URL}/rest/v1/User?googleid=eq.${googleId}&select=*`;
        
        const retryQuery = await fetch(googleIdSearchUrl, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        
        if (retryQuery.ok) {
          const retryUsers = await retryQuery.json();
          if (retryUsers && Array.isArray(retryUsers) && retryUsers.length > 0) {
            user = retryUsers[0];
          }
        }
      }
    }

    // If still no user, error
    if (!user) {
      console.log('FAILURE: User not found after search and create attempt');
      return NextResponse.redirect('https://catchandtrade.com/login?error=oauth_user_not_found');
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