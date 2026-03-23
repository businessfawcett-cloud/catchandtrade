import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'NEW_ROUTE_WORKS' });
}
