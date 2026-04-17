import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }
  
  const hasUser = dbUrl.includes('catchandtrade_db_p6co_user');
  const hasHost = dbUrl.includes('dpg-d7h5rodckfvc739ql21g-a');
  
  return NextResponse.json({
    dbUrlExists: !!dbUrl,
    dbUrlPreview: dbUrl ? dbUrl.substring(0, 50) + '...' : 'MISSING',
    containsUser: hasUser,
    containsHost: hasHost,
    fullUrl: dbUrl
  });
}