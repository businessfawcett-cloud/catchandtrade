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
