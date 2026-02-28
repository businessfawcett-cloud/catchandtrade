const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CARDS_FILE = path.join(__dirname, 'cards-export.json');
const IMAGES_DIR = path.join(__dirname, 'card-images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
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
  console.log('Loading cards...');
  const cardsData = fs.readFileSync(CARDS_FILE, 'utf-8');
  const cards = JSON.parse(cardsData);
  
  console.log(`Found ${cards.length} cards`);
  
  let downloaded = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    if (!card.imageUrl) {
      skipped++;
      continue;
    }
    
    // Use pokemontcg.io URL if available, otherwise try current URL
    let imageUrl = card.imageUrl;
    if (imageUrl.includes('scrydex.com')) {
      // Convert scrydex URL to pokemontcg.io format
      const match = imageUrl.match(/images\.scrydex\.com\/pokemon\/(\w+)-(\d+)\/large/);
      if (match) {
        imageUrl = `https://images.pokemontcg.io/${match[1]}/${match[2]}_hires.png`;
      }
    }
    
    if (!imageUrl.includes('pokemontcg.io')) {
      skipped++;
      continue;
    }
    
    const filename = `${card.setCode}-${card.cardNumber}.png`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    const success = await downloadImage(imageUrl, filepath);
    
    if (success) downloaded++;
    else failed++;
    
    // Progress every 100 cards
    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${cards.length} - Downloaded: ${downloaded}, Failed: ${failed}, Skipped: ${skipped}`);
    }
    
    // Rate limit - wait a bit between downloads
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total cards: ${cards.length}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Images saved to: ${IMAGES_DIR}`);
}

main().catch(console.error);
