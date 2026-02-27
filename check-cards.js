const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();
client.card.count().then(c => {
  console.log('Cards:', c);
}).finally(() => client.$disconnect());
