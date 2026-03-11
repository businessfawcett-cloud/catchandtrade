import { prisma } from '@catchandtrade/db';
import * as cron from 'node-cron';
import EbayPriceFetcher, { BudgetTracker } from '../services/pricing/ebay';

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

// ── Price Sync (rewritten: two-tiered eBay engine) ──────────────────────

const ebayFetcher = new EbayPriceFetcher();
const budgetTracker = new BudgetTracker();

async function runBulkPass(): Promise<{ updatedPrices: number; errorCount: number }> {
  console.log('  Tier 1: Bulk Discovery Pass — searching by set name');
  let updatedPrices = 0;
  let errorCount = 0;

  const sets = await prisma.pokemonSet.findMany({
    include: {
      cards: {
        select: { id: true, cardNumber: true }
      }
    }
  });

  for (const set of sets) {
    if (!budgetTracker.canMakeCall()) {
      console.log(`  Bulk pass stopping — budget low (${budgetTracker.getRemainingBudget()} remaining)`);
      break;
    }

    try {
      const listings = await ebayFetcher.searchBySet(set.name);
      budgetTracker.recordCall();

      const matched = ebayFetcher.matchListingsToCards(listings, set.cards);
      let setUpdated = 0;

      const now = new Date();
      for (const [cardId, cardListings] of matched.entries()) {
        try {
          const calculated = ebayFetcher.calculatePrices(cardListings);

          // Skip if no eBay data found - preserve existing price
          if (calculated.priceMarket === null) {
            continue;
          }

          // Skip outliers - filter out unrealistic prices
          if (calculated.priceMarket < 0.10 || calculated.priceMarket > 10000) {
            console.log(`  Skipping outlier price for card ${cardId}: $${calculated.priceMarket}`);
            continue;
          }

          await prisma.cardPrice.create({
            data: {
              cardId,
              priceLow: calculated.priceLow,
              priceMid: calculated.priceMid,
              priceHigh: calculated.priceHigh,
              priceMarket: calculated.priceMarket,
              ebayBuyNowLow: calculated.ebayBuyNowLow,
              lastUpdated: now,
              isStale: false,
              listingCount: calculated.listingCount,
            }
          });

          await prisma.priceHistory.create({
            data: {
              cardId,
              price: calculated.priceMarket,
              source: 'ebay',
            }
          });

          updatedPrices++;
          setUpdated++;
        } catch (err) {
          errorCount++;
          console.log(`  Error updating price for card ${cardId}: ${(err as Error).message}`);
        }
      }

      console.log(`  Set "${set.name}": ${listings.length} listings → ${setUpdated} cards priced`);
    } catch (err) {
      errorCount++;
      console.log(`  Error searching set "${set.name}": ${(err as Error).message}`);
    }
  }

  console.log(`  Bulk pass complete: ${updatedPrices} cards updated, ${errorCount} errors`);
  return { updatedPrices, errorCount };
}

async function runPrecisionPass(): Promise<{ updatedPrices: number; errorCount: number }> {
  console.log('  Tier 2: Precision Cleanup Pass — targeting stale high-priority cards');
  let updatedPrices = 0;
  let errorCount = 0;

  // Prioritize: portfolio/watchlist membership → highest value → oldest lastUpdated
  const staleCards = await prisma.card.findMany({
    where: {
      prices: {
        some: {
          OR: [
            { isStale: true },
            { lastUpdated: null },
          ]
        }
      }
    },
    include: {
      set: true,
      prices: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      portfolioItems: { take: 1 },
      watchlistItems: { take: 1 },
    },
  });

  // Sort: portfolio/watchlist first, then highest price, then oldest update
  staleCards.sort((a, b) => {
    const aInCollection = (a.portfolioItems.length > 0 || a.watchlistItems.length > 0) ? 1 : 0;
    const bInCollection = (b.portfolioItems.length > 0 || b.watchlistItems.length > 0) ? 1 : 0;
    if (aInCollection !== bInCollection) return bInCollection - aInCollection;

    const aPrice = a.prices[0]?.priceMarket ?? 0;
    const bPrice = b.prices[0]?.priceMarket ?? 0;
    if (aPrice !== bPrice) return bPrice - aPrice;

    const aUpdated = a.prices[0]?.lastUpdated?.getTime() ?? 0;
    const bUpdated = b.prices[0]?.lastUpdated?.getTime() ?? 0;
    return aUpdated - bUpdated;
  });

  for (const card of staleCards) {
    if (!budgetTracker.canMakeCall()) {
      console.log(`  Precision pass stopping — budget exhausted (${budgetTracker.getRemainingBudget()} remaining)`);
      break;
    }

    if (!card.set) continue;

    try {
      const listings = await ebayFetcher.searchByCard(card.set.name, card.cardNumber);
      budgetTracker.recordCall();

      const matched = ebayFetcher.matchListingsToCards(
        listings,
        [{ id: card.id, cardNumber: card.cardNumber }]
      );

      const cardListings = matched.get(card.id) || [];
      const calculated = ebayFetcher.calculatePrices(cardListings);

      // Skip if no eBay data found - preserve existing price
      if (calculated.priceMarket === null) {
        continue;
      }

      // Skip outliers - filter out unrealistic prices
      if (calculated.priceMarket < 0.10 || calculated.priceMarket > 10000) {
        continue;
      }

      const now = new Date();

      await prisma.cardPrice.create({
        data: {
          cardId: card.id,
          priceLow: calculated.priceLow,
          priceMid: calculated.priceMid,
          priceHigh: calculated.priceHigh,
          priceMarket: calculated.priceMarket,
          ebayBuyNowLow: calculated.ebayBuyNowLow,
          lastUpdated: now,
          isStale: false,
          listingCount: calculated.listingCount,
        }
      });

      await prisma.priceHistory.create({
        data: {
          cardId: card.id,
          price: calculated.priceMarket,
          source: 'ebay',
        }
      });

      updatedPrices++;
    } catch (err) {
      errorCount++;
      console.log(`  Error in precision pass for card ${card.id}: ${(err as Error).message}`);
    }
  }

  console.log(`  Precision pass complete: ${updatedPrices} cards updated, ${errorCount} errors`);
  return { updatedPrices, errorCount };
}

async function markStaleCards(): Promise<number> {
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);

  // Get the latest CardPrice for each card and mark stale if lastUpdated is old
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
  console.log('Starting Job 3: Sync Prices (eBay two-tiered engine)...');
  const syncStart = Date.now();

  console.log(`  Budget at start: ${budgetTracker.getRemainingBudget()} calls remaining`);

  // Tier 1: Bulk pass
  const bulk = await runBulkPass();
  console.log(`  Budget after bulk pass: ${budgetTracker.getRemainingBudget()} calls remaining`);

  // Tier 2: Precision pass
  const precision = await runPrecisionPass();
  console.log(`  Budget after precision pass: ${budgetTracker.getRemainingBudget()} calls remaining`);

  // Staleness sweep
  const markedStale = await markStaleCards();
  console.log(`  Staleness sweep: ${markedStale} cards marked stale (threshold: ${STALE_THRESHOLD_HOURS}h)`);

  const totalUpdated = bulk.updatedPrices + precision.updatedPrices;
  const totalErrors = bulk.errorCount + precision.errorCount;
  const duration = Date.now() - syncStart;

  console.log(`  Price sync complete in ${duration}ms: ${totalUpdated} updated, ${totalErrors} errors, ${budgetTracker.getRemainingBudget()} budget remaining`);

  return { updatedPrices: totalUpdated };
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
