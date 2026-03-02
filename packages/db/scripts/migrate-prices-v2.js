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
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function migratePricesWithMatching() {
  console.log('Fetching cards from production...');
  
  // Get all production cards indexed by unique key
  const prodCards = await prodPrisma.card.findMany({
    select: { id: true, name: true, setCode: true, cardNumber: true }
  });
  
  const cardMap = new Map();
  prodCards.forEach(c => {
    const key = `${c.name}|${c.setCode}|${c.cardNumber}`.toLowerCase();
    cardMap.set(key, c.id);
  });
  
  console.log(`Loaded ${prodCards.length} production cards`);
  
  console.log('Fetching prices from dev...');
  const devPrices = await devPrisma.cardPrice.findMany();
  console.log(`Found ${devPrices.length} dev price records`);
  
  console.log('Fetching dev cards for mapping...');
  const devCards = await devPrisma.card.findMany({
    select: { id: true, name: true, setCode: true, cardNumber: true }
  });
  
  const devCardMap = new Map();
  devCards.forEach(c => {
    const key = `${c.name}|${c.setCode}|${c.cardNumber}`.toLowerCase();
    devCardMap.set(key, c.id);
  });
  
  // Build price records with correct prod card IDs
  const pricesToInsert = [];
  let matched = 0;
  let notMatched = 0;
  
  for (const price of devPrices) {
    const devCard = devCards.find(c => c.id === price.cardId);
    if (!devCard) {
      notMatched++;
      continue;
    }
    
    const key = `${devCard.name}|${devCard.setCode}|${devCard.cardNumber}`.toLowerCase();
    const prodCardId = cardMap.get(key);
    
    if (prodCardId) {
      matched++;
      pricesToInsert.push({
        id: price.id,
        cardId: prodCardId,
        date: price.date,
        priceLow: price.priceLow,
        priceMid: price.priceMid,
        priceHigh: price.priceHigh,
        priceMarket: price.priceMarket,
        ebaySoldAvg: price.ebaySoldAvg,
        ebayBuyNowLow: price.ebayBuyNowLow,
        priceChartingValue: price.priceChartingValue,
        gradedPSA10: price.gradedPSA10,
        gradedPSA9: price.gradedPSA9,
        gradedBGS10: price.gradedBGS10,
        gradedBGS95: price.gradedBGS95,
        expectedValue: price.expectedValue,
        lastUpdated: price.lastUpdated,
        isStale: price.isStale,
        listingCount: price.listingCount
      });
    } else {
      notMatched++;
    }
  }
  
  console.log(`Matched ${matched} prices, ${notMatched} not matched`);
  console.log(`Clearing production prices...`);
  await prodPrisma.cardPrice.deleteMany();
  
  console.log(`Inserting ${pricesToInsert.length} prices...`);
  
  const batchSize = 500;
  for (let i = 0; i < pricesToInsert.length; i += batchSize) {
    const batch = pricesToInsert.slice(i, i + batchSize);
    await prodPrisma.cardPrice.createMany({
      data: batch,
      skipDuplicates: true
    });
    console.log(`  Inserted ${Math.min(i + batchSize, pricesToInsert.length)}/${pricesToInsert.length}`);
  }
  
  console.log('Done!');
  
  // Verify
  const count = await prodPrisma.cardPrice.count();
  console.log(`Production now has ${count} prices`);
  
  await devPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

migratePricesWithMatching().catch(console.error);
