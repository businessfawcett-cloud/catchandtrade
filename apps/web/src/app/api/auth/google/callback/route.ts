import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect('https://catchandtrade.com/login?error=SIMPLE_2025');
}
