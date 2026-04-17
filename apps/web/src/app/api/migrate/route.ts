export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  return Response.json({
    dbUrlExists: !!dbUrl,
    dbUrl: dbUrl || 'NOT SET'
  });
}