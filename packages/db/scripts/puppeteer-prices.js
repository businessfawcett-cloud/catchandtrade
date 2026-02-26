const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PROGRESS_FILE = path.join(__dirname, 'price-progress.json');
const PARALLEL_TABS = 5;
const DELAY_MS = 1000;
const SAVE_EVERY = 50;

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {}
  return { lastCardIndex: 0, updated: 0, errors: [], failedCards: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

const setNameMap = {
  'base1': 'Base Set',
  'base2': 'Jungle',
  'base3': 'Fossil',
  'base4': 'Base Set 2',
  'base5': 'Team Rocket',
  'base6': 'Gym Heroes',
  'base7': 'Gym Challenge',
  'base8': 'Neo Genesis',
  'base9': 'Neo Discovery',
  'base10': 'Neo Destiny',
  'base11': 'Legendary Collection',
  'base12': 'Ex Ruby Sapphire',
  'base13': 'Ex Sandstorm',
  'base14': 'Ex Dragon',
  'base15': 'Ex Team Magma vs Team Aqua',
  'base16': 'Ex Hidden Legends',
  'base17': 'Ex Fire Red Leaf Green',
  'base18': 'Ex Unseen Forces',
  'base19': 'Ex Delta Species',
  'base20': 'Ex Legend Maker',
  'xy1': 'XY Base Set',
  'xy2': 'Flashfire',
  'xy3': 'Furious Fists',
  'xy4': 'Phantom Forces',
  'xy5': 'Primal Clash',
  'xy6': 'Ancient Origins',
  'xy7': 'Breakthrough',
  'xy8': 'Breakpoint',
  'xy9': 'Generations',
  'xy10': 'Fates Collide',
  'xy11': 'Steam Siege',
  'xy12': 'Evolutions',
  'sm1': 'Sun Moon Base Set',
  'sm2': 'Guardians Rising',
  'sm3': 'Burning Shadows',
  'sm4': 'Crimson Invasion',
  'sm5': 'Ultra Prism',
  'sm6': 'Forbidden Light',
  'sm7': 'Celestial Storm',
  'sm8': 'Lost Thunder',
  'sm9': 'Team Up',
  'sm10': 'Unbroken Bonds',
  'sm11': 'Unified Minds',
  'sm12': 'Cosmic Eclipse',
  'swsh1': 'Sword Shield Base Set',
  'swsh2': 'Rebel Clash',
  'swsh3': 'Darkness Ablaze',
  'swsh4': 'Vivid Voltage',
  'swsh5': 'Battle Styles',
  'swsh6': 'Chilling Reign',
  'swsh7': 'Evolving Skies',
  'swsh8': 'Fusion Strike',
  'swsh9': 'Brilliant Stars',
  'swsh10': 'Astral Radiance',
  'swsh11': 'Lost Origin',
  'swsh12': 'Silver Tempest',
  'sv1': 'Scarlet Violet Base Set',
  'sv2': 'Obsidian Flames',
  'sv3': 'Paldea Evolved',
  'sv4': 'Obsidian Flames',
  'sv5': 'Temporal Forces',
  'sv6': 'Prismatic Evolutions'
};

function getSearchQuery(cardName, setCode) {
  const setName = setNameMap[setCode] || '';
  if (setName) {
    return encodeURIComponent(`${cardName} ${setName} pokemon card`);
  }
  return encodeURIComponent(`${cardName} pokemon card`);
}

async function getPriceForCard(page, cardName, setName) {
  const query = getSearchQuery(cardName, setName);
  const url = `https://www.tcgplayer.com/search/pokemon/product?q=${query}&view=grid`;
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const price = await page.evaluate(() => {
    const selectors = [
      '.product-card__market-price--value',
      '.product-card__price .price .value',
      '[data-testid="market-price"]',
      '.price__marketPrice',
      '.product-price .price .value',
      '.inventory__price-with-shipping',
      '.product-price'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || el.innerText;
        const match = text.match(/\$?([\d,]+\.?\d*)/);
        if (match && parseFloat(match[1]) > 0) return parseFloat(match[1].replace(',', ''));
      }
    }
    
    const allText = document.body.innerText;
    const prices = allText.match(/\$[\d,]+\.\d{2}/g);
    if (prices && prices.length > 0) {
      const firstPrice = prices[0].replace('$', '').replace(',', '');
      return parseFloat(firstPrice);
    }
    
    return null;
  });
  
  return price;
}

