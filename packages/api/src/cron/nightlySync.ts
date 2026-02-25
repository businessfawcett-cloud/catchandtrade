import { prisma } from '@catchandtrade/db';
import cron from 'node-cron';

const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';
const TCGPLAYER_API_URL = 'https://api.tcgplayer.com/v1.39.0';

interface TCGCardSet {
  id: string;
  name: string;
  images: { logo: string; symbol: string };
  printedTotal: number;
  releaseDate: string;
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
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });
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

export async function syncSets(): Promise<{ newSets: number; updatedSets: number }> {
  console.log('Starting Job 1: Sync Sets...');
  
  let newSets = 0;
  let updatedSets = 0;

  const response = await fetchWithRetry<{ data: TCGCardSet[] }>(`${POKEMON_TCG_API_URL}/sets`);
  if (!response) {
    console.log('  Pokemon TCG API unavailable, skipping set sync');
    return { newSets: 0, updatedSets: 0 };
  }

  for (const tcgSet of response.data) {
    const releaseYear = parseInt(tcgSet.releaseDate.split('-')[0], 10);
    
    const existing = await prisma.pokemonSet.findUnique({
      where: { code: tcgSet.id }
    });

    if (!existing) {
      await prisma.pokemonSet.create({
        data: {
          name: tcgSet.name,
          code: tcgSet.id,
          totalCards: tcgSet.printedTotal,
          releaseYear,
          imageUrl: tcgSet.images.logo,
        },
      });
      newSets++;
    } else if (existing.totalCards !== tcgSet.printedTotal) {
      await prisma.pokemonSet.update({
        where: { code: tcgSet.id },
        data: { totalCards: tcgSet.printedTotal },
      });
      updatedSets++;
    }
  }

  console.log(`  Found ${newSets} new sets, updated ${updatedSets} existing sets`);
  return { newSets, updatedSets };
}

export async function syncCards(): Promise<{ newCards: number; updatedCards: number }> {
  console.log('Starting Job 2: Sync Cards...');
  
  let newCards = 0;
  let updatedCards = 0;

  const sets = await prisma.pokemonSet.findMany();
  console.log(`  Syncing cards for ${sets.length} sets...`);

  for (const set of sets) {
    const response = await fetchWithRetry<{ data: TCGCard[] }>(
      `${POKEMON_TCG_API_URL}/cards?q=set.id:${set.code}&pageSize=250`
    );
    
    if (!response) continue;

    for (const card of response.data) {
      const existing = await prisma.card.findUnique({
        where: { tcgplayerId: card.id }
      });

      if (!existing) {
        await prisma.card.create({
          data: {
            name: card.name,
            setName: card.set.name,
            setCode: set.code,
            cardNumber: card.number,
            rarity: card.rarity,
            imageUrl: card.images.small,
            tcgplayerId: card.id,
            gameType: 'POKEMON',
            language: 'EN',
            setId: set.id,
          },
        });
        newCards++;
      } else {
        const updates: Record<string, any> = {};
        if (existing.imageUrl !== card.images.small) {
          updates.imageUrl = card.images.small;
        }
        if (existing.rarity !== card.rarity) {
          updates.rarity = card.rarity;
        }
        
        if (Object.keys(updates).length > 0) {
          await prisma.card.update({
            where: { id: existing.id },
            data: updates,
          });
          updatedCards++;
        }
      }
    }

    await delay(100);
  }

  console.log(`  Added ${newCards} new cards, updated ${updatedCards} existing cards`);
  return { newCards, updatedCards };
}

export async function syncPrices(): Promise<{ updatedPrices: number; triggeredAlerts: number }> {
  console.log('Starting Job 3: Sync Prices...');
  
  let updatedPrices = 0;
  let triggeredAlerts = 0;

  const cards = await prisma.card.findMany({
    where: { tcgplayerId: { not: null } }
  });

  for (const card of cards) {
    const response = await fetchWithRetry<{ data: TCGCard[] }>(
      `${POKEMON_TCG_API_URL}/cards/${card.tcgplayerId}`
    );
    
    if (!response || !response.data[0]) continue;

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

    await delay(50);
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

export async function runNightlySync(): Promise<void> {
  const startTime = Date.now();
  let errors: string[] = [];
  
  console.log('\n=== Starting Nightly Sync ===');

  let newSets = 0, updatedSets = 0, newCards = 0, updatedCards = 0, updatedPrices = 0, triggeredAlerts = 0;

  try {
    const setsResult = await syncSets();
    newSets = setsResult.newSets;
    updatedSets = setsResult.updatedSets;
  } catch (err) {
    errors.push(`Job 1 (syncSets) failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  Job 1 failed:', err);
  }

  try {
    const cardsResult = await syncCards();
    newCards = cardsResult.newCards;
    updatedCards = cardsResult.updatedCards;
  } catch (err) {
    errors.push(`Job 2 (syncCards) failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  Job 2 failed:', err);
  }

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
      newSets,
      updatedSets,
      newCards,
      updatedCards,
      updatedPrices,
      triggeredAlerts,
      errors: errors.length > 0 ? errors.join('; ') : null,
      duration
    }
  });

  console.log(`=== Nightly Sync Complete (${duration}ms) ===\n`);
}

let cronJob: cron.ScheduledTask | null = null;

export function startNightlySync(): void {
  cronJob = cron.schedule('0 2 * * *', runNightlySync);
  console.log('Nightly sync scheduled for 2:00 AM');
}

export function stopNightlySync(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}
