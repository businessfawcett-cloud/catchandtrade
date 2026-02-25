import request from 'supertest';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

describe('Listings API', () => {
  let sellerToken: string;
  let sellerId: string;
  let cardId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.cardPrice.deleteMany();
    await prisma.card.deleteMany();
    await prisma.user.deleteMany();

    const card = await prisma.card.create({
      data: {
        name: 'Charizard',
        setName: 'Base Set',
        setCode: 'BS1',
        cardNumber: '4'
      }
    });
    cardId = card.id;

    const user = await prisma.user.create({
      data: {
        email: 'seller@test.com',
        passwordHash: 'hash',
        displayName: 'Test Seller',
        isVerifiedSeller: true,
        stripeAccountId: 'acct_test123'
      }
    });
    sellerId = user.id;
    sellerToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
  });

  describe('POST /api/listings', () => {
    it('creates listing for verified seller', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          cardId,
          title: 'PSA 10 Charizard Base Set',
          condition: 'MINT',
          isGraded: true,
          gradeCompany: 'PSA',
          gradeValue: 10,
          buyNowPrice: 5000,
          imageUrls: ['https://example.com/img.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.commissionPct).toBe(8);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('rejects listing from unverified seller', async () => {
      await prisma.user.update({
        where: { id: sellerId },
        data: { isVerifiedSeller: false }
      });

      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          cardId,
          title: 'Charizard Base Set',
          condition: 'MINT',
          buyNowPrice: 500,
          imageUrls: ['https://example.com/img.jpg']
        });

      expect(res.status).toBe(403);
    });

    it('rejects price <= 0', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          cardId,
          title: 'Charizard',
          condition: 'MINT',
          buyNowPrice: 0,
          imageUrls: ['https://example.com/img.jpg']
        });

      expect(res.status).toBe(400);
    });

    it('rejects grade value > 10', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          cardId,
          title: 'Charizard PSA 11',
          condition: 'MINT',
          isGraded: true,
          gradeCompany: 'PSA',
          gradeValue: 11,
          buyNowPrice: 500,
          imageUrls: ['https://example.com/img.jpg']
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/listings', () => {
    beforeEach(async () => {
      await prisma.listing.createMany({
        data: [
          {
            sellerId,
            cardId,
            title: 'Charizard PSA 10',
            condition: 'MINT',
            isGraded: true,
            gradeCompany: 'PSA',
            gradeValue: 10,
            buyNowPrice: 5000,
            imageUrls: ['https://example.com/1.jpg'],
            status: 'ACTIVE'
          },
          {
            sellerId,
            cardId,
            title: 'Charizard Near Mint',
            condition: 'NEAR_MINT',
            isGraded: false,
            buyNowPrice: 500,
            imageUrls: ['https://example.com/2.jpg'],
            status: 'ACTIVE'
          }
        ]
      });
    });

    it('returns paginated active listings', async () => {
      const res = await request(app).get('/api/listings?page=1&limit=20');

      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBeLessThanOrEqual(20);
      expect(res.body.total).toBeDefined();
    });

    it('filters by cardId', async () => {
      const res = await request(app).get(`/api/listings?cardId=${cardId}`);

      expect(res.status).toBe(200);
      res.body.listings.forEach((l: any) => expect(l.cardId).toBe(cardId));
    });

    it('filters by condition', async () => {
      const res = await request(app).get('/api/listings?condition=MINT');

      expect(res.status).toBe(200);
      res.body.listings.forEach((l: any) => expect(l.condition).toBe('MINT'));
    });

    it('filters by isGraded=true', async () => {
      const res = await request(app).get('/api/listings?isGraded=true');

      expect(res.status).toBe(200);
      res.body.listings.forEach((l: any) => expect(l.isGraded).toBe(true));
    });

    it('sorts by price ascending', async () => {
      const res = await request(app).get('/api/listings?sort=price_asc');

      expect(res.status).toBe(200);
      const prices = res.body.listings.map((l: any) => l.buyNowPrice);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('sorts by price descending', async () => {
      const res = await request(app).get('/api/listings?sort=price_desc');

      expect(res.status).toBe(200);
      const prices = res.body.listings.map((l: any) => l.buyNowPrice);
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });

    it('does not return SOLD listings', async () => {
      await prisma.listing.create({
        data: {
          sellerId,
          cardId,
          title: 'Sold Listing',
          condition: 'MINT',
          buyNowPrice: 100,
          imageUrls: ['https://example.com/sold.jpg'],
          status: 'SOLD'
        }
      });

      const res = await request(app).get('/api/listings');

      expect(res.status).toBe(200);
      res.body.listings.forEach((l: any) => expect(l.status).toBe('ACTIVE'));
    });
  });

  describe('GET /api/listings/:id', () => {
    let listingId: string;

    beforeEach(async () => {
      const listing = await prisma.listing.create({
        data: {
          sellerId,
          cardId,
          title: 'Charizard PSA 10',
          condition: 'MINT',
          isGraded: true,
          gradeCompany: 'PSA',
          gradeValue: 10,
          buyNowPrice: 5000,
          imageUrls: ['https://example.com/1.jpg'],
          status: 'ACTIVE'
        }
      });
      listingId = listing.id;
    });

    it('returns listing by id', async () => {
      const res = await request(app).get(`/api/listings/${listingId}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Charizard PSA 10');
    });

    it('returns 404 for non-existent listing', async () => {
      const res = await request(app).get('/api/listings/non-existent-id');

      expect(res.status).toBe(404);
    });
  });
});
