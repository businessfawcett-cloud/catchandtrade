import { NextResponse } from 'next/server';
// WishlistItem table is not in the current Prisma schema (use watchlist instead).
export async function GET() { return NextResponse.json([]); }
export async function POST() { return NextResponse.json({ error: 'Use /api/watchlist instead' }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: 'Use /api/watchlist instead' }, { status: 501 }); }
