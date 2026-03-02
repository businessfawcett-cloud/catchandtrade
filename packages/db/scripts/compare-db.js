const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev' } }
});

const prodPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db' } }
});

async function compare() {
  const devCardCount = await devPrisma.card.count();
  const prodCardCount = await prodPrisma.card.count();
  
  console.log(`Dev cards: ${devCardCount}`);
  console.log(`Production cards: ${prodCardCount}`);
  
  const devPriceCount = await devPrisma.cardPrice.count();
  const prodPriceCount = await prodPrisma.cardPrice.count();
  
  console.log(`Dev prices: ${devPriceCount}`);
  console.log(`Production prices: ${prodPriceCount}`);
  
  await devPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

compare().catch(console.error);
