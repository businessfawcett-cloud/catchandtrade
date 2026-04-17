export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    dbUrl1: process.env.DATABASE_URL,
    dbUrl2: process.env['DATABASE_URL'],
    dbUrl3: typeof process !== 'undefined' ? 'process exists' : 'no process',
    allKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB') || k.includes('POSTGRES'))
  });
}