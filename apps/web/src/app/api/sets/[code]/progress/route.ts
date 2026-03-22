import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params;
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // TODO: Verify JWT and get userId
  // For now, return empty progress
  
  return NextResponse.json({ 
    progress: 0, 
    ownedCards: [], 
    missingCards: [] 
  });
}