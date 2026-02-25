import request from 'supertest';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';
import bcrypt from 'bcrypt';

describe('Sets API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.portfolioItem.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();
    await prisma.pokemonSet.deleteMany();
    await prisma.user.deleteMany();
    await prisma.priceAlert.deleteMany();
    await prisma.watchlistItem.deleteMany();

    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        passwordHash,
        displayName: 'Test User'
      }
    });
    userId = user.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'TestPassword123!'
      });
    authToken = loginRes.body.token;

    const set1 = await prisma.pokemonSet.create({
      data: {
        name: 'Base Set',
        code: 'BS',
        totalCards: 102,
        releaseYear: 1999
      }
    });

    const set2 = await prisma.pokemonSet.create({
      data: {
        name: 'Jungle',
        code: 'JU',
        totalCards: 64,
        releaseYear: 1999
      }
    });

    const card1 = await prisma.card.create({
      data: {
        name: 'Charizard',
        setName: 'Base Set',
        setCode: 'BS',
        cardNumber: '4',
        rarity: 'Rare Holo',
        gameType: 'POKEMON',
        language: 'EN',
        imageUrl: 'https://example.com/charizard.jpg',
        setId: set1.id
      }
    });

    const card2 = await prisma.card.create({
      data: {
        name: 'Blastoise',
        setName: 'Base Set',
        setCode: 'BS',
        cardNumber: '2',
        rarity: 'Rare Holo',
        gameType: 'POKEMON',
        language: 'EN',
        setId: set1.id
      }
    });

    const card3 = await prisma.card.create({
      data: {
        name: 'Pikachu',
        setName: 'Jungle',
        setCode: 'JU',
        cardNumber: '10',
        rarity: 'Rare Holo',
        gameType: 'POKEMON',
        language: 'EN',
        setId: set2.id
      }
    });

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'My Collection',
        isPublic: false
      }
    });

    await prisma.portfolioItem.create({
      data: {
        portfolioId: portfolio.id,
        cardId: card1.id,
        quantity: 1,
        condition: 'NEAR_MINT',
        isGraded: false
      }
    });
  });

  describe('GET /api/sets', () => {
    it('returns all Pokemon sets', async () => {
      const res = await request(app).get('/api/sets');

      expect(res.status).toBe(200);
      expect(res.body.sets).toBeDefined();
      expect(res.body.sets.length).toBeGreaterThanOrEqual(2);
    });

    it('returns sets with correct fields', async () => {
      const res = await request(app).get('/api/sets');

      expect(res.status).toBe(200);
      const set = res.body.sets.find((s: any) => s.code === 'BS');
      expect(set).toBeDefined();
      expect(set.name).toBe('Base Set');
      expect(set.totalCards).toBe(102);
      expect(set.releaseYear).toBe(1999);
    });

    it('returns sets ordered by release year descending', async () => {
      const res = await request(app).get('/api/sets');

      expect(res.status).toBe(200);
      const sets = res.body.sets;
      for (let i = 1; i < sets.length; i++) {
        expect(sets[i - 1].releaseYear).toBeGreaterThanOrEqual(sets[i].releaseYear);
      }
    });

    it('includes card count in response', async () => {
      const res = await request(app).get('/api/sets');

      expect(res.status).toBe(200);
      const set = res.body.sets.find((s: any) => s.code === 'BS');
      expect(set.cardCount).toBe(2);
    });
  });

  describe('GET /api/sets/:code/progress', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/sets/BS/progress');

      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/sets/BS/progress')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('returns progress for authenticated user', async () => {
      const res = await request(app)
        .get('/api/sets/BS/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.set).toBeDefined();
      expect(res.body.set.name).toBe('Base Set');
      expect(res.body.progress).toBeDefined();
      expect(res.body.progress.owned).toBe(1);
      expect(res.body.progress.total).toBe(2);
      expect(res.body.progress.percentage).toBe(50);
    });

    it('returns owned cards correctly', async () => {
      const res = await request(app)
        .get('/api/sets/BS/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ownedCards).toHaveLength(1);
      expect(res.body.ownedCards[0].name).toBe('Charizard');
    });

    it('returns missing cards correctly', async () => {
      const res = await request(app)
        .get('/api/sets/BS/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.missingCards).toHaveLength(1);
      expect(res.body.missingCards[0].name).toBe('Blastoise');
    });

    it('returns 404 for non-existent set', async () => {
      const res = await request(app)
        .get('/api/sets/NONEXISTENT/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('calculates 0% progress for set with no owned cards', async () => {
      const res = await request(app)
        .get('/api/sets/JU/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.owned).toBe(0);
      expect(res.body.progress.percentage).toBe(0);
    });

    it('calculates 100% progress for complete set', async () => {
      const set = await prisma.pokemonSet.findUnique({ where: { code: 'BS' } });
      const cards = await prisma.card.findMany({ where: { setId: set?.id } });
      
      const portfolio = await prisma.portfolio.findFirst({ where: { userId } });
      
      for (const card of cards) {
        await prisma.portfolioItem.create({
          data: {
            portfolioId: portfolio!.id,
            cardId: card.id,
            quantity: 1,
            condition: 'NEAR_MINT',
            isGraded: false
          }
        });
      }

      const res = await request(app)
        .get('/api/sets/BS/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.percentage).toBe(100);
    });
  });
});
