import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const POKEMON_TCG_API_KEY = 'a3751a33-9ed6-4662-9ae3-870939002fcc';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

async function fetchCardsFromAPI(setCode: string, page: number = 1, pageSize: number = 250) {
  const response = await fetch(
    `${POKEMON_TCG_API_URL}/cards?q=set.id:${setCode}&page=${page}&pageSize=${pageSize}`,
    { headers: { 'X-Api-Key': POKEMON_TCG_API_KEY } }
  );
  
  if (!response.ok) {
    console.error(`Error fetching ${setCode}: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  return data;
}

async function populateCards() {
  console.log('Connecting to database...');
  await prisma.$connect();
  console.log('Connected to database');
  
  // First ensure sets exist - fetch from API
  const setCodes = [
    'base1', 'base2', 'base3', 'base4',
    'gym1', 'gym2',
    'neo1', 'neo2', 'neo3', 'neo4',
    'swsh1', 'swsh2', 'swsh3', 'swsh4', 'swsh5', 'swsh6', 'swsh7', 'swsh8', 'swsh9', 'swsh10', 'swsh11', 'swsh12',
    'sv3', 'sv4', 'sv5', 'sv6', 'sv7', 'sv8', 'sv9', 'sv10', 'sv11', 'sv12'
  ];
  
  let totalCards = 0;
  
  for (const setCode of setCodes) {
    console.log(`Fetching cards for ${setCode}...`);
    
    try {
      // First, get or create the set
      const setData = await fetchCardsFromAPI(setCode, 1, 1);
      if (!setData || !setData.data || setData.data.length === 0) {
        console.log(`  No cards found for ${setCode}, skipping`);
        continue;
      }
      
      const setInfo = setData.data[0].set;
      console.log(`  Set: ${setInfo.name} (${setInfo.total} cards)`);
      
      // Create or update the set
      const releaseYear = setInfo.releaseYear ? parseInt(setInfo.releaseYear) : 2020;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "PokemonSet" ("id", "code", "name", "totalCards", "releaseYear", "language")
        VALUES ($1, $2, $3, $4, $5, 'EN')
        ON CONFLICT (code) DO UPDATE SET "totalCards" = $4, "releaseYear" = $5
      `, setCode, setCode, setInfo.name, setInfo.total, isNaN(releaseYear) ? 2020 : releaseYear);
      
      // Fetch all pages of cards
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const cardsData = await fetchCardsFromAPI(setCode, page, 250);
        
        if (!cardsData || !cardsData.data || cardsData.data.length === 0) {
          hasMore = false;
          continue;
        }
        
        console.log(`  Page ${page}: ${cardsData.data.length} cards`);
        
        // Insert cards in batches
        for (const card of cardsData.data) {
          try {
            await prisma.$executeRawUnsafe(`
              INSERT INTO "Card" ("id", "setId", "setCode", "setName", "cardNumber", "name", "rarity", "imageUrl", "pokemonTcgId", "language", "createdAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'EN', NOW())
              ON CONFLICT (id) DO NOTHING
            `, 
              card.id,
              setCode,
              setCode,
              setInfo.name,
              card.number,
              card.name,
              card.rarity,
              card.images.large,
              card.id
            );
          } catch (e) {
            // Skip duplicates
          }
        }
        
        totalCards += cardsData.data.length;
        
        // Check if there are more pages
        if (cardsData.data.length < 250) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 100));
      }
      
      console.log(`  Completed ${setCode}: ${totalCards} total cards`);
      
    } catch (e) {
      console.error(`Error processing ${setCode}:`, e);
    }
  }
  
  // Get final count
  const cardCount = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM "Card"`);
  console.log(`\nTotal cards in database: ${cardCount[0]?.count}`);
  
  await prisma.$disconnect();
  console.log('Done!');
}

populateCards().catch(console.error);