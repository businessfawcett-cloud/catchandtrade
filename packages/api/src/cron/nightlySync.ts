import { prisma } from '@catchandtrade/db';
import * as cron from 'node-cron';

const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';
const GITHUB_SETS_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json';

const STALE_THRESHOLD_HOURS = parseInt(process.env.STALE_THRESHOLD_HOURS || '48', 10);

interface GithubSet {
  id: string;
  name: string;
  total: number;
  printedTotal: number;
  releaseDate: string;
  images: { symbol: string; logo: string };
}

interface TCGCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  images: { small: string; large: string };
  set: { id: string; name: string };
}

// ── TCGdex API (Japanese cards + pricing) ────────────────────────────────
const TCGDEX_BASE = 'https://api.tcgdex.net/v2';

interface TCGdexSetBrief {
  id: string;
  name: string;
  cardCount?: { total: number; official: number };
}

interface TCGdexSetDetail {
  id: string;
  name: string;
  serie: string;
  releaseDate?: string;
  cardCount: { total: number; official: number };
  logo?: string;
  cards: Array<{ id: string; localId: string; name: string; image?: string }>;
}

interface TCGdexCardDetail {
  id: string;
  name: string;
  rarity?: string;
  category?: string;
  image?: string;
  set: { id: string; name: string };
  tcgplayer?: Record<string, { low?: number; mid?: number; high?: number; market?: number; directLow?: number }>;
  cardmarket?: { averageSellPrice?: number; lowPrice?: number; trendPrice?: number; avg1?: number; avg7?: number; avg30?: number };
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

// ── Set Sync (unchanged — fetches from GitHub/PokemonTCG data) ──────────

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
    const releaseYear = parseInt(tcgSet.releaseDate.split('-')[0], 10);
    const logoUrl = `https://images.pokemontcg.io/${tcgSet.id}/logo.png`;

    if (existingCodes.has(tcgSet.id)) {
      // Update printedTotal for existing sets that don't have it yet
      await prisma.pokemonSet.update({
        where: { code: tcgSet.id },
        data: { printedTotal: tcgSet.printedTotal || tcgSet.total },
      });
      continue;
    }

