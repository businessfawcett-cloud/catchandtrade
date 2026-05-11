import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('Connecting to database...');
  await prisma.$connect();
  console.log('Connected to database');

  // Check if we have sets already
  const existingSets = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM "PokemonSet"`);
  console.log('Existing sets:', existingSets[0]?.count);

  if (existingSets[0]?.count > 0) {
    console.log('Database already has data, skipping seed');
    await prisma.$disconnect();
    return;
  }

  // Create some popular Pokemon sets
  const sets = [
    { id: 'base1', code: 'base1', name: 'Base Set', totalCards: 102, releaseYear: 1999 },
    { id: 'base2', code: 'base2', name: 'Base Set 2', totalCards: 130, releaseYear: 2000 },
    { id: 'base3', code: 'base3', name: 'Fossil', totalCards: 62, releaseYear: 1999 },
    { id: 'base4', code: 'base4', name: 'Base Set', totalCards: 97, releaseYear: 2000 },
    { id: 'gym1', code: 'gym1', name: 'Gym Heroes', totalCards: 82, releaseYear: 2000 },
    { id: 'gym2', code: 'gym2', name: 'Gym Challenge', totalCards: 96, releaseYear: 2000 },
    { id: 'neo1', code: 'neo1', name: 'Neo Genesis', totalCards: 83, releaseYear: 2000 },
    { id: 'neo2', code: 'neo2', name: 'Neo Discovery', totalCards: 75, releaseYear: 2001 },
    { id: 'neo3', code: 'neo3', name: 'Neo Revelation', totalCards: 66, releaseYear: 2001 },
    { id: 'neo4', code: 'neo4', name: 'Neo Destiny', totalCards: 113, releaseYear: 2002 },
    { id: 'swsh1', code: 'swsh1', name: 'Sword & Shield', totalCards: 216, releaseYear: 2020 },
    { id: 'swsh2', code: 'swsh2', name: 'Sword & Shield Vivid Voltage', totalCards: 203, releaseYear: 2020 },
    { id: 'swsh3', code: 'swsh3', name: 'Sword & Shield Roaring Moon', totalCards: 226, releaseYear: 2021 },
    { id: 'sv01', code: 'sv01', name: 'Scarlet & Violet Base Set', totalCards: 216, releaseYear: 2023 },
    { id: 'sv02', code: 'sv02', name: 'Scarlet & Violet Obsidian Flames', totalCards: 230, releaseYear: 2023 },
    { id: 'sv03', code: 'sv03', name: 'Scarlet & Violet Paldean Fates', totalCards: 266, releaseYear: 2024 },
    { id: 'sv04', code: 'sv04', name: 'Scarlet & Violet Temporal Forces', totalCards: 236, releaseYear: 2024 },
    { id: 'sv05', code: 'sv05', name: 'Scarlet & Iron Valiant', totalCards: 230, releaseYear: 2024 },
    { id: 'sv06', code: 'sv06', name: 'Scarlet & Violet Surging Sparks', totalCards: 250, releaseYear: 2025 },
    { id: 'sv07', code: 'sv07', name: 'Scarlet & Violet Prismatic Evolutions', totalCards: 226, releaseYear: 2025 },
  ];

  for (const set of sets) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PokemonSet" ("id", "code", "name", "totalCards", "releaseYear", "language")
      VALUES ($1, $2, $3, $4, $5, 'EN')
      ON CONFLICT (code) DO NOTHING
    `, set.id, set.code, set.name, set.totalCards, set.releaseYear);
  }
  console.log('Inserted sets');

  // Create some popular cards
  const setNames: Record<string, string> = {
    'base1': 'Base Set',
    'base2': 'Base Set 2',
    'base3': 'Fossil',
    'base4': 'Base Set',
    'gym1': 'Gym Heroes',
    'gym2': 'Gym Challenge',
    'neo1': 'Neo Genesis',
    'neo2': 'Neo Discovery',
    'neo3': 'Neo Revelation',
    'neo4': 'Neo Destiny',
    'swsh1': 'Sword & Shield',
    'swsh2': 'Vivid Voltage',
    'swsh3': 'Roaring Moon',
    'sv01': 'Scarlet & Violet Base Set',
    'sv02': 'Obsidian Flames',
    'sv03': 'Paldean Fates',
    'sv04': 'Temporal Forces',
    'sv05': 'Iron Valiant',
    'sv06': 'Surging Sparks',
    'sv07': 'Prismatic Evolutions',
  };

  const cards = [
    // Charizard Base Set
    { setCode: 'base1', number: 4, name: 'Charizard', rarity: 'Rare Holo' },
    { setCode: 'base1', number: 5, name: 'Charmander', rarity: 'Common' },
    { setCode: 'base1', number: 6, name: 'Charmeleon', rarity: 'Uncommon' },
    // Pikachu
    { setCode: 'base1', number: 58, name: 'Pikachu', rarity: 'Common' },
    { setCode: 'base1', number: 59, name: 'Raichu', rarity: 'Uncommon' },
    // Blastoise
    { setCode: 'base1', number: 9, name: 'Blastoise', rarity: 'Rare Holo' },
    { setCode: 'base1', number: 7, name: 'Squirtle', rarity: 'Common' },
    { setCode: 'base1', number: 8, name: 'Wartortle', rarity: 'Uncommon' },
    // Venusaur
    { setCode: 'base1', number: 15, name: 'Venusaur', rarity: 'Rare Holo' },
    { setCode: 'base1', number: 13, name: 'Bulbasaur', rarity: 'Common' },
    { setCode: 'base1', number: 14, name: 'Ivysaur', rarity: 'Uncommon' },
    // Mewtwo
    { setCode: 'base1', number: 10, name: 'Mewtwo', rarity: 'Rare Holo' },
    // Dragonite
    { setCode: 'base1', number: 5, name: 'Dragonite', rarity: 'Rare Holo' },
    // Gyarados
    { setCode: 'base1', number: 6, name: 'Gyarados', rarity: 'Rare Holo' },
    // Alakazam
    { setCode: 'base1', number: 1, name: 'Alakazam', rarity: 'Rare Holo' },
    // Fossil
    { setCode: 'base3', number: 4, name: 'Dragonite', rarity: 'Rare Holo' },
    { setCode: 'base3', number: 5, name: 'Gengar', rarity: 'Rare Holo' },
    { setCode: 'base3', number: 9, name: 'Kabutops', rarity: 'Rare Holo' },
    { setCode: 'base3', number: 12, name: 'Moltres', rarity: 'Rare Holo' },
    { setCode: 'base3', number: 15, name: 'Zapdos', rarity: 'Rare Holo' },
    { setCode: 'base3', number: 2, name: 'Articuno', rarity: 'Rare Holo' },
    // Base Set 2
    { setCode: 'base2', number: 4, name: 'Charizard', rarity: 'Rare Holo' },
    { setCode: 'base2', number: 7, name: 'Blastoise', rarity: 'Rare Holo' },
    { setCode: 'base2', number: 10, name: 'Venusaur', rarity: 'Rare Holo' },
    // Gym
    { setCode: 'gym1', number: 1, name: "Blaine's Moltres", rarity: 'Rare Holo' },
    { setCode: 'gym1', number: 2, name: "Brock's Onix", rarity: 'Rare Holo' },
    { setCode: 'gym2', number: 1, name: "Sabrina's Gengar", rarity: 'Rare Holo' },
    // Neo
    { setCode: 'neo1', number: 1, name: 'Sentret', rarity: 'Common' },
    { setCode: 'neo1', number: 2, name: 'Furret', rarity: 'Uncommon' },
    { setCode: 'neo1', number: 7, name: 'Pichu', rarity: 'Common' },
    { setCode: 'neo1', number: 8, name: 'Cleffa', rarity: 'Common' },
    { setCode: 'neo1', number: 14, name: 'Togepi', rarity: 'Common' },
    // Sword & Shield
    { setCode: 'swsh1', number: 11, name: 'Charizard VMAX', rarity: 'Rare Ultra' },
    { setCode: 'swsh1', number: 12, name: 'Gengar VMAX', rarity: 'Rare Ultra' },
    { setCode: 'swsh1', number: 13, name: 'Eevee VMAX', rarity: 'Rare Ultra' },
    // Scarlet & Violet
    { setCode: 'sv01', number: 1, name: 'Sprigatito', rarity: 'Common' },
    { setCode: 'sv01', number: 2, name: 'Floragato', rarity: 'Uncommon' },
    { setCode: 'sv01', number: 3, name: 'Meowscarada', rarity: 'Rare Holo' },
    { setCode: 'sv01', number: 8, name: 'Fuecoco', rarity: 'Common' },
    { setCode: 'sv01', number: 15, name: 'Quaxly', rarity: 'Common' },
    { setCode: 'sv01', number: 211, name: 'Koraidon', rarity: 'Rare Ultra' },
    { setCode: 'sv01', number: 212, name: 'Miraidon', rarity: 'Rare Ultra' },
    // SV05
    { setCode: 'sv05', number: 1, name: 'Tinkatink', rarity: 'Common' },
    { setCode: 'sv05', number: 2, name: 'Tinkatuff', rarity: 'Uncommon' },
    { setCode: 'sv05', number: 3, name: 'Tinkaton', rarity: 'Rare Holo' },
    // SV06
    { setCode: 'sv06', number: 1, name: 'Ralts', rarity: 'Common' },
    { setCode: 'sv06', number: 2, name: 'Kirlia', rarity: 'Uncommon' },
    { setCode: 'sv06', number: 3, name: 'Gardevoir', rarity: 'Rare Holo' },
    { setCode: 'sv06', number: 10, name: 'Miraidon', rarity: 'Rare Ultra' },
    { setCode: 'sv06', number: 11, name: 'Koraidon', rarity: 'Rare Ultra' },
    // SV07
    { setCode: 'sv07', number: 1, name: 'Lechonk', rarity: 'Common' },
    { setCode: 'sv07', number: 2, name: 'Oinkologne', rarity: 'Rare Holo' },
  ];

  for (const card of cards) {
    const setName = setNames[card.setCode] || 'Unknown Set';
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Card" ("id", "setId", "setCode", "setName", "cardNumber", "name", "rarity", "language", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'EN', NOW())
      ON CONFLICT DO NOTHING
    `, `${card.setCode}-${card.number}`, card.setCode, card.setCode, setName, String(card.number), card.name, card.rarity);
  }
  console.log('Inserted sample cards');

  // Verify
  const setCount = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM "PokemonSet"`);
  const cardCount = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM "Card"`);
  console.log(`Sets: ${setCount[0]?.count}, Cards: ${cardCount[0]?.count}`);

  await prisma.$disconnect();
  console.log('Done!');
}

seedDatabase().catch(console.error);