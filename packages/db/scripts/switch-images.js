const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db'
    }
  }
});

async function switchToPokemontcg() {
  console.log('Switching to pokemontcg.io...');
  await prisma.$executeRaw`UPDATE "Card" SET "imageUrl" = REPLACE("imageUrl", 'images.scrydex.com/pokemon', 'images.pokemontcg.io') WHERE "imageUrl" LIKE '%scrydex%'`;
  console.log('Done!');
  await prisma.$disconnect();
}

switchToPokemontcg().catch(console.error);
