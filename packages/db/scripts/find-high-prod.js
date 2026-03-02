const { PrismaClient } = require('@prisma/client');

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function findHighPrices() {
  console.log('Looking for high prices in production...');
  
  const highPrices = await prodPrisma.cardPrice.findMany({
    where: { priceMarket: { gte: 1000 } },
    orderBy: { priceMarket: 'desc' },
    take: 10,
    include: { card: true }
  });
  
  console.log(`Found ${highPrices.length} cards with price >= $1000`);
  highPrices.forEach(p => {
    console.log(`  ${p.card?.name || p.cardId}: $${p.priceMarket}`);
  });

  // Check for Espeon
  const espeon = await prodPrisma.card.findMany({
    where: { name: { contains: 'Espeon' } },
    include: { prices: { orderBy: { date: 'desc' }, take: 2 } }
  });
  
  console.log('\nEspeon cards:');
  espeon.forEach(c => {
    console.log(`  ${c.name} (${c.setCode}-${c.cardNumber}):`);
    c.prices.forEach(p => console.log(`    $${p.priceMarket}`));
  });
  
  await prodPrisma.$disconnect();
}

findHighPrices().catch(console.error);
