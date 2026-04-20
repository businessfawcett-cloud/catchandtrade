import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateToken, generateRefreshToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'providers') {
      return NextResponse.json({
        google: !!process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'REPLACE_WITH_GOOGLE_OAUTH_KEY',
        apple: !!process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_ID !== 'REPLACE_WITH_APPLE_KEY',
        email: true,
      });
    }

    return NextResponse.json({ message: 'Auth API' });
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

    if (action === 'refresh') {
      const body = await request.json();
      const { refreshToken } = body;

      if (!refreshToken) {
        return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
      }

      try {
        const decoded = Buffer.from(refreshToken, 'base64').toString();
        const userId = decoded.split(':')[0];

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });

        if (!user) {
          return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        const token = await generateToken(user.id, user.email);
        const newRefreshToken = await generateRefreshToken(user.id, user.email);

        return NextResponse.json({ token, refreshToken: newRefreshToken });
      } catch {
        return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
