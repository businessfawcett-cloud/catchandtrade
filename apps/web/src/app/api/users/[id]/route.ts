import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findFirst({
      where: { username: params.id.toLowerCase() },
      select: { id: true, username: true, displayName: true, avatarId: true, isPublic: true, hideCollectionValue: true, twitterHandle: true, instagramHandle: true, tiktokHandle: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in users/:id GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId || params.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.avatarId !== undefined) updateData.avatarId = body.avatarId;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.hideCollectionValue !== undefined) updateData.hideCollectionValue = body.hideCollectionValue;
    if (body.twitterHandle !== undefined) updateData.twitterHandle = body.twitterHandle;
    if (body.instagramHandle !== undefined) updateData.instagramHandle = body.instagramHandle;
    if (body.tiktokHandle !== undefined) updateData.tiktokHandle = body.tiktokHandle;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, displayName: true, avatarId: true, isPublic: true, hideCollectionValue: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in users/:id PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId || params.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: `deleted_${userId}@deleted.com`, username: null, displayName: 'Deleted User' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in users/:id DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
