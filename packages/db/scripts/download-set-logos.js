const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CARDS_FILE = path.join(__dirname, '..', 'cards-export.json');
const SET_LOGOS_DIR = path.join(__dirname, '..', 'set-logos');

if (!fs.existsSync(SET_LOGOS_DIR)) {
  fs.mkdirSync(SET_LOGOS_DIR, { recursive: true });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      resolve(res);
    }).on('error', reject);
  });
}

async function downloadImage(url, filepath) {
  if (fs.existsSync(filepath)) {
    console.log(`  Already exists: ${path.basename(filepath)}`);
    return true;
  }
  
  try {
    const res = await httpGet(url);
    const writeStream = fs.createWriteStream(filepath);
    
    return new Promise((resolve, reject) => {
      res.pipe(writeStream);
      writeStream.on('finish', () => {
        writeStream.close();
        console.log(`  Downloaded: ${path.basename(filepath)}`);
        resolve(true);
      });
      writeStream.on('error', reject);
    });
  } catch (err) {
    console.log(`  Failed: ${url} - ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Loading cards to get unique sets...');
  const cardsData = fs.readFileSync(CARDS_FILE, 'utf-8');
  const cards = JSON.parse(cardsData);
  
  // Get unique sets
  const sets = {};
  for (const card of cards) {
    if (card.setCode && card.setName) {
      sets[card.setCode] = card.setName;
    }
  }
  
  console.log(`Found ${Object.keys(sets).length} unique sets`);
  
  let downloaded = 0;
  let failed = 0;
  let skipped = 0;
  
  const setCodes = Object.keys(sets);
  
  for (let i = 0; i < setCodes.length; i++) {
    const setCode = setCodes[i];
    
    // Download logo from pokemontcg.io
    const logoUrl = `https://images.pokemontcg.io/${setCode}/logo.png`;
    const filename = `${setCode}.png`;
    const filepath = path.join(SET_LOGOS_DIR, filename);
    
    const success = await downloadImage(logoUrl, filepath);
    
    if (success) downloaded++;
    else if (!filepath.includes('Already')) failed++;
    else skipped++;
    
    // Progress every 20 sets
    if ((i + 1) % 20 === 0) {
      console.log(`Progress: ${i + 1}/${setCodes.length} - Downloaded: ${downloaded}, Failed: ${failed}`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total sets: ${setCodes.length}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Logos saved to: ${SET_LOGOS_DIR}`);
}

main().catch(console.error);
