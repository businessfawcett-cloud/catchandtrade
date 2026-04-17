export const dynamic = 'force-dynamic';

export async function GET() {
  const allEnvKeys = Object.keys(process.env);
  const dbKey = allEnvKeys.find(k => k.toLowerCase().includes('database') || k.toLowerCase().includes('db'));
  
  return Response.json({
    allEnvCount: allEnvKeys.length,
    dbKey: dbKey || 'none found',
    hasDb: !!dbKey
  });
}