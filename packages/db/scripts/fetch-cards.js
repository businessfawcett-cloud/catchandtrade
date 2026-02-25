const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, 'cards-data.json');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching sets from GitHub...');
  const sets = await fetchJSON('https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json');
  console.log(`Found ${sets.length} sets\n`);
  
  const allCards = {};
  
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    console.log(`[${i + 1}/${sets.length}] Fetching cards for ${set.name} (${set.id})...`);
    
    try {
      const cards = await fetchJSON(
        `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${set.id}.json`
      );
      allCards[set.id] = cards.map(card => ({
        id: card.id,
        name: card.name,
        setName: set.name,
        setCode: set.id,
        number: card.number,
        rarity: card.rarity,
        images: card.images,
        language: 'EN'
      }));
      console.log(`  -> Found ${cards.length} cards`);
    } catch (e) {
      console.log(`  -> No cards found (${e.message})`);
      allCards[set.id] = [];
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  const output = {
    sets: sets.map(s => ({
      id: s.id,
      name: s.name,
      code: s.id,
      series: s.series,
      totalCards: s.total,
      releaseYear: new Date(s.releaseDate).getFullYear(),
      imageUrl: s.images?.symbol || null
    })),
    cards: allCards
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${OUTPUT_FILE}`);
  
  // Summary
  let totalCards = 0;
  for (const setId of Object.keys(allCards)) {
    totalCards += allCards[setId].length;
  }
  console.log(`Total: ${sets.length} sets, ${totalCards} cards`);
}

main().catch(console.error);
