const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Update test user to have a username
  const user = await prisma.user.update({
    where: { email: 'test@test.com' },
    data: {
      username: 'testuser'
    }
  });

  console.log('Updated test user:');
  console.log('  Email:', user.email);
  console.log('  Username:', user.username);
  console.log('  Display Name:', user.displayName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
