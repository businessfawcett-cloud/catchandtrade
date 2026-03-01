import { prisma } from '@catchandtrade/db';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.cardPrice.deleteMany();
  await prisma.card.deleteMany();
  await prisma.user.deleteMany();
});
