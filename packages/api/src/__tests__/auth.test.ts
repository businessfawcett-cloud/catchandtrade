import request from 'supertest';
import { Express } from 'express';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('creates user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'First User'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Duplicate'
      });

    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@example.com',
        password: '123',
        displayName: 'Weak'
      });

    expect(res.status).toBe(400);
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
        displayName: 'Test'
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User'
      });
  });

  it('returns JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      });

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/google', () => {
  it('redirects to Google OAuth when configured', async () => {
    const res = await request(app).get('/api/auth/google');
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('accounts.google.com');
    } else {
      expect(res.status).toBe(400);
    }
  });
});

describe('GET /api/auth/apple', () => {
  it('redirects to Apple OAuth when configured', async () => {
    const res = await request(app).get('/api/auth/apple');
    if (process.env.APPLE_CLIENT_ID) {
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('appleid.apple.com');
    } else {
      expect(res.status).toBe(400);
    }
  });
});
