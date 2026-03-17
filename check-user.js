const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Find the test user
  const user = await prisma.user.findUnique({
    where: { email: 'test@test.com' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Display Name:', user.displayName);
  console.log('  Has password hash:', !!user.passwordHash);

  // Test the password
  const isValid = await bcrypt.compare('test1234', user.passwordHash);
  console.log('  Password test passed:', isValid);

  if (!isValid) {
    console.log('\nPassword mismatch! Re-creating user...');
    
    // Delete portfolio first (cascade)
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: user.id }
    });
    
    for (const p of portfolios) {
      // Delete items first
      await prisma.portfolioItem.deleteMany({
        where: { portfolioId: p.id }
      });
      // Then delete portfolio
      await prisma.portfolio.delete({ where: { id: p.id } });
    }
    
    // Now delete user
    await prisma.user.delete({ where: { id: user.id } });
    
    const passwordHash = await bcrypt.hash('test1234', 12);
    const newUser = await prisma.user.create({
      data: {
        email: 'test@test.com',
        passwordHash,
        displayName: 'Test User'
      }
    });

    console.log('New user created with ID:', newUser.id);
    
    // Create portfolio
    await prisma.portfolio.create({
      data: {
        userId: newUser.id,
        name: 'My Collection'
      }
    });
    
    console.log('Portfolio created');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
