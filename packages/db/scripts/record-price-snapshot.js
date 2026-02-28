const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📸 Recording price snapshot...\n');
  
  const cards = await prisma.card.findMany({
    include: {
      prices: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  });
  
  console.log(`Found ${cards.length} cards\n`);
  
  let created = 0;
  let skipped = 0;
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const latestPrice = card.prices[0]?.priceMarket;
    
    if (!latestPrice) {
      skipped++;
      continue;
    }
    
    try {
      await prisma.priceHistory.create({
        data: {
          cardId: card.id,
          price: latestPrice,
          date: new Date(),
          source: 'ebay'
        }
      });
      created++;
      
      if ((i + 1) % 1000 === 0) {
        console.log(`  Processed ${i + 1}/${cards.length} cards...`);
      }
    } catch (e) {
      // Skip duplicates
    }
  }
  
  console.log(`\n✅ Done! Created ${created} price records`);
  console.log(`   Skipped ${skipped} cards without prices`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
