const https = require('https');
const fs = require('fs');
const path = require('path');

const PRICES_API = 'https://graphql.tcgplayer.com/';
const PAGE_SIZE = 250;
const DELAY_MS = 1000;

const PROGRESS_FILE = path.join(__dirname, 'price-progress.json');

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {}
  return { page: 1, updated: 0, errors: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.tcgplayer.com',
        'Referer': 'https://www.tcgplayer.com/'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`JSON parse failed: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function testEndpoints() {
  console.log('Testing TCGPlayer endpoints...\n');
  
  const endpoints = [
    {
      name: 'GraphQL',
      url: PRICES_API,
      query: {
        query: `{ search(term: "charizard", filters: {categoryId: 3}, limit: 3) { results { productId name pricing { marketPrice } } } }`
      }
    },
    {
      name: 'Search API',
      url: 'https://mp.tcgplayer.com/api/search/request',
      query: { q: 'charizard', gameName: 'pokemon', pageSize: 3 }
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    try {
      const result = await postJSON(endpoint.url, endpoint.query);
      console.log(`  ✅ ${endpoint.name} works! Response:`, JSON.stringify(result).substring(0, 200));
      return endpoint;
    } catch (e) {
      console.log(`  ❌ ${endpoint.name} failed: ${e.message}`);
    }
  }
  
  return null;
}

async function scrapePrices({ PrismaClient }) {
  const prisma = new PrismaClient();
  const progress = loadProgress();
  
  console.log('Price scraper for TCGPlayer\n');
  console.log('Progress:', progress);
  console.log('');
  
  const endpoint = await testEndpoints();
  
  if (!endpoint) {
    console.log('\n❌ No working endpoints found. Try running from your local machine.');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\nUsing ${endpoint.name} endpoint\n`);
  
  const args = process.argv.slice(2);
  let maxCards = 100;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cards' && args[i + 1]) {
      maxCards = parseInt(args[i + 1], 10);
    }
  }
  
  console.log(`Fetching up to ${maxCards} cards...\n`);
  
  const cards = await prisma.card.findMany({
    take: maxCards,
    skip: (progress.page - 1) * 100,
    select: { id: true, name: true, setCode: true, currentPrice: true }
  });
  
  console.log(`Processing ${cards.length} cards starting from card #${(progress.page - 1) * 100 + 1}\n`);
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const queryName = `${card.name} ${card.setCode}`.substring(0, 100);
    
    try {
      const query = endpoint.name === 'GraphQL'
        ? { query: `{ search(term: "${queryName}", filters: {categoryId: 3}, limit: 1) { results { productId name pricing { marketPrice } } } }` }
        : { q: queryName, gameName: 'pokemon', pageSize: 1 };
      
      const result = await postJSON(endpoint.url, query);
      
      let price = null;
      
      if (endpoint.name === 'GraphQL' && result.data?.search?.results?.length > 0) {
        const first = result.data.search.results[0];
        price = first.pricing?.marketPrice;
      }
      
      if (price && price > 0) {
        await prisma.card.update({
          where: { id: card.id },
          data: { currentPrice: price }
        });
        progress.updated++;
        console.log(`  [${i + 1}/${cards.length}] ✅ ${card.name}: $${price.toFixed(2)}`);
      } else {
        console.log(`  [${i + 1}/${cards.length}] ⚠️ ${card.name}: No price found`);
      }
      
    } catch (e) {
      progress.errors.push({ card: card.name, error: e.message });
      console.log(`  [${i + 1}/${cards.length}] ❌ ${card.name}: ${e.message}`);
    }
    
    if (i < cards.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
    
    if ((i + 1) % 10 === 0) {
      progress.page = Math.floor(i / 100) + 1;
      saveProgress(progress);
    }
  }
  
  console.log(`\n✅ Done! Updated ${progress.updated} prices`);
  console.log(`Errors: ${progress.errors.length}`);
  
  saveProgress(progress);
  
  await prisma.$disconnect();
}

module.exports = { scrapePrices };

if (require.main === module) {
  scrapePrices({ PrismaClient: require('@prisma/client').PrismaClient })
    .catch(console.error);
}
