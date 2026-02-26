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

  describe('GET /api/portfolios/:id/value', () => {
    let portfolioId: string;
    let cardId: string;

    beforeEach(async () => {
      const card = await prisma.card.create({
        data: {
          name: 'Pikachu',
          setName: 'Base Set',
          setCode: 'BS1',
          cardNumber: '25',
          gameType: 'POKEMON',
          prices: {
            create: {
              tcgplayerMarket: 10.00,
              date: new Date()
            }
          }
        }
      });
      cardId = card.id;

      const portfolio = await prisma.portfolio.create({
        data: { userId, name: 'Test Portfolio' }
      });
      portfolioId = portfolio.id;

      await prisma.portfolioItem.create({
        data: {
          portfolioId,
          cardId,
          quantity: 2,
          condition: 'NEAR_MINT'
        }
      });
    });

    it('returns portfolio value', async () => {
      const res = await request(app)
        .get(`/api/portfolios/${portfolioId}/value`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalValue).toBe(20.00);
      expect(res.body.cardCount).toBe(2);
      expect(res.body.uniqueCards).toBe(1);
    });

    it('returns 0 for empty portfolio', async () => {
      const emptyPortfolio = await prisma.portfolio.create({
        data: { userId, name: 'Empty Portfolio' }
      });

      const res = await request(app)
        .get(`/api/portfolios/${emptyPortfolio.id}/value`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalValue).toBe(0);
      expect(res.body.cardCount).toBe(0);
      expect(res.body.uniqueCards).toBe(0);
    });

    it('returns 404 for non-existent portfolio', async () => {
      const res = await request(app)
        .get('/api/portfolios/non-existent-id/value')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .get(`/api/portfolios/${portfolioId}/value`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/portfolios/:id', () => {
    let portfolioId: string;
    let secondPortfolioId: string;
    let userId: string;

    beforeEach(async () => {
      userId = (jwt.verify(token, JWT_SECRET) as { userId: string }).userId;
      
      const portfolio = await prisma.portfolio.create({
        data: { userId, name: 'Test Portfolio' }
      });
      portfolioId = portfolio.id;

      const secondPortfolio = await prisma.portfolio.create({
        data: { userId, name: 'Second Portfolio' }
      });
      secondPortfolioId = secondPortfolio.id;
    });

    it('deletes portfolio successfully', async () => {
      const res = await request(app)
        .delete(`/api/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent portfolio', async () => {
      const res = await request(app)
        .delete('/api/portfolios/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 when trying to delete another users portfolio', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other@test.com', displayName: 'Other User' }
      });

      const otherPortfolio = await prisma.portfolio.create({
        data: { userId: otherUser.id, name: 'Other Portfolio' }
      });

      const res = await request(app)
        .delete(`/api/portfolios/${otherPortfolio.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('prevents deleting last portfolio', async () => {
      await prisma.portfolio.delete({ where: { id: secondPortfolioId } });

      const res = await request(app)
        .delete(`/api/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('last portfolio');
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .delete(`/api/portfolios/${portfolioId}`);

      expect(res.status).toBe(401);
    });
  });
});
