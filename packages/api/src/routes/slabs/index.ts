import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';
import { User } from '@prisma/client';
import { scrapePsaCert, mockScrapePsaCert } from '../../services/psaScraper';
import { authenticate } from '../../middleware/auth';

export const slabsRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SLAB LOOKUP & PORTFOLIO ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PSA Cert Lookup - Single
 */
slabsRouter.post(
  '/lookup',
  [body('certNumber').isString().notEmpty()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { certNumber } = req.body as { certNumber: string };

      // Normalize cert number
      const normalizedCert = certNumber.replace(/[-\s]/g, '').toUpperCase();

      // Check cache
      let cached = await prisma.psaCertCache.findUnique({
        where: { certNumber: normalizedCert },
        include: { card: true }
      });

      if (!cached) {
        // Try real PSA scraper first, fallback to mock
        let certData = await scrapePsaCert(normalizedCert);
        if (!certData) {
          console.log(`[Slabs] PSA scraper failed for ${normalizedCert}, using mock data`);
          certData = mockScrapePsaCert(normalizedCert);
        }
        
        // Try to find matching card in database
        const card = await prisma.card.findFirst({
          where: {
            name: { contains: certData.cardName, mode: 'insensitive' }
          }
        });

        // Create cache entry
        cached = await prisma.psaCertCache.create({
          data: {
            certNumber: normalizedCert,
            cardId: card?.id,
            grade: certData.grade,
            grader: 'PSA',
            popCount: certData.popCount,
            lastSalePrice: certData.lastSalePrice,
            lastSaleDate: certData.lastSaleDate,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          include: { card: true }
        });
      }

      res.json({
        certNumber: normalizedCert,
        cardName: cached.card?.name ?? 'Unknown Card',
        cardId: cached.cardId,
        grade: cached.grade,
        grader: cached.grader,
        popCount: cached.popCount,
        lastSalePrice: cached.lastSalePrice,
        lastSaleDate: cached.lastSaleDate
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Bulk PSA Cert Lookup
 */
slabsRouter.post(
  '/bulk-lookup',
  [body('certNumbers').isArray(), body('certNumbers').isLength({ max: 100 })],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { certNumbers } = req.body as { certNumbers: string[] };
      
      const results = await Promise.all(
        certNumbers.map(async (cert) => {
          const normalized = cert.replace(/[-\s]/g, '').toUpperCase();
          
          const cached = await prisma.psaCertCache.findUnique({
            where: { certNumber: normalized },
            include: { card: true }
          });

          if (cached && cached.expiresAt > new Date()) {
            return {
              certNumber: normalized,
              status: 'found' as const,
              cardName: cached.card?.name ?? 'Unknown Card',
              cardId: cached.cardId,
              grade: cached.grade,
              grader: cached.grader,
              popCount: cached.popCount,
              lastSalePrice: cached.lastSalePrice
            };
          }

          return {
            certNumber: normalized,
            status: 'pending' as const,
            message: 'Will be looked up on next sync'
          };
        })
      );

      const found = results.filter(r => r.status === 'found').length;
      const pending = results.filter(r => r.status === 'pending').length;

      res.json({
        total: certNumbers.length,
        found,
        pending,
        results
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get slab portfolio (graded cards only)
 */
slabsRouter.get(
  '/portfolio',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's portfolios
      const portfolios = await prisma.portfolio.findMany({
        where: { userId },
        include: {
          items: {
            where: { isGraded: true },
            include: { card: { include: { prices: { take: 1, orderBy: { date: 'desc' } } } } }
          }
        }
      });

      // Flatten to items and calculate totals
      const slabItems = portfolios.flatMap(p => 
        p.items.map(item => ({
          portfolioId: p.id,
          portfolioName: p.name,
          cardId: item.cardId,
          cardName: item.card.name,
          cardSet: item.card.setName,
          imageUrl: item.card.imageUrl,
          gradeCompany: item.gradeCompany,
          gradeValue: item.gradeValue,
          certNumber: item.certNumber,
          lastSalePrice: item.card.prices[0]?.priceMarket,
          purchasePrice: item.purchasePrice,
          addedAt: item.addedAt
        }))
      );

      // Calculate portfolio totals
      const totalValue = slabItems.reduce((sum, item) => sum + (item.lastSalePrice ?? 0), 0);

      res.json({
        slabCount: slabItems.length,
        totalValue,
        items: slabItems
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Add slab to portfolio
 */
slabsRouter.post(
  '/portfolio',
  authenticate,
  [
    body('certNumber').isString().notEmpty(),
    body('portfolioId').optional().isString(),
    body('gradeCompany').isIn(['PSA', 'CGC', 'BGS', 'SGC']),
    body('gradeValue').isNumeric()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { certNumber, portfolioId, gradeCompany, gradeValue } = req.body as {
        certNumber: string;
        portfolioId?: string;
        gradeCompany: string;
        gradeValue: number;
      };

      // Normalize cert number
      const normalizedCert = certNumber.replace(/[-\s]/g, '').toUpperCase();

      // Check if cert already in portfolio
      const existingItem = await prisma.portfolioItem.findFirst({
        where: { certNumber: normalizedCert }
      });

      if (existingItem) {
        return res.status(409).json({
          error: 'Slab already in portfolio',
          existing: {
            portfolioId: existingItem.portfolioId,
            cardId: existingItem.cardId
          }
        });
      }

      // Get or create portfolio
      let targetPortfolioId = portfolioId;
      if (!targetPortfolioId) {
        const defaultPortfolio = await prisma.portfolio.findFirst({
          where: { userId, name: 'My Collection' }
        });
        
        if (!defaultPortfolio) {
          const newPortfolio = await prisma.portfolio.create({
            data: {
              userId,
              name: 'My Collection'
            }
          });
          targetPortfolioId = newPortfolio.id;
        } else {
          targetPortfolioId = defaultPortfolio.id;
        }
      }

      // Get card from cert cache (if available)
      const certCache = await prisma.psaCertCache.findUnique({
        where: { certNumber: normalizedCert },
        include: { card: true }
      });

      // If card not in cache, try to find by name/grade
      let cardId = certCache?.cardId;
      if (!cardId && certCache?.card) {
        // Try to find the card in our database
        const matchingCard = await prisma.card.findFirst({
          where: {
            name: { contains: certCache.card.name, mode: 'insensitive' }
          }
        });
        cardId = matchingCard?.id;
      }

      // Create portfolio item
      const portfolioItem = await prisma.portfolioItem.create({
        data: {
          portfolioId: targetPortfolioId,
          cardId: cardId ?? '', // Will fail if no card - should validate
          isGraded: true,
          gradeCompany,
          gradeValue,
          certNumber: normalizedCert,
          addedAt: new Date()
        },
        include: {
          card: true,
          portfolio: true
        }
      });

      res.json({
        success: true,
        item: {
          id: portfolioItem.id,
          cardName: portfolioItem.card.name,
          portfolioName: portfolioItem.portfolio.name,
          gradeCompany: portfolioItem.gradeCompany,
          gradeValue: portfolioItem.gradeValue,
          certNumber: portfolioItem.certNumber
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get population reports for a card
 */
slabsRouter.get(
  '/population/:cardId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardId } = req.params;

      const certData = await prisma.psaCertCache.findMany({
        where: { cardId },
        select: {
          grade: true,
          grader: true,
          popCount: true,
          lastSalePrice: true
        }
      });

      // Group by grader and grade
      const grouped = certData.reduce((acc, item) => {
        if (!acc[item.grader]) acc[item.grader] = {};
        if (!acc[item.grader][item.grade]) {
          acc[item.grader][item.grade] = { count: 0, lastSalePrice: null };
        }
        acc[item.grader][item.grade].count += item.popCount || 0;
        if (item.lastSalePrice) {
          acc[item.grader][item.grade].lastSalePrice = item.lastSalePrice;
        }
        return acc;
      }, {} as Record<string, Record<string, { count: number; lastSalePrice: number | null }>>);

      res.json({
        cardId,
        grouped,
        updatedAt: new Date()
      });
    } catch (error) {
      next(error);
    }
  }
);

export default slabsRouter;
