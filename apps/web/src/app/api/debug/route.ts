import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const [{ count: cardCount }, { count: setCount }] = await Promise.all([
      supabase.from('Card').select('*', { count: 'exact', head: true }),
      supabase.from('PokemonSet').select('*', { count: 'exact', head: true }),
    ]);
    return NextResponse.json({ cardCount, setCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement POST handler for debug
    const body = await request.json();
    return NextResponse.json({ message: 'debug POST endpoint', body });
  } catch (error) {
    console.error('Error in debug POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement PUT handler for debug
    const body = await request.json();
    return NextResponse.json({ message: 'debug PUT endpoint', body });
  } catch (error) {
    console.error('Error in debug PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement DELETE handler for debug
    return NextResponse.json({ message: 'debug DELETE endpoint' });
  } catch (error) {
    console.error('Error in debug DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
