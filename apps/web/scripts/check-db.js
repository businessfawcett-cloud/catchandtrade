import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndPushSchema() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected to database');
    
    // Check if tables exist
    const tables = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Existing tables:', tables.map(t => t.table_name));
    
    if (tables.length === 0) {
      console.log('No tables found. Generating Prisma client...');
      // We need to use db push through a different method
    }
    
    await prisma.$disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkAndPushSchema();