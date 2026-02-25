import request from 'supertest';
import { app } from '../index';
import { prisma } from '@catchandtrade/db';

jest.mock('../cron/nightlySync', () => ({
  runNightlySync: jest.fn().mockResolvedValue(undefined),
  startNightlySync: jest.fn(),
  stopNightlySync: jest.fn(),
}));

describe('Admin Sync API', () => {
  const adminKey = 'local-admin-secret-change-in-production';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.syncLog.deleteMany();
  });

  describe('POST /api/admin/sync', () => {
    it('returns 401 without admin key', async () => {
      const res = await request(app).post('/api/admin/sync');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Missing X-Admin-Key header');
    });

    it('returns 403 with invalid admin key', async () => {
      const res = await request(app)
        .post('/api/admin/sync')
        .set('X-Admin-Key', 'wrong-key');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid admin key');
    });

    it('triggers sync with valid admin key', async () => {
      const res = await request(app)
        .post('/api/admin/sync')
        .set('X-Admin-Key', adminKey);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Sync started');
    });
  });

  describe('GET /api/admin/sync/logs', () => {
    it('returns 401 without admin key', async () => {
      const res = await request(app).get('/api/admin/sync/logs');
      expect(res.status).toBe(401);
    });

    it('returns sync logs with valid admin key', async () => {
      await prisma.syncLog.create({
        data: {
          newSets: 5,
          updatedSets: 2,
          newCards: 100,
          updatedCards: 10,
          updatedPrices: 50,
          triggeredAlerts: 3,
          duration: 5000
        }
      });

      const res = await request(app)
        .get('/api/admin/sync/logs')
        .set('X-Admin-Key', adminKey);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(1);
      expect(res.body.logs[0].newSets).toBe(5);
    });

    it('respects limit parameter', async () => {
      await prisma.syncLog.createMany({
        data: [
          { newSets: 1, duration: 1000 },
          { newSets: 2, duration: 1000 },
          { newSets: 3, duration: 1000 },
        ]
      });

      const res = await request(app)
        .get('/api/admin/sync/logs?limit=2')
        .set('X-Admin-Key', adminKey);

      expect(res.status).toBe(200);
      expect(res.body.logs).toHaveLength(2);
    });
  });
});
