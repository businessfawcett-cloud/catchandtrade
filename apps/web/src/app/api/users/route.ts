import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { generateToken, generateRefreshToken, getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const search = searchParams.get('search');

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, username: true, displayName: true, avatarId: true, isPublic: true, createdAt: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error in users GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, displayName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    if (username) {
      const usernameTaken = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
      if (usernameTaken) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        username: username?.toLowerCase(),
        displayName: displayName || username || email.split('@')[0],
      },
    });

    await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'My Collection',
        isPublic: false,
      },
    });

    const token = await generateToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id, user.email);

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
