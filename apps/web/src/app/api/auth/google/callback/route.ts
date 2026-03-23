import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://catchandtrade.com/api/auth/google/callback';

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

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect('https://catchandtrade.com/login?error=oauth_not_configured');
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
      console.log('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect('https://catchandtrade.com/login?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect('https://catchandtrade.com/login?error=no_email');
    }

    const userEmail = googleUser.email.toLowerCase();
    const googleId = googleUser.id;

    console.log('OAuth: looking up user', userEmail, googleId);

    let { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.log('Email lookup error:', userError);
    }

    if (!user) {
      const { data: googleIdUser } = await supabase
        .from('User')
        .select('*')
        .eq('googleid', googleId)
        .single();
      
      if (googleIdUser) {
        user = googleIdUser;
        console.log('Found user by googleid:', user.id);
      }
    }

    if (!user) {
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          email: userEmail,
          username: googleUser.name || userEmail.split('@')[0],
          googleid: googleId,
          displayname: googleUser.name || userEmail.split('@')[0]
        })
        .select()
        .single();

      if (createError) {
        console.log('Create error:', createError);
        
        const { data: retryUser } = await supabase
          .from('User')
          .select('*')
          .eq('googleid', googleId)
          .single();
        
        user = retryUser;
      } else {
        user = newUser;
      }
    }

    if (!user) {
      return NextResponse.redirect('https://catchandtrade.com/login?error=SUPABASE_CLIENT_FAIL');
    }

    console.log('Success! User:', user.id, user.email);

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
