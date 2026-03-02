const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev' } }
});

async function checkNulls() {
  // Find cards with no price
  const noPrice = await devPrisma.card.count({
    where: { prices: { none: {} } }
  });
  
  console.log(`Cards with NO prices: ${noPrice}`);
  
  // Find cards with null priceMarket
  const nullMarket = await devPrisma.cardPrice.count({
    where: { priceMarket: null }
  });
  
  console.log(`Price records with NULL priceMarket: ${nullMarket}`);
  
  // Get cards with lowest prices
  const lowPrices = await devPrisma.cardPrice.findMany({
    where: { priceMarket: { not: null } },
    orderBy: { priceMarket: 'asc' },
    take: 10,
    include: { card: true }
  });
  
  console.log('\nLowest prices:');
  lowPrices.forEach(p => console.log(`  ${p.card?.name}: $${p.priceMarket}`));
  
  await devPrisma.$disconnect();
}

checkNulls().catch(console.error);
