import { NextResponse } from 'next/server';
// GradedSlab table is not in the current Prisma schema.
// These endpoints return empty results until the model is added.
export async function GET() { return NextResponse.json([]); }
export async function POST() { return NextResponse.json({ error: 'Slabs feature not yet available' }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: 'Slabs feature not yet available' }, { status: 501 }); }
