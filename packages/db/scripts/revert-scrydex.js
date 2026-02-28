const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function revertToScrydex() {
  console.log('Running raw SQL to update URLs...');
  
  // Update URLs using SQL directly - much faster
  await prisma.$executeRaw`
    UPDATE "Card" 
    SET "imageUrl" = REPLACE("imageUrl", 'images.pokemontcg.io', 'images.scrydex.com/pokemon')
    WHERE "imageUrl" LIKE '%pokemontcg.io%'
  `;
  
  console.log('Done!');
  
  await prisma.$disconnect();
}

revertToScrydex().catch(console.error);
