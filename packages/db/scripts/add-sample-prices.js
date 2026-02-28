const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function addSamplePrices() {
  console.log('Adding sample prices to cards...');
  
  // Get cards without prices
  const cards = await prisma.card.findMany({
    where: {
      prices: {
        none: {}
      }
    },
    take: 10000,
    select: { id: true, rarity: true, name: true }
  });
  
  console.log(`Found ${cards.length} cards without prices`);
  
  // Generate sample prices based on rarity
  const priceMap = {
    'Common': { low: 0.10, mid: 0.25, market: 0.15, high: 0.50 },
    'Uncommon': { low: 0.25, mid: 0.75, market: 0.50, high: 1.50 },
    'Rare Holo': { low: 2.00, mid: 5.00, market: 3.50, high: 10.00 },
    'Rare Ultra': { low: 5.00, mid: 15.00, market: 10.00, high: 30.00 },
    'Rare Secret': { low: 20.00, mid: 50.00, market: 35.00, high: 100.00 },
    'Illustration Rare': { low: 15.00, mid: 40.00, market: 30.00, high: 80.00 },
    'Special Illustration Rare': { low: 30.00, mid: 80.00, market: 60.00, high: 150.00 },
    'Pokemon Promo': { low: 1.00, mid: 3.00, market: 2.00, high: 5.00 },
    'Rare ACE SPEC': { low: 5.00, mid: 15.00, market: 10.00, high: 30.00 },
    'Rare Rainbow': { low: 50.00, mid: 150.00, market: 100.00, high: 300.00 },
    'Rare Ultra Rainbow': { low: 100.00, mid: 300.00, market: 200.00, high: 500.00 },
  };
  
  let added = 0;
  const today = new Date();
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const rarity = card.rarity || 'Common';
    const prices = priceMap[rarity] || priceMap['Common'];
    
    // Add some randomness (+/- 50%)
    const multiplier = 0.5 + Math.random();
    const cardPrices = {
      low: parseFloat((prices.low * multiplier).toFixed(2)),
      mid: parseFloat((prices.mid * multiplier).toFixed(2)),
      market: parseFloat((prices.market * multiplier).toFixed(2)),
      high: parseFloat((prices.high * multiplier).toFixed(2))
    };
    
    await prisma.cardPrice.create({
      data: {
        cardId: card.id,
        date: today,
        tcgplayerLow: cardPrices.low,
        tcgplayerMid: cardPrices.mid,
        tcgplayerMarket: cardPrices.market,
        tcgplayerHigh: cardPrices.high
      }
    });
    
    added++;
    
    if (added % 500 === 0) {
      console.log(`Added ${added} prices...`);
    }
  }
  
  console.log(`Done! Added ${added} prices`);
  
  await prisma.$disconnect();
}

addSamplePrices().catch(console.error);
