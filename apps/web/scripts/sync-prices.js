const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

const POKEMON_TCG_API_KEY = 'a3751a33-9ed6-4662-9ae3-870939002fcc';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

const supabase = createClient(supabaseUrl, supabaseKey);

// Popular card IDs to fetch prices for
const POPULAR_CARDS = [
  { name: 'Charizard', setcode: 'base1', cardnumber: '4' },
  { name: 'Pikachu', setcode: 'base1', cardnumber: '58' },
  { name: 'Blastoise', setcode: 'base1', cardnumber: '9' },
  { name: 'Venusaur', setcode: 'base1', cardnumber: '15' },
  { name: 'Mewtwo', setcode: 'base1', cardnumber: '10' },
  { name: 'Dragonite', setcode: 'base1', cardnumber: '5' },
  { name: 'Gyarados', setcode: 'base1', cardnumber: '6' },
  { name: 'Alakazam', setcode: 'base1', cardnumber: '1' },
];

async function fetchPricesForPopularCards() {
  console.log('Fetching prices for popular cards...');
  
  let count = 0;
  
  for (const card of POPULAR_CARDS) {
    try {
      // Search for the card
      const searchQuery = `name:${card.name} set.code:${card.setcode}`;
      const response = await fetch(
        `${POKEMON_TCG_API_URL}/cards?q=${encodeURIComponent(searchQuery)}&select=id,name,set&limit=1`,
        { headers: { 'X-Api-Key': POKEMON_TCG_API_KEY } }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const tcgCard = data.data[0];
          console.log(`Found: ${tcgCard.name} (${tcgCard.id})`);
          
          // Now fetch prices
          const priceResponse = await fetch(
            `${POKEMON_TCG_API_URL}/cards/${tcgCard.id}`,
            { headers: { 'X-Api-Key': POKEMON_TCG_API_KEY } }
          );
          
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            const tcgCardData = priceData.data?.[0];
            
            if (tcgCardData?.tcgplayer?.prices) {
              const prices = tcgCardData.tcgplayer.prices;
              const normalPrice = prices.normal?.[0] || prices.holofoil?.[0] || {};
              
              if (normalPrice.market || normalPrice.median) {
                const price = normalPrice.market || normalPrice.median;
                console.log(`  Price: $${price}`);
                
                count++;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`Done! Processed ${count} cards with prices.`);
}

fetchPricesForPopularCards()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
