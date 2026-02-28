const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function updateImageUrls() {
  console.log('Fetching all cards...');
  const cards = await prisma.card.findMany({
    select: { id: true, imageUrl: true, setCode: true, cardNumber: true }
  });
  
  console.log(`Found ${cards.length} cards`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const card of cards) {
    if (!card.imageUrl) {
      skipped++;
      continue;
    }
    
    // Convert scrydex URL to pokemontcg.io format
    if (card.imageUrl.includes('scrydex.com')) {
      const match = card.imageUrl.match(/images\.scrydex\.com\/pokemon\/(\w+)-(\d+)\/large/);
      if (match && card.setCode && card.cardNumber) {
        const newUrl = `https://images.pokemontcg.io/${match[1]}/${match[2]}_hires.png`;
        await prisma.card.update({
          where: { id: card.id },
          data: { imageUrl: newUrl }
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      skipped++;
    }
    
    if (updated % 500 === 0) {
      console.log(`Updated ${updated} URLs...`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  
  await prisma.$disconnect();
}

updateImageUrls().catch(console.error);
