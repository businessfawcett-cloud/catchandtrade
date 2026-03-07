import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';
import { authenticate } from '../../middleware/auth';

export const watchlistRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

watchlistRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      const items = await prisma.watchlistItem.findMany({
        where: { userId },
        include: {
          card: {
            include: {
              prices: {
                orderBy: { date: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      res.json(items.map(item => ({
        id: item.id,
        cardId: item.cardId,
        addedAt: item.addedAt,
        card: item.card,
        currentPrice: item.card.prices[0]?.priceMarket || null
      })));
    } catch (error) {
      next(error);
    }
  }
);

watchlistRouter.post(
  '/',
  authenticate,
  [body('cardId').notEmpty()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      const { cardId } = req.body;

      const existing = await prisma.watchlistItem.findUnique({
        where: {
          userId_cardId: { userId, cardId }
        }
      });

      if (existing) {
        return res.status(409).json({ error: 'Card already in watchlist' });
      }

      const item = await prisma.watchlistItem.create({
        data: { userId, cardId }
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

watchlistRouter.delete(
  '/:cardId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      const { cardId } = req.params;

      await prisma.watchlistItem.delete({
        where: {
          userId_cardId: { userId, cardId }
        }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default watchlistRouter;
