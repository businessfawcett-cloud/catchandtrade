import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getWebUrl } from '@/lib/api';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${getWebUrl()}/api/auth/google/callback`;

function getLoginUrl(error?: string) {
  const url = new URL('/login', getWebUrl());
  if (error) url.searchParams.set('error', error);
  return url.toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(getLoginUrl(error || 'no_code'));
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(getLoginUrl('oauth_not_configured'));
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
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(getLoginUrl('token_exchange_failed'));
    }

    const tokenData = await tokenResponse.json();
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();
    if (!googleUser.email) {
      return NextResponse.redirect(getLoginUrl('no_email'));
    }

    const userEmail = googleUser.email.toLowerCase();
    const googleId = googleUser.id;

    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { googleId } });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          username: googleUser.name || userEmail.split('@')[0],
          googleId,
          displayName: googleUser.name || userEmail.split('@')[0],
        },
      });
    }

    if (!user) {
      return NextResponse.redirect(getLoginUrl('user_not_found'));
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');
    const redirectUrl = new URL('/login', getWebUrl());
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set(
      'user',
      JSON.stringify({ id: user.id, email: user.email, username: user.username || null, displayName: user.displayName || null })
    );

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('OAuth error:', err);
    return NextResponse.redirect(getLoginUrl('callback_failed'));
  }
}
