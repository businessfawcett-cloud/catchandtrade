import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';

export const cardsRouter = Router();

cardsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const setCode = req.query.setCode as string;
      const sort = req.query.sort as string;

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'oldest') {
        orderBy = { createdAt: 'asc' };
      }

      const where: any = {};
      if (setCode) {
        where.setCode = setCode;
      }

      let orderByField: any = orderBy;
      if (sort === 'name') {
        orderByField = { name: 'asc' };
      } else if (sort === 'price-desc' || sort === 'price-asc') {
        orderByField = { prices: { tcgplayerMarket: sort === 'price-desc' ? 'desc' : 'asc' } };
      }

      const cards = await prisma.card.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: orderByField,
        include: {
          prices: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });

      res.json({
        cards: cards.map(card => ({
          id: card.id,
          name: card.name,
          setName: card.setName,
          setCode: card.setCode,
          cardNumber: card.cardNumber,
          gameType: card.gameType,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          currentPrice: card.prices[0]?.tcgplayerMarket || null
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

cardsRouter.get(
  '/search',
  [
    query('q').optional(),
    query('gameType').optional().isString()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const searchQuery = req.query.q as string;
      const gameType = req.query.gameType as string;
      const setCode = req.query.setCode as string;
      const sort = req.query.sort as string;

      let where: any = {};

      if (searchQuery && searchQuery.trim().length >= 2) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { setName: { contains: searchQuery, mode: 'insensitive' } },
          { setCode: { contains: searchQuery, mode: 'insensitive' } }
        ];
      }

      if (gameType) {
        where.gameType = gameType;
      }

      if (setCode) {
        where.setCode = setCode;
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'oldest') {
        orderBy = { createdAt: 'asc' };
      } else if (sort === 'name') {
        orderBy = { name: 'asc' };
      }

      const results = await prisma.card.findMany({
        where,
        take: 50,
        orderBy,
        include: {
          prices: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });

      let sortedResults = results;
      if (sort === 'price-desc') {
        sortedResults = results.sort((a, b) => (b.prices[0]?.tcgplayerMarket || 0) - (a.prices[0]?.tcgplayerMarket || 0));
      } else if (sort === 'price-asc') {
        sortedResults = results.sort((a, b) => (a.prices[0]?.tcgplayerMarket || 0) - (b.prices[0]?.tcgplayerMarket || 0));
      }

      res.json({
        results: sortedResults.map(card => ({
          id: card.id,
          name: card.name,
          setName: card.setName,
          setCode: card.setCode,
          cardNumber: card.cardNumber,
          gameType: card.gameType,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          currentPrice: card.prices[0]?.tcgplayerMarket || null
        }))
      });
    } catch (error) {
      next(error);
    }
  }
);

cardsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await prisma.card.findUnique({
      where: { id: req.params.id },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 90
        }
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(card);
  } catch (error) {
    next(error);
  }
});

export default cardsRouter;
