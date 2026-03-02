const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev'
    }
  }
});

const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function migratePrices() {
  console.log('Fetching prices from dev database...');
  
  const devPrices = await devPrisma.cardPrice.findMany({
    include: { card: false }
  });
  
  console.log(`Found ${devPrices.length} price records in dev DB`);
  
  console.log('Clearing prices in production database...');
  await prodPrisma.cardPrice.deleteMany();
  
  console.log('Migrating prices to production...');
  
  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < devPrices.length; i += batchSize) {
    const batch = devPrices.slice(i, i + batchSize);
    await prodPrisma.cardPrice.createMany({
      data: batch.map(p => ({
        id: p.id,
        cardId: p.cardId,
        date: p.date,
        priceLow: p.priceLow,
        priceMid: p.priceMid,
        priceHigh: p.priceHigh,
        priceMarket: p.priceMarket,
        ebaySoldAvg: p.ebaySoldAvg,
        ebayBuyNowLow: p.ebayBuyNowLow,
        priceChartingValue: p.priceChartingValue,
        gradedPSA10: p.gradedPSA10,
        gradedPSA9: p.gradedPSA9,
        gradedBGS10: p.gradedBGS10,
        gradedBGS95: p.gradedBGS95,
        expectedValue: p.expectedValue,
        lastUpdated: p.lastUpdated,
        isStale: p.isStale,
        listingCount: p.listingCount
      })),
      skipDuplicates: true
    });
    console.log(`  Inserted ${Math.min(i + batchSize, devPrices.length)}/${devPrices.length}`);
  }
  
  console.log('Done!');
  
  await devPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

migratePrices().catch(console.error);
