import request from 'supertest';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';

describe('Cards API', () => {
  let cardId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.portfolioItem.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();

    const card = await prisma.card.create({
      data: {
        name: 'Charizard',
        setName: 'Base Set',
        setCode: 'BS1',
        cardNumber: '4',
        rarity: 'Rare Holo',
        gameType: 'POKEMON',
        language: 'EN',
        imageUrl: 'https://example.com/charizard.jpg'
      }
    });
    cardId = card.id;

    await prisma.cardPrice.create({
      data: {
        cardId: card.id,
        tcgplayerLow: 4000,
        tcgplayerMid: 5000,
        tcgplayerHigh: 6000,
        tcgplayerMarket: 5000,
        date: new Date()
      }
    });

    await prisma.card.create({
      data: {
        name: 'Blastoise',
        setName: 'Base Set',
        setCode: 'BS1',
        cardNumber: '2',
        rarity: 'Rare Holo',
        gameType: 'POKEMON',
        language: 'EN'
      }
    });
  });

  describe('GET /api/cards/search', () => {
    it('returns cards matching search query', async () => {
      const res = await request(app).get('/api/cards/search?q=Char');

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThanOrEqual(1);
      expect(res.body.results[0].name).toBe('Charizard');
    });

    it('returns empty array when no matches', async () => {
      const res = await request(app).get('/api/cards/search?q=xyz');

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(0);
    });

    it('searches by setName', async () => {
      const res = await request(app).get('/api/cards/search?q=Base Set');

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(2);
    });

    it('returns all cards when query is shorter than 2 chars', async () => {
      const res = await request(app).get('/api/cards/search?q=a');

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('returns all cards when query is empty', async () => {
      const res = await request(app).get('/api/cards/search?q=');

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/cards/:id', () => {
    it('returns card by id', async () => {
      const res = await request(app).get(`/api/cards/${cardId}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Charizard');
      expect(res.body.prices).toHaveLength(1);
    });

    it('returns 404 for non-existent card', async () => {
      const res = await request(app).get('/api/cards/non-existent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/cards', () => {
    it('returns featured cards', async () => {
      const res = await request(app).get('/api/cards');

      expect(res.status).toBe(200);
      expect(res.body.cards).toBeDefined();
    });

    it('returns cards with current price', async () => {
      const res = await request(app).get('/api/cards');

      expect(res.status).toBe(200);
      expect(res.body.cards[0].currentPrice).toBeDefined();
    });

    it('returns card with image URL', async () => {
      const res = await request(app).get('/api/cards');

      expect(res.status).toBe(200);
      expect(res.body.cards[0].imageUrl).toBeDefined();
    });

    it('filters by gameType', async () => {
      await prisma.card.create({
        data: {
          name: 'Black Lotus',
          setName: 'Alpha',
          setCode: 'LEA',
          cardNumber: '1',
          rarity: 'Rare',
          gameType: 'MTG',
          language: 'EN'
        }
      });

      const res = await request(app).get('/api/cards/search?q=Alpha&gameType=MTG');

      expect(res.status).toBe(200);
      expect(res.body.results[0].gameType).toBe('MTG');
    });
  });
});
