const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const POKEMON_TCG_API = 'https://api.pokemontcg.io/v2/cards';
const API_KEY = 'a3751a33-9ed6-4662-9ae3-870939002fcc';
const PAGE_SIZE = 250;
const DELAY_MS = 1000;
const TIMEOUT_MS = 5000;

async function checkApiReachable() {
  const https = require('https');
  
  return new Promise((resolve) => {
    const req = https.get(`${POKEMON_TCG_API}?pageSize=1&page=1`, { 
      headers: { 'X-Api-Key': API_KEY },
      timeout: TIMEOUT_MS
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          JSON.parse(data);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      });
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function fetchPage(page) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const url = `${POKEMON_TCG_API}?pageSize=${PAGE_SIZE}&page=${page}`;
    const req = https.get(url, { 
      headers: { 'X-Api-Key': API_KEY },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractBestPrice(card) {
  const tcg = card.tcgplayer && card.tcgplayer.prices ? card.tcgplayer.prices : {};
  const cm = card.cardmarket && card.cardmarket.prices ? card.cardmarket.prices : {};
  
  if (tcg.holofoil && tcg.holofoil.market && tcg.holofoil.market > 0) return tcg.holofoil.market;
  if (tcg.normal && tcg.normal.market && tcg.normal.market > 0) return tcg.normal.market;
  if (tcg.unlimitedHolofoil && tcg.unlimitedHolofoil.market && tcg.unlimitedHolofoil.market > 0) return tcg.unlimitedHolofoil.market;
  if (cm.averageSellPrice && cm.averageSellPrice > 0) return cm.averageSellPrice;
  
  return null;
}

async function syncPricesForPage(page, totalPages) {
  console.log(`Syncing page ${page}/${totalPages}...`);
  
  const data = await fetchPage(page);
  const cards = data.data || [];
  let updated = 0;
  const samples = [];

  for (const apiCard of cards) {
    const price = extractBestPrice(apiCard);
    
    if (price && apiCard.id) {
      const existingCard = await prisma.card.findFirst({
        where: { tcgplayerId: apiCard.id }
      });
      
      if (existingCard) {
        const oldPrice = existingCard.currentPrice;
        await prisma.card.update({
          where: { id: existingCard.id },
          data: { currentPrice: price }
        });
        
        updated++;
        
        if (samples.length < 5 && oldPrice !== price) {
          samples.push({ name: existingCard.name, set: existingCard.setCode, oldPrice, newPrice: price });
        }
      }
    }
  }

  console.log(`  -> Updated ${updated} prices`);
  
  if (samples.length > 0) {
    console.log('  Sample updates:');
    for (const s of samples) {
      console.log(`    ${s.name} (${s.set}): $${s.oldPrice || 'null'} -> $${s.newPrice.toFixed(2)}`);
    }
  }

  return updated;
}

async function main() {
  console.log('Checking if Pokemon TCG API is reachable...\n');
  
  const isReachable = await checkApiReachable();
  
  if (!isReachable) {
    console.log('API unavailable, will retry');
    console.log('Run "npm run sync-prices" manually when the API is available.');
    await prisma.$disconnect();
    process.exit(0);
  }
  
  console.log('API is reachable!\n');

  const args = process.argv.slice(2);
  let maxPages = 1;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pages' && args[i + 1]) {
      maxPages = parseInt(args[i + 1], 10);
    }
  }

  console.log(`Starting price sync for ${maxPages} page(s)...\n`);

  let totalUpdated = 0;
  
  let firstPage;
  try {
    firstPage = await fetchPage(1);
  } catch (e) {
    console.log(`Error fetching first page: ${e.message}`);
    console.log('API unavailable, will retry');
    await prisma.$disconnect();
    process.exit(0);
  }
  
  const totalCards = firstPage.totalCount || 0;
  const totalPagesNeeded = Math.ceil(totalCards / PAGE_SIZE);
  const pagesToSync = Math.min(maxPages, totalPagesNeeded);

  console.log(`Total cards in API: ${totalCards}, Pages: ${totalPagesNeeded}\n`);

  for (let page = 1; page <= pagesToSync; page++) {
    try {
      const updated = await syncPricesForPage(page, pagesToSync);
      totalUpdated += updated;
    } catch (e) {
      console.log(`  Error on page ${page}: ${e.message}`);
      console.log('API became unavailable, stopping here.');
      break;
    }
    
    if (page < pagesToSync) {
      await delay(DELAY_MS);
    }
  }

  console.log(`\nDone! Total prices updated: ${totalUpdated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
