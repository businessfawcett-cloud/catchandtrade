import request from 'supertest';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

describe('Portfolios API', () => {
  let token: string;
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
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash',
        displayName: 'Test User'
      }
    });
    userId = user.id;
    token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
  });

  describe('POST /api/portfolios', () => {
    it('creates a portfolio for authenticated user', async () => {
      const res = await request(app)
        .post('/api/portfolios')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Collection', isPublic: false });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('My Collection');
      expect(res.body.userId).toBe(userId);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/portfolios')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/portfolios', () => {
    it('returns user portfolios', async () => {
      await prisma.portfolio.create({
        data: { userId, name: 'Test Portfolio' }
      });

      const res = await request(app)
        .get('/api/portfolios')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/portfolios');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/portfolios/default', () => {
    it('returns first portfolio', async () => {
      await prisma.portfolio.create({
        data: { userId, name: 'First' }
      });

      const res = await request(app)
        .get('/api/portfolios/default')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('First');
    });

    it('creates default portfolio if none exist', async () => {
      const res = await request(app)
        .get('/api/portfolios/default')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('My Collection');
    });
  });

  describe('POST /api/portfolios/:id/items', () => {
    let cardId: string;
    let portfolioId: string;

    beforeEach(async () => {
      const card = await prisma.card.create({
        data: {
          name: 'Charizard',
          setName: 'Base Set',
          setCode: 'BS1',
          cardNumber: '4',
          gameType: 'POKEMON'
        }
      });
      cardId = card.id;

      const portfolio = await prisma.portfolio.create({
        data: { userId, name: 'Test Portfolio' }
      });
      portfolioId = portfolio.id;
    });

    it('adds item to portfolio', async () => {
      const res = await request(app)
        .post(`/api/portfolios/${portfolioId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId,
          quantity: 1,
          condition: 'NEAR_MINT'
        });

      expect(res.status).toBe(201);
      expect(res.body.quantity).toBe(1);
    });

    it('rejects invalid condition', async () => {
      const res = await request(app)
        .post(`/api/portfolios/${portfolioId}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          cardId,
          condition: 'INVALID'
        });

      expect(res.status).toBe(400);
    });
  });
});
