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
        orderBy: { releaseYear: 'desc' },
        include: {
          _count: {
            select: { cards: true }
          }
        }
      });

      res.json({
        sets: sets.map(set => ({
          id: set.id,
          name: set.name,
          code: set.code,
          totalCards: set.totalCards,
          releaseYear: set.releaseYear,
          imageUrl: set.imageUrl,
          cardCount: set._count.cards
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
        where: { code },
        include: {
          cards: true
        }
      });

      if (!set) {
        return res.status(404).json({ error: 'Set not found' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          portfolios: {
            include: {
              items: {
                where: {
                  card: {
                    setId: set.id
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

      const ownedCards = set.cards.filter(card => ownedCardIds.has(card.id));
      const missingCards = set.cards.filter(card => !ownedCardIds.has(card.id));

      const progressPercentage = set.cards.length > 0 
        ? Math.round((ownedCards.length / set.cards.length) * 100) 
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
          total: set.cards.length,
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
