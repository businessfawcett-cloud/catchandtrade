import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndPushSchema() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected to database');
    
    const tables = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Existing tables:', tables.map(t => t.table_name));
    
    await prisma.$disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkAndPushSchema();