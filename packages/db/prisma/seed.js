const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function loadLocalData() {
  const dataPath = path.join(__dirname, '..', 'scripts', 'cards-data.json');
  const data = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(data);
}

async function main() {
  console.log('Starting database seed from local data...');

  console.log('\n=== Loading local card data ===');
  const seedData = loadLocalData();
  console.log(`Loading ${seedData.sets.length} sets and ${Object.values(seedData.cards).flat().length} cards...`);

  // Upsert all sets (creates or updates)
  let setsCreated = 0;
  for (const set of seedData.sets) {
    await prisma.pokemonSet.upsert({
      where: { code: set.code },
      update: {
        name: set.name,
        totalCards: set.totalCards,
        releaseYear: set.releaseYear,
        imageUrl: set.imageUrl,
      },
      create: {
        name: set.name,
        code: set.code,
        totalCards: set.totalCards,
        releaseYear: set.releaseYear,
        imageUrl: set.imageUrl,
      },
    });
    setsCreated++;
  }
  console.log(`Upserted ${setsCreated} Pokemon sets`);

  // Get set IDs
  const sets = await prisma.pokemonSet.findMany();
  const setsMap = {};
  for (const set of sets) {
    setsMap[set.code] = set.id;
  }

  // Upsert all cards (creates or updates - won't fail on duplicates)
  let cardsCreated = 0;
  let cardsSkipped = 0;
  for (const setCode of Object.keys(seedData.cards)) {
    const setId = setsMap[setCode];
    if (!setId) continue;
    
    const cards = seedData.cards[setCode];
    for (const card of cards) {
      try {
        await prisma.card.upsert({
          where: { tcgplayerId: card.id },
          update: {
            name: card.name,
            setName: card.setName,
            setCode: card.setCode,
            cardNumber: card.number || '',
            rarity: card.rarity,
            imageUrl: card.images?.large || card.images?.small,
            gameType: 'POKEMON',
            language: card.language || 'EN',
            setId,
          },
          create: {
            name: card.name,
            setName: card.setName,
            setCode: card.setCode,
            cardNumber: card.number || '',
            rarity: card.rarity,
            imageUrl: card.images?.large || card.images?.small,
            tcgplayerId: card.id,
            gameType: 'POKEMON',
            language: card.language || 'EN',
            setId,
          },
        });
        cardsCreated++;
      } catch (err) {
        cardsSkipped++;
      }
    }
  }
  console.log(`Upserted ${cardsCreated} Pokemon cards (${cardsSkipped} skipped)`);

  // Create user if not exists
  const existingUsers = await prisma.user.count();
  if (existingUsers === 0) {
    console.log('\n=== Creating test user ===');
    const buyerPasswordHash = await bcrypt.hash('TestPassword123!', 12);
    const buyer = await prisma.user.create({
      data: {
        email: 'buyer@test.com',
        passwordHash: buyerPasswordHash,
        displayName: 'Test Buyer',
      },
    });

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: buyer.id,
        name: 'My Collection',
        isPublic: false,
      },
    });

    const allCards = await prisma.card.findMany({ take: 10 });
    for (let i = 0; i < Math.min(5, allCards.length); i++) {
      await prisma.portfolioItem.create({
        data: {
          portfolioId: portfolio.id,
          cardId: allCards[i].id,
          quantity: 1,
          condition: 'NEAR_MINT',
          isGraded: false,
          purchasePrice: Math.floor(Math.random() * 100) + 10,
        },
      });
    }
    console.log('Created user and portfolio');
  }

  // Show summary
  const finalSets = await prisma.pokemonSet.findMany({
    include: { _count: { select: { cards: true } } }
  });
  
  console.log('\n=== Card counts by set (top 20) ===');
  const setsWithCards = finalSets
    .filter(s => s._count.cards > 0)
    .sort((a, b) => b._count.cards - a._count.cards)
    .slice(0, 20);
  
  for (const set of setsWithCards) {
    console.log(`${set.code}: ${set._count.cards} cards`);
  }

  const cardCount = await prisma.card.count();
  const setCount = await prisma.pokemonSet.count();

  console.log('\n=== Database seeded successfully! ===');
  console.log(`Total sets: ${setCount}`);
  console.log(`Total cards: ${cardCount}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
