import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect('https://catchandtrade.com/login?error=UNIQUE_ABC_2025');
}
