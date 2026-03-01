import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@catchandtrade/db';

export const setsRouter = Router();

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

setsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sets = await prisma.pokemonSet.findMany({
        orderBy: { releaseYear: 'desc' }
      });

      const setsWithCounts = await Promise.all(
        sets.map(async (set) => {
          const cardCount = await prisma.card.count({
            where: { setCode: set.code }
          });
          return {
            id: set.id,
            name: set.name,
            code: set.code,
            totalCards: set.totalCards,
            releaseYear: set.releaseYear,
            imageUrl: set.imageUrl,
            cardCount
          };
        })
      );

      res.json({ sets: setsWithCounts });
    } catch (error) {
      next(error);
    }
  }
);

setsRouter.get(
  '/:code',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;

      const set = await prisma.pokemonSet.findUnique({
        where: { code }
      });

      if (!set) {
        return res.status(404).json({ error: 'Set not found' });
      }

      const cards = await prisma.card.findMany({
        where: { setCode: code },
        orderBy: { cardNumber: 'asc' }
      });

      res.json({
        set: {
          id: set.id,
          name: set.name,
          code: set.code,
          totalCards: set.totalCards,
          releaseYear: set.releaseYear,
          imageUrl: set.imageUrl
        },
        cards: cards.map(card => ({
          id: card.id,
          name: card.name,
          cardNumber: card.cardNumber,
          rarity: card.rarity,
          imageUrl: card.imageUrl
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

setsRouter.get(
  '/:code/progress',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;
      const userId = (req as any).userId;

      const set = await prisma.pokemonSet.findUnique({
        where: { code }
      });

      if (!set) {
        return res.status(404).json({ error: 'Set not found' });
      }

      const cards = await prisma.card.findMany({
        where: { setCode: code }
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          portfolios: {
            include: {
              items: {
                where: {
                  card: {
                    setCode: code
                  }
                }
              }
            }
          }
        }
      });

      const ownedCardIds = new Set<string>();
      for (const portfolio of user?.portfolios || []) {
        for (const item of portfolio.items) {
          ownedCardIds.add(item.cardId);
        }
      }

      const ownedCards = cards.filter(card => ownedCardIds.has(card.id));
      const missingCards = cards.filter(card => !ownedCardIds.has(card.id));

      const progressPercentage = cards.length > 0 
        ? Math.round((ownedCards.length / cards.length) * 100) 
        : 0;

      res.json({
        set: {
          id: set.id,
          name: set.name,
          code: set.code,
          totalCards: set.totalCards,
          releaseYear: set.releaseYear,
          imageUrl: set.imageUrl
        },
        progress: {
          owned: ownedCards.length,
          total: cards.length,
          percentage: progressPercentage
        },
        ownedCards: ownedCards.map(card => ({
          id: card.id,
          name: card.name,
          cardNumber: card.cardNumber,
          rarity: card.rarity,
          imageUrl: card.imageUrl
        })),
        missingCards: missingCards.map(card => ({
          id: card.id,
          name: card.name,
          cardNumber: card.cardNumber,
          rarity: card.rarity,
          imageUrl: card.imageUrl
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

export default setsRouter;
