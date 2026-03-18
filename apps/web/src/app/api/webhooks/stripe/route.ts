import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@catchandtrade/db';

// Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement Stripe webhook handler
    const body = await request.json();
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in Stripe webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