async function processCard(browser, card, index, progress) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const queryName = `${card.name} ${card.setCode}`.substring(0, 80);
  
  try {
    console.log(`  [${index + 1}] Fetching ${queryName}...`);
    
    const price = await getPriceForCard(page, card.name, card.setCode);
    
    if (price && price > 0) {
      await prisma.cardPrice.create({
        data: {
          cardId: card.id,
          tcgplayerMarket: price,
          date: new Date()
        }
      });
      progress.updated++;
      console.log(`       ✅ $${price.toFixed(2)}`);
    } else {
      console.log(`       ⚠️ No price found`);
    }
    
  } catch (e) {
    progress.errors.push({ card: card.name, error: e.message });
    progress.failedCards.push({ name: card.name, set: card.setCode });
    console.log(`       ❌ ${e.message}`);
  }
  
  await page.close();
}

async function processParallel(browser, cards, startIndex, progress) {
  const batches = [];
  for (let i = 0; i < cards.length; i += PARALLEL_TABS) {
    batches.push(cards.slice(i, i + PARALLEL_TABS));
  }
  
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`\nBatch ${batchIdx + 1}/${batches.length} (${batch.length} cards)...`);
    
    await Promise.all(
      batch.map((card, i) => processCard(browser, card, startIndex + batchIdx * PARALLEL_TABS + i, progress))
    );
    
    if (batchIdx < batches.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  let maxCards = 5;
  let fetchAll = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cards' && args[i + 1]) {
      maxCards = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--all') {
      fetchAll = true;
    }
  }
  
  console.log('🔍 TCGPlayer Price Fetcher using Puppeteer\n');
  console.log(`Parallel tabs: ${PARALLEL_TABS}`);
  console.log(`Delay: ${DELAY_MS}ms\n`);
  
  const progress = loadProgress();
  console.log('Resume from card #', progress.lastCardIndex + 1);
  
  let totalCards;
  if (fetchAll) {
    totalCards = await prisma.card.count();
    console.log(`Fetching ALL ${totalCards} cards...\n`);
  } else {
    totalCards = Math.min(maxCards, await prisma.card.count() - progress.lastCardIndex);
    console.log(`Fetching ${totalCards} cards...\n`);
  }
  
  const cards = await prisma.card.findMany({
    take: fetchAll ? totalCards : maxCards,
    skip: progress.lastCardIndex,
    select: {
      id: true,
      name: true,
      setCode: true
    }
  });
  
  if (cards.length === 0) {
    console.log('No more cards to process!');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`Processing ${cards.length} cards...\n`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    let cardIdx = 0;
    while (cardIdx < cards.length) {
      const batchSize = Math.min(PARALLEL_TABS, cards.length - cardIdx);
      await processParallel(browser, cards.slice(cardIdx, cardIdx + batchSize), progress.lastCardIndex + cardIdx, progress);
      cardIdx += batchSize;
      
      if (cardIdx % SAVE_EVERY === 0 || cardIdx >= cards.length) {
        progress.lastCardIndex += cardIdx;
        if (progress.lastCardIndex % SAVE_EVERY === 0) {
          saveProgress(progress);
          console.log(`\n💾 Progress saved (${progress.lastCardIndex} cards processed)\n`);
        }
      }
    }
    
  } catch (e) {
    console.error('Browser error:', e.message);
  } finally {
    if (browser) await browser.close();
  }
  
  saveProgress(progress);
  
  console.log(`\n✅ Done! Updated ${progress.updated} prices`);
  console.log(`Errors: ${progress.errors.length}`);
  
  if (progress.failedCards.length > 0) {
    console.log('\nFailed cards (retry with: npm run fetch-prices)');
    for (const c of progress.failedCards.slice(0, 10)) {
      console.log(`  - ${c.name} (${c.set})`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
