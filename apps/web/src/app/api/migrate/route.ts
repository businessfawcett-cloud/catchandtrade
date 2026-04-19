import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://catchandtrade_db_p6co_user:kmLyUdkbsl7AiD1JO0kWtTiG5yGudInp@dpg-d7h5rodckfvc739ql21g-a/catchandtrade_db_p6co?sslmode=require';
  
  const keys = Object.keys(process.env).filter(k => k.toLowerCase().includes('database') || k.toLowerCase().includes('postgres') || k.toLowerCase().includes('url'));
  const envSummary: Record<string, string> = {};
  for (const k of keys) {
    envSummary[k] = k.includes('password') || k.includes('secret') || k.includes('key') ? '***' : (process.env[k] || 'undefined');
  }
  
  return NextResponse.json({
    dbUrlPresent: !!process.env.DATABASE_URL,
    dbUrlPreview: dbUrl.substring(0, 50) + '...',
    nodeEnv: process.env.NODE_ENV,
    dbRelatedEnvVars: envSummary,
    totalEnvVars: Object.keys(process.env).length
  });
}