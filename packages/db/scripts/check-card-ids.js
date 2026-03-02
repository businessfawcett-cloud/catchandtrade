const { PrismaClient } = require('@prisma/client');

const devPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5435/catchandtrade_dev' } }
});

const prodPrisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://catchandtrade_db_user:m7keZTdb7OpVm5vAaaf9ue6GvkhC0QrA@dpg-d6gge4p4tr6s73b81asg-a.oregon-postgres.render.com/catchandtrade_db' } }
});

async function checkIds() {
  // Check a specific card ID
  const devCard = await devPrisma.card.findFirst({
    where: { name: { contains: 'Espeon ★' } }
  });
  
  console.log('Dev card:', devCard?.id, devCard?.name);
  
  const prodCard = await prodPrisma.card.findFirst({
    where: { name: { contains: 'Espeon ★' } }
  });
  
  console.log('Prod card:', prodCard?.id, prodCard?.name);
  
  // Try to insert a test price
  if (devCard && prodCard) {
    console.log('\nDev card ID:', devCard.id);
    console.log('Prod card ID:', prodCard.id);
    console.log('Same ID?', devCard.id === prodCard.id);
  }
  
  await devPrisma.$disconnect();
  await prodPrisma.$disconnect();
}

checkIds().catch(console.error);
