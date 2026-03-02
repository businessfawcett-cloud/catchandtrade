const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev'
    }
  }
});

async function checkDevPrices() {
  console.log('Checking dev database...');
  
  const count = await devPrisma.cardPrice.count();
  console.log(`Total price records: ${count}`);
  
  const topPrices = await devPrisma.cardPrice.findMany({
    orderBy: { priceMarket: 'desc' },
    take: 5,
    include: { card: true }
  });
  
  console.log('\nTop 5 prices in dev:');
  topPrices.forEach(p => {
    console.log(`  ${p.card?.name || p.cardId}: $${p.priceMarket}`);
  });
  
  await devPrisma.$disconnect();
}

checkDevPrices().catch(console.error);
