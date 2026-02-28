const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

p.card.count().then(c => {
  console.log('Cards in production:', c);
}).finally(() => p.$disconnect());
