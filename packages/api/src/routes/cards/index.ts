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
      }

      const [cards, total] = await Promise.all([
        prisma.card.findMany({
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
        }),
        prisma.card.count({ where })
      ]);

      let results = cards.map(card => ({
        id: card.id,
        name: card.name,
        setName: card.setName,
        setCode: card.setCode,
        cardNumber: card.cardNumber,
        gameType: card.gameType,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
        currentPrice: card.prices[0]?.tcgplayerMarket || null
      }));

      if (sort === 'price-desc') {
        results.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
      } else if (sort === 'price-asc') {
        results.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
      }

      res.json({ cards: results, total });
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

      const limit = parseInt(req.query.limit as string) || 50;
      const fetchLimit = Math.min(limit * 4, 200);

      const [results, total] = await Promise.all([
        prisma.card.findMany({
          where,
          take: fetchLimit,
          orderBy,
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }),
        prisma.card.count({ where })
      ]);

      let sortedResults = results;
      if (searchQuery && searchQuery.trim().length >= 2) {
        const q = searchQuery.toLowerCase();
        sortedResults = results.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          
          const aExact = aName === q ? 1 : 0;
          const bExact = bName === q ? 1 : 0;
          if (aExact !== bExact) return bExact - aExact;
          
          const aStarts = aName.startsWith(q) ? 1 : 0;
          const bStarts = bName.startsWith(q) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
          
          const aContains = aName.includes(q) ? 1 : 0;
          const bContains = bName.includes(q) ? 1 : 0;
          if (aContains !== bContains) return bContains - aContains;
          
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else if (sort === 'price-desc') {
        sortedResults = results.sort((a, b) => (b.prices[0]?.tcgplayerMarket || 0) - (a.prices[0]?.tcgplayerMarket || 0));
      } else if (sort === 'price-asc') {
        sortedResults = results.sort((a, b) => (a.prices[0]?.tcgplayerMarket || 0) - (b.prices[0]?.tcgplayerMarket || 0));
      }

      res.json({
        results: sortedResults.slice(0, limit).map(card => ({
          id: card.id,
          name: card.name,
          setName: card.setName,
          setCode: card.setCode,
          cardNumber: card.cardNumber,
          gameType: card.gameType,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          currentPrice: card.prices[0]?.tcgplayerMarket || null
        })),
        total
      });
    } catch (error) {
      next(error);
    }
  }
);

cardsRouter.get('/:id/price-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cardId = req.params.id;
    const period = (req.query.period as string) || '30';

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const currentPrice = card.prices[0]?.tcgplayerMarket || null;

    let priceHistory: any[] = [];
    try {
      priceHistory = await prisma.priceHistory.findMany({
        where: { cardId },
        orderBy: { date: 'asc' }
      });
    } catch (e) {
      // PriceHistory model may not exist yet, use mock data
      priceHistory = [];
    }

    if (priceHistory.length > 0) {
      const data = priceHistory.map(ph => ({
        date: ph.date.toISOString().split('T')[0],
        price: ph.price
      }));

      const latest = data[data.length - 1];
      const oldest = data[0];
      const change = oldest ? ((latest.price - oldest.price) / oldest.price) * 100 : 0;

      res.json({
        data,
        currentPrice: latest.price,
        change: change.toFixed(2),
        hasRealData: true
      });
    } else {
      const mockData = generateMockPriceHistory(currentPrice, parseInt(period));
      const latest = mockData[mockData.length - 1];
      const oldest = mockData[0];
      const change = oldest ? ((latest.price - oldest.price) / oldest.price) * 100 : 0;

      res.json({
        data: mockData,
        currentPrice: latest.price,
        change: change.toFixed(2),
        hasRealData: false
      });
    }
  } catch (error) {
    next(error);
  }
});

function generateMockPriceHistory(currentPrice: number | null, days: number) {
  const data = [];
  const basePrice = currentPrice || 50;
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const variance = (Math.random() - 0.5) * 0.3;
    const trend = (days - i) / days * 0.05;
    const price = Math.max(1, basePrice * (1 + variance + trend));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    });
  }

  return data;
}

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
