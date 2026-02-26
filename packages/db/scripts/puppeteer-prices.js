const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PROGRESS_FILE = path.join(__dirname, 'price-progress.json');
const BATCH_SIZE = 3;
const DELAY_MS = 2000;

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

async function getPriceForCard(page, cardName, setName) {
  const query = encodeURIComponent(`${cardName} ${setName} pokemon`);
  const url = `https://www.tcgplayer.com/search/pokemon/product?q=${query}&view=grid`;
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
  
  const price = await page.evaluate(() => {
    const selectors = [
      '.product-card__market-price--value',
      '.product-card__price .price .value',
      '[data-testid="market-price"]',
      '.price__marketPrice',
      '.product-price .price .value'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || el.innerText;
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) return parseFloat(match[0].replace(',', ''));
      }
    }
    
    const allPrices = document.querySelectorAll('.price, .product-card__price');
    for (const p of allPrices) {
      const text = p.textContent;
      if (text.includes('$')) {
        const match = text.match(/\$?([\d,]+\.?\d*)/);
        if (match) return parseFloat(match[1].replace(',', ''));
      }
    }
    
    return null;
  });
  
  return price;
}

async function processBatch(browser, cards, startIndex, progress) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const index = startIndex + i;
    const queryName = `${card.name} ${card.setCode}`.substring(0, 80);
    
    try {
      console.log(`  [${index + 1}] Fetching ${queryName}...`);
      
      const price = await getPriceForCard(page, card.name, card.setCode);
      
      if (price && price > 0) {
        await prisma.card.update({
          where: { id: card.id },
          data: { currentPrice: price }
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
    
    if (i < cards.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  await page.close();
}

async function main() {
  const args = process.argv.slice(2);
  let maxCards = 5;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cards' && args[i + 1]) {
      maxCards = parseInt(args[i + 1], 10);
    }
  }
  
  console.log('🔍 TCGPlayer Price Fetcher using Puppeteer\n');
  console.log(`Fetching prices for ${maxCards} cards...\n`);
  
  const progress = loadProgress();
  console.log('Resume from card #', progress.lastCardIndex + 1);
  
  const cards = await prisma.card.findMany({
    take: maxCards,
    skip: progress.lastCardIndex,
    select: { id: true, name: true, setCode: true, currentPrice: true }
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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    await processBatch(browser, cards, progress.lastCardIndex, progress);
    
  } catch (e) {
    console.error('Browser error:', e.message);
  } finally {
    if (browser) await browser.close();
  }
  
  progress.lastCardIndex += cards.length;
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
