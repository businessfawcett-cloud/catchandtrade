import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';
import { runNightlySync } from '../../cron/nightlySync';

export const adminRouter = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET;

const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey) {
    return res.status(401).json({ error: 'Missing X-Admin-Key header' });
  }
  
  if (adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin key' });
  }
  
  next();
};

adminRouter.post(
  '/sync',
  authenticateAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ message: 'Sync started' });
      await runNightlySync();
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  '/sync/logs',
  authenticateAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const logs = await prisma.syncLog.findMany({
        orderBy: { runAt: 'desc' },
        take: limit
      });

      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  '/stats/users',
  authenticateAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = Date.now();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const [
        totalAccounts,
        accountsWithUsername,
        publicProfiles,
        verifiedSellers,
        activeLast7Days,
        activeLast30Days
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { username: { not: null } } }),
        prisma.user.count({ where: { isPublic: true } }),
        prisma.user.count({ where: { isVerifiedSeller: true } }),
        prisma.user.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
        prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } })
      ]);

      res.json({
        users: {
          totalAccounts,
          accountsWithUsername,
          publicProfiles,
          verifiedSellers,
          activeLast7Days,
          activeLast30Days
        },
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);
