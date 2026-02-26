import { prisma } from '@catchandtrade/db';
import * as cron from 'node-cron';

const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';
const GITHUB_SETS_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json';

const TCGPLAYER_API_KEY = 'a3751a33-9ed6-4662-9ae3-870939002fcc';

interface TCGCardSet {
  id: string;
  name: string;
  images: { logo: string; symbol: string };
  printedTotal: number;
  releaseDate: string;
}

interface GithubSet {
  id: string;
  name: string;
  total: number;
  releaseDate: string;
  images: { symbol: string; logo: string };
}

interface TCGCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  images: { small: string; large: string };
  tcgplayer?: {
    prices?: {
      holofoil?: { market: number };
      normal?: { market: number };
      reverseHolofoil?: { market: number };
    };
  };
  set: { id: string; name: string };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(url: string, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429 || response.status === 504) {
        await delay((i + 1) * 2000);
        continue;
      }
      if (!response.ok) {
        console.log(`  API returned ${response.status}, skipping...`);
        return null;
      }
      return await response.json() as T;
    } catch (err) {
      if (i === retries - 1) {
        return null;
      }
      await delay(1000);
    }
  }
  return null;
}

export async function syncSets(): Promise<{ newSets: number }> {
  console.log('Starting Job 1: Sync Sets (new only)...');
  
  let newSets = 0;

  const response = await fetchWithRetry<GithubSet[]>(GITHUB_SETS_URL);
  if (!response) {
    console.log('  GitHub API unavailable, skipping set sync');
    return { newSets: 0 };
  }

  const existingSets = await prisma.pokemonSet.findMany({
    select: { code: true }
  });
  const existingCodes = new Set(existingSets.map(s => s.code));

  for (const tcgSet of response) {
    if (existingCodes.has(tcgSet.id)) {
      continue;
    }

    const releaseYear = parseInt(tcgSet.releaseDate.split('-')[0], 10);
    const logoUrl = `https://images.pokemontcg.io/${tcgSet.id}/logo.png`;
    
    await prisma.pokemonSet.create({
      data: {
        name: tcgSet.name,
        code: tcgSet.id,
        totalCards: tcgSet.total,
        releaseYear,
        imageUrl: logoUrl,
      },
    });
    newSets++;
    console.log(`  Added new set: ${tcgSet.name} (${tcgSet.id})`);
  }

  console.log(`  Found ${newSets} new sets`);
  return { newSets };
}

export async function syncCards(): Promise<{ newCards: number }> {
  console.log('Starting Job 2: Sync Cards (new only)...');
  
  let newCards = 0;

  const sets = await prisma.pokemonSet.findMany();
  console.log(`  Checking ${sets.length} sets for new cards...`);

  for (const set of sets) {
    const response = await fetchWithRetry<TCGCard[]>(
      `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${set.code}.json`
    );
    
    if (!response || !Array.isArray(response)) continue;

    const existingCards = await prisma.card.findMany({
      where: { setCode: set.code },
      select: { tcgplayerId: true }
    });
    const existingIds = new Set(existingCards.map(c => c.tcgplayerId));

    for (const card of response) {
      if (existingIds.has(card.id)) {
        continue;
      }

      await prisma.card.create({
        data: {
          name: card.name,
          setName: set.name,
          setCode: set.code,
          cardNumber: card.number || '',
          rarity: card.rarity || null,
          imageUrl: card.images?.large || card.images?.small || null,
          tcgplayerId: card.id,
          gameType: 'POKEMON',
          language: 'EN',
          setId: set.id,
        },
      });
      newCards++;
    }

    await delay(100);
  }

  console.log(`  Found ${newCards} new cards`);
  return { newCards };
}

