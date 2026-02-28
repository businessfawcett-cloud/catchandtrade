import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface CardData {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  number: string;
  rarity: string | null;
  images: {
    small: string;
    large: string;
  };
  language: string;
}

interface SeedData {
  sets: Array<{
    id: string;
    name: string;
    code: string;
    series: string;
    totalCards: number;
    releaseYear: number;
    imageUrl: string | null;
  }>;
  cards: Record<string, CardData[]>;
}

function loadLocalData(): SeedData {
  const dataPath = path.join(__dirname, 'scripts', 'cards-data.json');
  const data = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(data);
}

async function main() {
  console.log('Starting database seed from local data...');

  // Clean up duplicate sets
  console.log('\n=== Cleaning up duplicate sets ===');
  const allSets = await prisma.pokemonSet.findMany();
  
  const setGroups = new Map<string, typeof allSets>();
  for (const set of allSets) {
    const key = set.name.toLowerCase();
    if (!setGroups.has(key)) {
      setGroups.set(key, []);
    }
    setGroups.get(key)!.push(set);
  }
  
  for (const [name, sets] of setGroups) {
    if (sets.length > 1) {
      console.log(`Found duplicates for "${name}": ${sets.map(s => s.code).join(', ')}`);
      const keep = sets[0];
      const toDelete = sets.slice(1);
      for (const del of toDelete) {
        console.log(`  Deleting duplicate: ${del.code}`);
        await prisma.card.deleteMany({ where: { setId: del.id } });
        await prisma.pokemonSet.delete({ where: { id: del.id } });
      }
    }
  }

  // Check if we need to seed
  const existingCards = await prisma.card.count();
  
  if (existingCards === 0) {
    console.log('\n=== Loading local card data ===');
    const seedData = loadLocalData();
    console.log(`Loading ${seedData.sets.length} sets and ${Object.values(seedData.cards).flat().length} cards...`);

    const setsMap: Record<string, string> = {};
    
    for (const set of seedData.sets) {
      const createdSet = await prisma.pokemonSet.create({
        data: {
          name: set.name,
          code: set.code,
          totalCards: set.totalCards,
          releaseYear: set.releaseYear,
          imageUrl: set.imageUrl,
        },
      });
      setsMap[set.code] = createdSet.id;
    }
    console.log(`Created ${seedData.sets.length} Pokemon sets`);

    let cardsCreated = 0;
    for (const setCode of Object.keys(seedData.cards)) {
      const setId = setsMap[setCode];
      if (!setId) continue;
      
      const cards = seedData.cards[setCode];
      for (const card of cards) {
        try {
          await prisma.card.create({
            data: {
              name: card.name,
              setName: card.setName,
              setCode: card.setCode,
              cardNumber: card.number || '',
              rarity: card.rarity,
              imageUrl: card.images?.large || card.images?.small,
              pokemonTcgId: card.id,
              gameType: 'POKEMON',
              language: card.language || 'EN',
              setId,
            },
          });
          cardsCreated++;
        } catch (err) {
          // Skip duplicates
        }
      }
    }
    console.log(`Created ${cardsCreated} Pokemon cards`);
  }

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
