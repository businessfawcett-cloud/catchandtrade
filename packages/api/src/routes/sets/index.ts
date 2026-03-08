import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@catchandtrade/db';
import { authenticate } from '../../middleware/auth';

export const setsRouter = Router();

setsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sets = await prisma.pokemonSet.findMany({
        orderBy: { releaseYear: 'desc' }
      });

      const allSetCodes = sets.map(s => s.code);
      
      const cardCounts = await prisma.card.groupBy({
        by: ['setCode'],
        _count: { setCode: true },
        where: { setCode: { in: allSetCodes } }
      });
      
      const countMap = new Map(cardCounts.map(c => [c.setCode, c._count.setCode]));

      const result = sets.map(set => ({
        id: set.id,
        name: set.name,
        code: set.code,
        totalCards: set.totalCards,
        releaseYear: set.releaseYear,
        imageUrl: set.imageUrl,
        cardCount: countMap.get(set.code) || 0
      }));

      res.json({ sets: result });
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
  '/progress',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;

      const sets = await prisma.pokemonSet.findMany({
        orderBy: { releaseYear: 'desc' }
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          portfolios: {
            include: {
              items: true
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

      const cardsBySet = await prisma.card.groupBy({
        by: ['setCode'],
        _count: { id: true },
        where: { setCode: { in: sets.map(s => s.code) } }
      });

      const cardCountMap = new Map(cardsBySet.map(c => [c.setCode, c._count.id]));

      const cards = await prisma.card.findMany({
        where: { setCode: { in: sets.map(s => s.code) } }
      });

      const cardsBySetCode = new Map<string, typeof cards>();
      for (const card of cards) {
        const existing = cardsBySetCode.get(card.setCode) || [];
        existing.push(card);
        cardsBySetCode.set(card.setCode, existing);
      }

      const progressBySet: Record<string, { owned: number; total: number; percentage: number }> = {};

      for (const set of sets) {
        const setCards = cardsBySetCode.get(set.code) || [];
        const ownedCards = setCards.filter(card => ownedCardIds.has(card.id));
        const totalCards = cardCountMap.get(set.code) || setCards.length;
        const percentage = totalCards > 0 ? Math.round((ownedCards.length / totalCards) * 100) : 0;

        progressBySet[set.code] = {
          owned: ownedCards.length,
          total: totalCards,
          percentage
        };
      }

      res.json({ progress: progressBySet });
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
