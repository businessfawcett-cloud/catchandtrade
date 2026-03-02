const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev'
    }
  }
});

async function checkSpecificCards() {
  const cards = await devPrisma.card.findMany({
    where: {
      name: { contains: 'Espeon', mode: 'insensitive' }
    },
    take: 3,
    include: { prices: { orderBy: { date: 'desc' }, take: 3 } }
  });
  
  console.log('Espeon cards:');
  cards.forEach(c => {
    console.log(`  ${c.name} (${c.setCode}-${c.cardNumber}):`);
    c.prices.forEach(p => {
      console.log(`    priceMarket: $${p.priceMarket}, date: ${p.date}`);
    });
  });

  const topWithPrice = await devPrisma.cardPrice.findMany({
    where: { priceMarket: { not: null } },
    orderBy: { priceMarket: 'desc' },
    take: 5,
    include: { card: true }
  });
  
  console.log('\nTop 5 cards WITH prices:');
  topWithPrice.forEach(p => {
    console.log(`  ${p.card?.name}: $${p.priceMarket}`);
  });
  
  await devPrisma.$disconnect();
}

checkSpecificCards().catch(console.error);
