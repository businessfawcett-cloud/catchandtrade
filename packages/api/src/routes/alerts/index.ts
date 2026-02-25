import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { prisma } from '@catchandtrade/db';
import { AlertType } from '@prisma/client';

export const alertsRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

alertsRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      const alerts = await prisma.priceAlert.findMany({
        where: { userId },
        include: { card: true },
        orderBy: { createdAt: 'desc' }
      });

      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }
);

alertsRouter.post(
  '/',
  authenticate,
  [
    body('cardId').notEmpty(),
    body('alertType').isIn(['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE']),
    body('targetPrice').isFloat({ min: 0 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { cardId, alertType, targetPrice } = req.body;

      const alert = await prisma.priceAlert.create({
        data: {
          userId,
          cardId,
          alertType: alertType as AlertType,
          targetPrice
        }
      });

      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  }
);

alertsRouter.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const alert = await prisma.priceAlert.findFirst({
        where: { id, userId }
      });

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      await prisma.priceAlert.delete({ where: { id } });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default alertsRouter;
