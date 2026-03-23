import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.redirect('https://catchandtrade.com/login?error=NEW_CALLBACK_2025');
}
