const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function linkCardsToSets() {
  console.log('Fetching sets...');
  const sets = await prisma.pokemonSet.findMany();
  
  const setsMap = {};
  for (const set of sets) {
    setsMap[set.code] = set.id;
  }
  console.log(`Found ${sets.length} sets`);
  
  // Get all unique setCodes from cards
  const cards = await prisma.card.findMany({
    select: { setCode: true }
  });
  
  const uniqueSetCodes = [...new Set(cards.map(c => c.setCode))];
  console.log(`Cards have ${uniqueSetCodes.length} unique setCodes`);
  
  // Update cards with setId
  let updated = 0;
  for (const setCode of uniqueSetCodes) {
    const setId = setsMap[setCode];
    if (setId) {
      await prisma.card.updateMany({
        where: { setCode },
        data: { setId }
      });
      updated++;
      console.log(`Linked ${setCode} to set`);
    } else {
      console.log(`WARNING: No set found for setCode: ${setCode}`);
    }
  }
  
  console.log(`Updated ${updated} setCodes`);
  
  const cardCount = await prisma.card.count();
  const cardsWithSetId = await prisma.card.count({
    where: { setId: { not: null } }
  });
  
  console.log(`Total cards: ${cardCount}, Cards with setId: ${cardsWithSetId}`);
  
  await prisma.$disconnect();
}

linkCardsToSets().catch(console.error);
