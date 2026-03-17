const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Hash password
  const passwordHash = await bcrypt.hash('test1234', 12);

  // Create or update test user
  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      passwordHash,
      displayName: 'Test User'
    }
  });

  // Create a portfolio for the user (if not exists)
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId: user.id }
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'My Collection'
      }
    });
  }

  console.log('Test user created:');
  console.log('  Email:', user.email);
  console.log('  Password: test1234');
  console.log('  Portfolio ID:', portfolio.id);
  console.log('\nYou can now log in with these credentials.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