    await prisma.pokemonSet.create({
      data: {
        name: tcgSet.name,
        code: tcgSet.id,
        totalCards: tcgSet.total,
        printedTotal: tcgSet.printedTotal || tcgSet.total,
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

// ── Card Sync (updated: pokemonTcgId) ───────────────────────────────────

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
      select: { pokemonTcgId: true }
    });
    const existingIds = new Set(existingCards.map(c => c.pokemonTcgId));

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
          pokemonTcgId: card.id,
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

// ── Japanese Card Sync (TCGdex) ──────────────────────────────────────────

export async function syncJPSets(): Promise<{ newSets: number }> {
  console.log('Starting JP Set Sync from TCGdex...');
  let newSets = 0;

  const sets = await fetchWithRetry<TCGdexSetBrief[]>(`${TCGDEX_BASE}/ja/sets`);
  if (!sets) {
    console.log('  TCGdex JP sets unavailable, skipping');
    return { newSets: 0 };
  }

  const existingSets = await prisma.pokemonSet.findMany({ select: { code: true } });
  const existingCodes = new Set(existingSets.map(s => s.code));

  for (const set of sets) {
    if (existingCodes.has(set.id)) continue;

    // Fetch full set detail for release date and card count
    const detail = await fetchWithRetry<TCGdexSetDetail>(`${TCGDEX_BASE}/ja/sets/${set.id}`);
    if (!detail) continue;

    const releaseYear = detail.releaseDate
      ? parseInt(detail.releaseDate.split('/')[0] || detail.releaseDate.split('-')[0], 10)
      : 2020;

    await prisma.pokemonSet.create({
      data: {
        name: detail.name,
        code: detail.id,
        totalCards: detail.cardCount.total,
        printedTotal: detail.cardCount.official,
        releaseYear: isNaN(releaseYear) ? 2020 : releaseYear,
        imageUrl: detail.logo || null,
        language: 'JA',
      },
    });
    newSets++;
    console.log(`  Added JP set: ${detail.name} (${detail.id})`);
    await delay(300);
  }

  console.log(`  Found ${newSets} new JP sets`);
  return { newSets };
}

export async function syncJPCards(): Promise<{ newCards: number }> {
  console.log('Starting JP Card Sync from TCGdex...');
  let newCards = 0;

  const sets = await prisma.pokemonSet.findMany({ where: { language: 'JA' } });
  console.log(`  Checking ${sets.length} JP sets for new cards...`);

  for (const set of sets) {
    const detail = await fetchWithRetry<TCGdexSetDetail>(`${TCGDEX_BASE}/ja/sets/${set.code}`);
    if (!detail || !detail.cards) continue;

    const existingCards = await prisma.card.findMany({
      where: { setCode: set.code },
      select: { pokemonTcgId: true },
    });
    const existingIds = new Set(existingCards.map(c => c.pokemonTcgId));

    for (const card of detail.cards) {
      const pokemonTcgId = `ja-${card.id}`;
      if (existingIds.has(pokemonTcgId)) continue;

      const cardNumber = card.localId || card.id.split('-').pop() || '';
      const imageUrl = card.image ? `${card.image}/high.webp` : null;

      await prisma.card.create({
        data: {
          name: card.name,
          setName: set.name,
          setCode: set.code,
          cardNumber,
          pokemonTcgId,
          imageUrl,
          gameType: 'POKEMON',
          language: 'JA',
          setId: set.id,
        },
      });
      newCards++;
    }

    await delay(300);
  }

  console.log(`  Found ${newCards} new JP cards`);
  return { newCards };
}

// ── Price Sync (TCGdex — replaces eBay) ──────────────────────────────────

async function syncTCGdexPricesForCards(cards: Array<{ id: string; pokemonTcgId: string | null; language: string }>) {
  let updatedPrices = 0;
  let errorCount = 0;
  const now = new Date();

  for (const card of cards) {
    if (!card.pokemonTcgId) continue;

    // Map pokemonTcgId to TCGdex API card ID
    const lang = card.language === 'JA' ? 'ja' : 'en';
    const tcgdexId = card.language === 'JA'
      ? card.pokemonTcgId.replace(/^ja-/, '')  // "ja-S1a-1" → "S1a-1"
      : card.pokemonTcgId;                      // "xy6-38" as-is

    const detail = await fetchWithRetry<TCGdexCardDetail>(`${TCGDEX_BASE}/${lang}/cards/${tcgdexId}`);
    if (!detail) {
      await delay(200);
      continue;
    }

    try {
      // TCGPlayer pricing (USD) - note: API returns pricing under detail.pricing.tcgplayer
      const tcgplayerPricing = (detail as any).pricing?.tcgplayer;
      if (tcgplayerPricing) {
        for (const [variant, prices] of Object.entries(tcgplayerPricing)) {
          if (!prices || (!prices.market && !prices.mid)) continue;

          await prisma.cardPrice.create({
            data: {
              cardId: card.id,
              priceLow: prices.lowPrice ?? null,
              priceMid: prices.midPrice ?? null,
              priceHigh: prices.highPrice ?? null,
              priceMarket: prices.marketPrice ?? prices.midPrice ?? null,
              variant,
              lastUpdated: now,
              isStale: false,
              listingCount: 0,
            },
          });
        }

        // Use first variant's market price for price history
        const firstVariant = Object.values(tcgplayerPricing)[0] as any;
        const marketPrice = firstVariant?.marketPrice ?? firstVariant?.midPrice;
        if (marketPrice) {
          await prisma.priceHistory.create({
            data: { cardId: card.id, price: marketPrice, source: 'tcgplayer' },
          });
        }

        updatedPrices++;
      }
    } catch (err) {
      errorCount++;
      console.log(`  Error pricing card ${card.pokemonTcgId}: ${(err as Error).message}`);
    }

    await delay(200);
  }

  return { updatedPrices, errorCount };
}

async function markStaleCards(): Promise<number> {
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);

  const result = await prisma.$executeRaw`
    UPDATE "CardPrice" cp
    SET "isStale" = true
    FROM (
      SELECT DISTINCT ON ("cardId") id
      FROM "CardPrice"
      ORDER BY "cardId", "date" DESC
    ) latest
    WHERE cp.id = latest.id
      AND (cp."lastUpdated" IS NULL OR cp."lastUpdated" < ${staleThreshold})
      AND cp."isStale" = false
  `;

  return result;
}

export async function syncPrices(): Promise<{ updatedPrices: number }> {
  console.log('Starting Job 3: Sync Prices (TCGdex)...');
  const syncStart = Date.now();

  // Get cards to update - prioritize cards with no prices or stale prices
  // Then take remaining cards to populate more price history
  const cardsNeedingPrices = await prisma.card.findMany({
    where: {
      pokemonTcgId: { not: null },
    },
    select: { id: true, pokemonTcgId: true, language: true },
    take: 2000, // Increased batch size to process more cards
    orderBy: { id: 'asc' },
  });

  console.log(`  Processing ${cardsNeedingPrices.length} cards for price history`);

  const result = await syncTCGdexPricesForCards(cardsNeedingPrices);

  // Staleness sweep
  const markedStale = await markStaleCards();
  console.log(`  Staleness sweep: ${markedStale} cards marked stale (threshold: ${STALE_THRESHOLD_HOURS}h)`);

  const duration = Date.now() - syncStart;
  console.log(`  Price sync complete in ${duration}ms: ${result.updatedPrices} updated, ${result.errorCount} errors`);

  return { updatedPrices: result.updatedPrices };
}

// ── Weekly/Nightly Orchestration ────────────────────────────────────────

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

  // JP sync from TCGdex (independent — failures don't affect EN)
  try {
    const jpSetsResult = await syncJPSets();
    newSets += jpSetsResult.newSets;
  } catch (err) {
    errors.push(`JP syncSets failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  JP syncSets failed:', err);
  }

  try {
    const jpCardsResult = await syncJPCards();
    newCards += jpCardsResult.newCards;
  } catch (err) {
    errors.push(`JP syncCards failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    console.error('  JP syncCards failed:', err);
  }

  const duration = Date.now() - startTime;

  await prisma.syncLog.create({
    data: {
      newSets,
      updatedSets: 0,
      newCards,
      updatedCards: 0,
      updatedPrices: 0,
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

  let updatedPrices = 0;

  try {
    const pricesResult = await syncPrices();
    updatedPrices = pricesResult.updatedPrices;
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
