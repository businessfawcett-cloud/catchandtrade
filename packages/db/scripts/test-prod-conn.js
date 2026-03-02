const { PrismaClient } = require('@prisma/client');

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function testConnection() {
  try {
    console.log('Testing connection to Render database...');
    await prodPrisma.$connect();
    console.log('Connected successfully!');
    
    const result = await prodPrisma.$queryRaw`SELECT current_database() as db, current_user as user`;
    console.log('Database:', result[0]);
    
    await prodPrisma.$disconnect();
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

testConnection();