export async function syncPrices(): Promise<{ updatedPrices: number; triggeredAlerts: number }> {
  console.log('Starting Job 3: Sync Prices...');
  
  let updatedPrices = 0;
  let triggeredAlerts = 0;

  const cards = await prisma.card.findMany({
    where: { tcgplayerId: { not: null } }
  });

  console.log(`  Fetching prices for ${cards.length} cards in batches of 50...`);

  const BATCH_SIZE = 50;
  const cardsWithPrices = cards.filter(c => c.tcgplayerId);

  for (let i = 0; i < cardsWithPrices.length; i += BATCH_SIZE) {
    const batch = cardsWithPrices.slice(i, i + BATCH_SIZE);
    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(cardsWithPrices.length / BATCH_SIZE)}...`);

    for (const card of batch) {
      try {
        const response = await fetchWithRetry<{ data: TCGCard[] }>(
          `${POKEMON_TCG_API_URL}/cards/${card.tcgplayerId}`,
          2
        );
        
        if (!response || !response.data || !response.data[0]) {
          await delay(200);
          continue;
        }

        const cardData = response.data[0];
        const marketPrice = 
          cardData.tcgplayer?.prices?.holofoil?.market ||
          cardData.tcgplayer?.prices?.normal?.market ||
          cardData.tcgplayer?.prices?.reverseHolofoil?.market ||
          null;

        if (marketPrice) {
          await prisma.cardPrice.create({
            data: {
              cardId: card.id,
              tcgplayerMarket: marketPrice,
              tcgplayerLow: Math.round(marketPrice * 0.7 * 100) / 100,
              tcgplayerMid: Math.round(marketPrice * 100) / 100,
              tcgplayerHigh: Math.round(marketPrice * 1.3 * 100) / 100,
            },
          });
          updatedPrices++;
        }

        await delay(200);
      } catch (err) {
        console.log(`  Error fetching price for ${card.tcgplayerId}: ${err}`);
        await delay(200);
      }
    }
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: { card: { include: { prices: { orderBy: { date: 'desc' }, take: 1 } } } }
  });

  for (const alert of alerts) {
    const latestPrice = alert.card.prices[0]?.tcgplayerMarket;
    if (!latestPrice) continue;

    let shouldTrigger = false;
    if (alert.alertType === 'PRICE_ABOVE' && latestPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.alertType === 'PRICE_BELOW' && latestPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { isActive: false, triggeredAt: new Date() }
      });
      triggeredAlerts++;
    }
  }

  console.log(`  Updated prices for ${updatedPrices} cards, triggered ${triggeredAlerts} alerts`);
  return { updatedPrices, triggeredAlerts };
}

export async function runWeeklySync(): Promise<void> {
  const startTime = Date.now();
  
  console.log('\n=== Starting Weekly Sync (Sets + Cards) ===');

  let newSets = 0, newCards = 0, errors: string[] = [];

  try {
    const setsResult = await syncSets();
    newSets = setsResult.newSets;
  } catch (err) {
    errors.push(`Job 1 (syncSets) failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  Job 1 failed:', err);
  }

  try {
    const cardsResult = await syncCards();
    newCards = cardsResult.newCards;
  } catch (err) {
    errors.push(`Job 2 (syncCards) failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  Job 2 failed:', err);
  }

  const duration = Date.now() - startTime;

  await prisma.syncLog.create({
    data: {
      newSets,
      updatedSets: 0,
      newCards,
      updatedCards: 0,
      updatedPrices: 0,
      triggeredAlerts: 0,
      errors: errors.length > 0 ? errors.join('; ') : null,
      duration
    }
  });

  console.log(`=== Weekly Sync Complete (${duration}ms) ===\n`);
}

export async function runNightlySync(): Promise<void> {
  const startTime = Date.now();
  let errors: string[] = [];
  
  console.log('\n=== Starting Nightly Sync (Prices only) ===');

  let updatedPrices = 0, triggeredAlerts = 0;

  try {
    const pricesResult = await syncPrices();
    updatedPrices = pricesResult.updatedPrices;
    triggeredAlerts = pricesResult.triggeredAlerts;
  } catch (err) {
    errors.push(`Job 3 (syncPrices) failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  Job 3 failed:', err);
  }

  const duration = Date.now() - startTime;

  await prisma.syncLog.create({
    data: {
      newSets: 0,
      updatedSets: 0,
      newCards: 0,
      updatedCards: 0,
      updatedPrices,
      triggeredAlerts,
      errors: errors.length > 0 ? errors.join('; ') : null,
      duration
    }
  });

  console.log(`=== Nightly Sync Complete (${duration}ms) ===\n`);
}

let nightlyJob: cron.ScheduledTask | null = null;
let weeklyJob: cron.ScheduledTask | null = null;

export function startNightlySync(): void {
  nightlyJob = cron.schedule('0 2 * * *', runNightlySync);
  console.log('Nightly price sync scheduled for 2:00 AM');
}

export function startWeeklySync(): void {
  weeklyJob = cron.schedule('0 3 * * 0', runWeeklySync);
  console.log('Weekly set/card sync scheduled for Sunday 3:00 AM');
}

export function stopNightlySync(): void {
  if (nightlyJob) {
    nightlyJob.stop();
    nightlyJob = null;
  }
}

export function stopWeeklySync(): void {
  if (weeklyJob) {
    weeklyJob.stop();
    weeklyJob = null;
  }
}
