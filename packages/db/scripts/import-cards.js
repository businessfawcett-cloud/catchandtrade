const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function importCards() {
  const cards = JSON.parse(fs.readFileSync(__dirname + '/../cards-export.json', 'utf-8'));
  
  console.log(`Importing ${cards.length} cards to production...`);
  
  // Delete in correct order due to foreign keys
  await prisma.cardPrice.deleteMany();
  console.log('Deleted card prices');
  await prisma.priceHistory.deleteMany();
  console.log('Deleted price history');
  await prisma.watchlistItem.deleteMany();
  console.log('Deleted watchlist');
  await prisma.priceAlert.deleteMany();
  console.log('Deleted alerts');
  await prisma.listing.deleteMany();
  console.log('Deleted listings');
  await prisma.portfolioItem.deleteMany();
  console.log('Deleted portfolio items');
  await prisma.card.deleteMany();
  console.log('Deleted existing cards');
  
  // Bulk insert in batches
  const batchSize = 500;
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize).map(c => ({
      name: c.name,
      supertype: c.supertype,
      setName: c.setName,
      setCode: c.setCode,
      cardNumber: c.cardNumber || '',
      rarity: c.rarity,
      imageUrl: c.imageUrl,
      tcgplayerId: c.tcgplayerId,
      gameType: c.gameType || 'POKEMON',
      language: c.language || 'EN'
    }));
    
    await prisma.card.createMany({ data: batch });
    console.log(`Inserted ${Math.min(i + batchSize, cards.length)} / ${cards.length}`);
  }
  
  const count = await prisma.card.count();
  console.log(`Total cards in production: ${count}`);
  
  await prisma.$disconnect();
}

importCards().catch(console.error);
