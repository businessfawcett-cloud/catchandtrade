import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { prisma } from '@catchandtrade/db';
import { Condition } from '@catchandtrade/shared';

export const portfoliosRouter = Router();

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

portfoliosRouter.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('isPublic').optional().isBoolean()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, isPublic = false } = req.body;
      const userId = (req as any).userId;

      const shareSlug = isPublic 
        ? `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`
        : null;

      const portfolio = await prisma.portfolio.create({
        data: {
          userId,
          name,
          isPublic,
          shareSlug
        }
      });

      res.status(201).json(portfolio);
    } catch (error) {
      next(error);
    }
  }
);

portfoliosRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: { 
        items: {
          include: { card: true }
        }
      }
    });
    res.json(portfolios);
  } catch (error) {
    next(error);
  }
});

portfoliosRouter.get('/default', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    let portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          name: 'My Collection',
          isPublic: false
        }
      });
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

portfoliosRouter.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: { items: { include: { card: true } } }
    });
    res.json(portfolios);
  } catch (error) {
    next(error);
  }
});

portfoliosRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { card: true } } }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

portfoliosRouter.get('/slug/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { shareSlug: req.params.slug },
      include: { 
        items: { 
          include: { 
            card: {
              include: { prices: { orderBy: { date: 'desc' }, take: 1 } }
            } 
          } 
        } 
      }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    if (!portfolio.isPublic) {
      return res.status(403).json({ error: 'This portfolio is private' });
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

portfoliosRouter.post(
  '/:id/items',
  authenticate,
  [
    body('cardId').notEmpty(),
    body('quantity').optional().isInt({ min: 1 }),
    body('condition').optional().isIn(['MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 'MODERATELY_PLAYED', 'HEAVILY_PLAYED', 'DAMAGED']),
    body('isGraded').optional().isBoolean(),
    body('gradeCompany').optional().isString(),
    body('gradeValue').optional().isFloat({ min: 0, max: 10 }),
    body('purchasePrice').optional().isFloat({ min: 0 }),
    body('purchaseDate').optional().isISO8601(),
    body('notes').optional().isString()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const portfolioId = req.params.id;
      const { 
        cardId, 
        quantity = 1, 
        condition = 'NEAR_MINT', 
        isGraded = false,
        gradeCompany,
        gradeValue,
        purchasePrice,
        purchaseDate,
        notes 
      } = req.body;

      if (gradeValue !== undefined && (gradeValue < 0 || gradeValue > 10)) {
        return res.status(400).json({ error: 'Grade value must be between 0 and 10' });
      }

      const item = await prisma.portfolioItem.create({
        data: {
          portfolioId,
          cardId,
          quantity,
          condition: condition as Condition,
          isGraded,
          gradeCompany,
          gradeValue,
          purchasePrice,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          notes
        }
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

portfoliosRouter.delete('/:id/items/:itemId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.portfolioItem.delete({
      where: { id: req.params.itemId }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

portfoliosRouter.get('/:id/summary', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
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
        }
      }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    let totalCurrentValue = 0;
    let totalCostBasis = 0;

    for (const item of portfolio.items) {
      const currentPrice = item.card.prices[0]?.tcgplayerMarket || 0;
      const itemValue = currentPrice * item.quantity;
      totalCurrentValue += itemValue;

      if (item.purchasePrice) {
        totalCostBasis += item.purchasePrice * item.quantity;
      }
    }

    const gainLoss = totalCurrentValue - totalCostBasis;
    const gainLossPercent = totalCostBasis > 0 
      ? (gainLoss / totalCostBasis) * 100 
      : 0;

    res.json({
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalCostBasis: Math.round(totalCostBasis * 100) / 100,
      gainLoss: Math.round(gainLoss * 100) / 100,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      itemCount: portfolio.items.length
    });
  } catch (error) {
    next(error);
  }
});

export default portfoliosRouter;
