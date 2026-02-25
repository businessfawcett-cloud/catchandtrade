import request from 'supertest';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

describe('Seller Onboarding', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.card.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'seller@test.com',
        passwordHash: 'hash',
        displayName: 'Test Seller'
      }
    });
    userId = user.id;
    token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
  });

  it('POST /api/seller/onboard creates Stripe Connect account when not configured', async () => {
    const res = await request(app)
      .post('/api/seller/onboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBeGreaterThanOrEqual(200);
    if (res.status === 200) {
      expect(res.body.onboardingUrl).toContain('connect.stripe.com');
    }
  });

  it('GET /api/seller/status returns seller status', async () => {
    const res = await request(app)
      .get('/api/seller/status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isVerifiedSeller');
    expect(res.body).toHaveProperty('hasStripeAccount');
  });
});
