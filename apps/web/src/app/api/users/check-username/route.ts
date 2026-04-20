import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('u');

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, error: 'Username too short' });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({ available: !user });
  } catch (err) {
    console.error('Check username error:', err);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}
