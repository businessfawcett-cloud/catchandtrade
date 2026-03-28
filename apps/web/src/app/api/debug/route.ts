import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/api';

const ADMIN_EMAILS = ['admin@catchandtrade.com'];

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const email = decoded.split(':')[1];
    return ADMIN_EMAILS.includes(email?.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const supabase = getSupabase();
    
    const [{ count: cardCount }, { count: setCount }, { count: userCount }, { count: listingCount }] = await Promise.all([
      supabase.from('Card').select('*', { count: 'exact', head: true }),
      supabase.from('PokemonSet').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('Listing').select('*', { count: 'exact', head: true }),
    ]);
    
    return NextResponse.json({ cardCount, setCount, userCount, listingCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    return NextResponse.json({ message: 'Debug POST endpoint', body });
  } catch (error) {
    console.error('Error in debug POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    return NextResponse.json({ message: 'Debug PUT endpoint', body });
  } catch (error) {
    console.error('Error in debug PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    return NextResponse.json({ message: 'Debug DELETE endpoint' });
  } catch (error) {
    console.error('Error in debug DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
