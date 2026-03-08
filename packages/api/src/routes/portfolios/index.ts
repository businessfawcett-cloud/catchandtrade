import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';
import { Condition, GRADE_MULTIPLIERS } from '@catchandtrade/shared';
import type { Grade, GradingService } from '@catchandtrade/shared';
import { authenticate } from '../../middleware/auth';

export const portfoliosRouter = Router();

const VALID_GRADING_SERVICES = Object.keys(GRADE_MULTIPLIERS) as GradingService[];

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
    body('gradingService').optional().isIn(VALID_GRADING_SERVICES),
    body('gradeCompany').optional().isIn(VALID_GRADING_SERVICES),
    body('gradeValue').optional().isInt({ min: 6, max: 10 }),
    body('valuationOverride').optional().isFloat({ min: 0 }),
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
        gradingService,
        gradeCompany,
        gradeValue,
        valuationOverride,
        purchasePrice,
        purchaseDate,
        notes 
      } = req.body;

      const resolvedGradingService = gradingService || gradeCompany || null;

      if (isGraded) {
        if (!resolvedGradingService || !VALID_GRADING_SERVICES.includes(resolvedGradingService as GradingService)) {
          return res.status(400).json({ error: 'A valid grading service is required for graded cards' });
        }
        if (gradeValue == null || gradeValue < 6 || gradeValue > 10) {
          return res.status(400).json({ error: 'Grade value must be between 6 and 10 for graded cards' });
        }
      }

      let resolvedValuationOverride: number | null = valuationOverride ?? null;
      if (
        isGraded &&
        resolvedValuationOverride == null &&
        resolvedGradingService &&
        gradeValue != null
      ) {
        const card = await prisma.card.findUnique({
          where: { id: cardId },
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        });

        const marketPrice = card?.prices[0]?.priceMarket ?? null;
        if (marketPrice != null) {
          const service = resolvedGradingService as GradingService;
          const grade = gradeValue as Grade;
          resolvedValuationOverride = Math.round(marketPrice * GRADE_MULTIPLIERS[service][grade] * 100) / 100;
        }
      }

      const item = await prisma.portfolioItem.create({
        data: {
          portfolioId,
          cardId,
          quantity,
          condition: condition as Condition,
          isGraded,
          gradeCompany: isGraded ? resolvedGradingService : null,
          gradeValue: isGraded ? gradeValue : null,
          valuationOverride: resolvedValuationOverride,
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

portfoliosRouter.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const portfolioId = req.params.id;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId }
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this portfolio' });
    }

    const portfolioCount = await prisma.portfolio.count({
      where: { userId }
    });

    if (portfolioCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete your last portfolio' });
    }

    await prisma.portfolioItem.deleteMany({
      where: { portfolioId }
    });

    await prisma.portfolio.delete({
      where: { id: portfolioId }
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
      const currentPrice = item.card.prices[0]?.priceMarket;
      const effectivePrice = item.valuationOverride ?? currentPrice;
      if (effectivePrice != null) {
        totalCurrentValue += effectivePrice * item.quantity;
      }

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

portfoliosRouter.get('/:id/value', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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

    let totalValue = 0;
    const uniqueCardIds = new Set<string>();

    for (const item of portfolio.items) {
      uniqueCardIds.add(item.cardId);
      const currentPrice = item.card.prices[0]?.priceMarket;
      const effectivePrice = item.valuationOverride ?? currentPrice;
      if (effectivePrice != null) {
        totalValue += effectivePrice * item.quantity;
      }
    }

    res.json({
      totalValue: Math.round(totalValue * 100) / 100,
      cardCount: portfolio.items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueCards: uniqueCardIds.size
    });
  } catch (error) {
    next(error);
  }
});

export default portfoliosRouter;
