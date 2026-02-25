import { CardMatcher } from '../cardMatcher';
import { prisma } from '@catchandtrade/db';

describe('CardMatcher', () => {
  const cardMatcher = new CardMatcher();

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.portfolioItem.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();
    
    await prisma.card.createMany({
      data: [
        { name: 'Charizard', setName: 'Base Set', setCode: 'BS1', cardNumber: '4' },
        { name: 'Charizard', setName: 'Base Set 2', setCode: 'BS2', cardNumber: '4' },
        { name: 'Pikachu', setName: 'Base Set', setCode: 'BS1', cardNumber: '25' },
        { name: 'Pikachu', setName: 'Jungle', setCode: 'JK', cardNumber: '25' },
        { name: 'Blastoise', setName: 'Base Set', setCode: 'BS1', cardNumber: '2' },
      ]
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.portfolioItem.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();
    await prisma.card.createMany({
      data: [
        { name: 'Charizard', setName: 'Base Set', setCode: 'BS1', cardNumber: '4' },
        { name: 'Charizard', setName: 'Base Set 2', setCode: 'BS2', cardNumber: '4' },
        { name: 'Pikachu', setName: 'Base Set', setCode: 'BS1', cardNumber: '25' },
        { name: 'Pikachu', setName: 'Jungle', setCode: 'JK', cardNumber: '25' },
        { name: 'Blastoise', setName: 'Base Set', setCode: 'BS1', cardNumber: '2' },
      ]
    });
  });

  it('matches card name to existing card in database', async () => {
    const match = await cardMatcher.match({ cardName: 'Charizard', cardNumber: '4' });
    expect(match).not.toBeNull();
    expect(match?.card.name).toBe('Charizard');
    expect(match?.confidence).toBeGreaterThan(0.5);
  });

  it('uses fuzzy match for misspelled names', async () => {
    const match = await cardMatcher.match({ cardName: 'Charzard' });
    expect(match).not.toBeNull();
    expect(match?.card.name).toBe('Charizard');
  });

  it('returns candidates array when ambiguous', async () => {
    const match = await cardMatcher.match({ cardName: 'Pikachu' });
    expect(match).not.toBeNull();
    expect(match?.candidates?.length).toBeGreaterThan(1);
  });

  it('returns null when no match found', async () => {
    const match = await cardMatcher.match({ cardName: 'NotARealCard9999' });
    expect(match).toBeNull();
  });
});
