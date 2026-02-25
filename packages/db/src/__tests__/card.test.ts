import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Card model', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.portfolioItem.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();
  });

  it('creates a Pokemon card with required fields', async () => {
    const card = await prisma.card.create({
      data: {
        name: 'Charizard',
        setName: 'Base Set',
        setCode: 'BS',
        cardNumber: '4'
      }
    });
    expect(card.gameType).toBe('POKEMON');
    expect(card.id).toBeDefined();
    expect(card.name).toBe('Charizard');
  });

  it('enforces unique tcgplayerId', async () => {
    const cardData = {
      name: 'Charizard',
      setName: 'Base Set',
      setCode: 'BS',
      cardNumber: '4',
      tcgplayerId: 'dup123'
    };

    await prisma.card.create({ data: cardData });

    await expect(prisma.card.create({ data: cardData })).rejects.toThrow();
  });

  it('defaults language to EN', async () => {
    const card = await prisma.card.create({
      data: {
        name: 'Pikachu',
        setName: 'Base Set',
        setCode: 'BS',
        cardNumber: '25'
      }
    });
    expect(card.language).toBe('EN');
  });

  it('creates card with Pokemon game type', async () => {
    const card = await prisma.card.create({
      data: {
        name: 'Test Card',
        setName: 'Test Set',
        setCode: 'TS',
        cardNumber: '1',
        gameType: 'POKEMON'
      }
    });
    expect(card.gameType).toBe('POKEMON');
  });

  it('creates card with MTG game type', async () => {
    const card = await prisma.card.create({
      data: {
        name: 'Test Card',
        setName: 'Test Set',
        setCode: 'TS',
        cardNumber: '1',
        gameType: 'MTG'
      }
    });
    expect(card.gameType).toBe('MTG');
  });
});
