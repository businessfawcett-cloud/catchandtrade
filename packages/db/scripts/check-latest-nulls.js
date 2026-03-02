const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev' } }
});

async function checkLatestNulls() {
  // Check how many cards have null as their LATEST price
  const sql = `
    SELECT c.id, c.name, cp."priceMarket" as "currentPrice"
    FROM "Card" c
    LEFT JOIN LATERAL (
      SELECT "priceMarket" 
      FROM "CardPrice" 
      WHERE "cardId" = c.id 
      ORDER BY "date" DESC 
      LIMIT 1
    ) cp ON true
    WHERE cp."priceMarket" IS NULL
    LIMIT 10
  `;
  
  const nulls = await devPrisma.$queryRawUnsafe(sql);
  console.log(`Cards with NULL as latest price: ${nulls.length}`);
  nulls.forEach(c => console.log(`  ${c.name}: ${c.currentPrice}`));
  
  await devPrisma.$disconnect();
}

checkLatestNulls().catch(console.error);
