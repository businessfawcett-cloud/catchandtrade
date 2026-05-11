import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('Connected');
    
    const cards = await prisma.card.findMany({ take: 5 });
    console.log('Cards:', JSON.stringify(cards, null, 2));
    
    await prisma.$disconnect();
    console.log('Done');
  } catch (e) {
    console.error('Error:', e.message);
    await prisma.$disconnect();
  }
}

test();