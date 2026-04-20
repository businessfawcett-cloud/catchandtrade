import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      userId = decoded.split(':')[0];
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { username, displayName, avatarId, isPublic, hideCollectionValue, country, twitterHandle, instagramHandle, tiktokHandle } = body;

    if (username) {
      const taken = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), NOT: { id: userId } },
      });
      if (taken) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username.toLowerCase();
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarId !== undefined) updateData.avatarId = avatarId;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (hideCollectionValue !== undefined) updateData.hideCollectionValue = hideCollectionValue;
    if (country !== undefined) updateData.country = country;
    if (twitterHandle !== undefined) updateData.twitterHandle = twitterHandle;
    if (instagramHandle !== undefined) updateData.instagramHandle = instagramHandle;
    if (tiktokHandle !== undefined) updateData.tiktokHandle = tiktokHandle;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, username: true, displayName: true, avatarId: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
