const { PrismaClient } = require('@prisma/client');

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function checkPrices() {
  console.log('Checking production database...');
  
  const count = await prodPrisma.cardPrice.count();
  console.log(`Total price records: ${count}`);
  
  const topPrices = await prodPrisma.cardPrice.findMany({
    orderBy: { priceMarket: 'desc' },
    take: 5,
    include: { card: true }
  });
  
  console.log('\nTop 5 prices in production:');
  topPrices.forEach(p => {
    console.log(`  ${p.card?.name || p.cardId}: $${p.priceMarket}`);
  });
  
  await prodPrisma.$disconnect();
}

checkPrices().catch(console.error);
