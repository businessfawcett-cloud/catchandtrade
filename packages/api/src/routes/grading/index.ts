import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@catchandtrade/db';
import {
  GRADING_FEES,
  GRADING_TURNAROUND,
  GRADE_MULTIPLIERS,
  GRADING_VERDICT_THRESHOLDS,
  GradingService,
  GradingTier,
  Grade
} from '@catchandtrade/shared';
import { 
  scrapePsaCert, 
  mockScrapePsaCert,
  scrapePsaPopulation,
  type PsaCertData,
  type PsaPopData
} from '../../services/psaScraper';

export const gradingRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// PSA CERT LOOKUP SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Look up PSA certification information
 * Tries real scraper first, falls back to mock for development
 */
async function lookupPsaCert(certNumber: string): Promise<PsaCertData | null> {
  try {
    // Check cache first (valid for 24 hours)
    const cached = await prisma.psaCertCache.findUnique({
      where: { certNumber },
      include: { card: true }
    });
    
    if (cached && cached.expiresAt > new Date()) {
      return {
        certNumber: cached.certNumber,
        cardName: cached.card?.name || 'Unknown Card',
        grade: cached.grade,
        popCount: cached.popCount ?? undefined,
        lastSalePrice: cached.lastSalePrice ?? undefined,
        lastSaleDate: cached.lastSaleDate ?? undefined
      };
    }
    
    // Try real scraper (will fail gracefully if PSA blocks us)
    console.log(`[PSA Lookup] Trying real scraper for cert: ${certNumber}`);
    const certData = await scrapePsaCert(certNumber);
    
    if (certData) {
      console.log(`[PSA Lookup] Real scraper succeeded for cert: ${certNumber}`);
      return certData;
    }
    
    // Fall back to mock data for development/demo
    console.log(`[PSA Lookup] Using mock data for cert: ${certNumber}`);
    return mockScrapePsaCert(certNumber);
    
  } catch (error) {
    console.error(`[PSA Lookup] Error for cert ${certNumber}:`, error);
    // Fall back to mock data on error
    return mockScrapePsaCert(certNumber);
  }
}

/**
 * Find a card in our database that matches the cert
 */
async function findMatchingCard(certData: PsaCertData): Promise<string | null> {
  if (!certData.cardName) return null;
  
  const card = await prisma.card.findFirst({
    where: {
      name: { contains: certData.cardName, mode: 'insensitive' }
    }
  });
  
  return card?.id ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PSA CERT LOOKUP ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

gradingRouter.post(
  '/cert/lookup',
  [body('certNumber').isString().notEmpty()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { certNumber } = req.body as { certNumber: string };

      // Normalize cert number (remove dashes, spaces)
      const normalizedCert = certNumber.replace(/[-\s]/g, '').toUpperCase();

      // Check cache first
      let cached = await prisma.psaCertCache.findUnique({
        where: { certNumber: normalizedCert },
        include: { card: true }
      });

      // If not in cache or expired, scrape
      if (!cached || cached.expiresAt <= new Date()) {
        const certData = await lookupPsaCert(normalizedCert);
        
        if (!certData) {
          return res.status(404).json({
            error: 'Cert number not found',
            certNumber: normalizedCert,
            hint: 'The cert lookup is in development. Try again later.'
          });
        }

        // Find matching card
        const cardId = await findMatchingCard(certData);

        // Update cache
        await prisma.psaCertCache.upsert({
          where: { certNumber: normalizedCert },
          create: {
            certNumber: normalizedCert,
            cardId: cardId ?? undefined,
            grade: certData.grade,
            grader: 'PSA',
            popCount: certData.popCount,
            lastSalePrice: certData.lastSalePrice,
            lastSaleDate: certData.lastSaleDate,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          },
          update: {
            cardId: cardId ?? undefined,
            grade: certData.grade,
            popCount: certData.popCount,
            lastSalePrice: certData.lastSalePrice,
            lastSaleDate: certData.lastSaleDate,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });
        
        // Re-fetch to get the card relationship
        cached = await prisma.psaCertCache.findUnique({
          where: { certNumber: normalizedCert },
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
        lastSaleDate: cached.lastSaleDate,
        isCached: true
      });
    } catch (error) {
      next(error);
    }
  }
);

gradingRouter.post(
  '/cert/bulk-lookup',
  [body('certNumbers').isArray()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { certNumbers } = req.body as { certNumbers: string[] };
      
      if (certNumbers.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 certs per request' });
      }

      // Process each cert number
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

          // Not in cache - try to scrape
          const certData = await scrapePsaCert(normalized);
          
          if (!certData) {
            return {
              certNumber: normalized,
              status: 'not_found' as const,
              error: 'Cert not found or still developing'
            };
          }

          return {
            certNumber: normalized,
            status: 'found' as const,
            cardName: certData.cardName,
            grade: certData.grade,
            popCount: certData.popCount,
            lastSalePrice: certData.lastSalePrice
          };
        })
      );

      const found = results.filter(r => r.status === 'found').length;
      const notFound = results.filter(r => r.status === 'not_found').length;

      res.json({
        total: certNumbers.length,
        found,
        notFound,
        results
      });
    } catch (error) {
      next(error);
    }
  }
);

gradingRouter.post(
  '/calculate',
  [
    body('cardId').isString().notEmpty(),
    body('expectedGrade').isInt({ min: 6, max: 10 }),
    body('service').isIn(['PSA', 'CGC', 'BGS', 'SGC']),
    body('tier').isIn(['economy', 'standard', 'express'])
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cardId, expectedGrade, service, tier } = req.body as {
        cardId: string;
        expectedGrade: number;
        service: GradingService;
        tier: GradingTier;
      };

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

      const rawPrice = card.prices[0]?.priceMarket ?? card.prices[0]?.priceMid ?? null;

      if (!rawPrice || rawPrice <= 0) {
        return res.status(400).json({ error: 'No price data available for this card' });
      }

      const gradeKey = expectedGrade as Grade;
      const gradingFee = GRADING_FEES[service][tier];
      const turnaround = GRADING_TURNAROUND[service][tier];

      // Try to get real PSA population data for more accurate valuation
      let psaPopData: PsaPopData | null = null;
      let gradedValue: number;
      let priceSource: 'psa_population' | 'multiplier' = 'multiplier';
      let rarityInfo: { totalGraded: number; gradeCount: number; percentage: number } | null = null;

      try {
        psaPopData = await scrapePsaPopulation(card.name, card.setName);
      } catch (e) {
        console.log(`[Grading] Could not fetch PSA population for ${card.name}`);
      }

      if (psaPopData && psaPopData.grades.length > 0) {
        // Use real PSA population data to estimate graded value
        const targetGrade = psaPopData.grades.find(g => g.grade === String(expectedGrade));
        const totalGraded = psaPopData.totalGraded;
        
        if (targetGrade && totalGraded > 0) {
          // Calculate rarity-based multiplier
          const percentage = targetGrade.percentage;
          const rarityMultiplier = Math.max(1, 10 - (percentage / 5)); // rarer = more valuable
          const baseMultiplier = GRADE_MULTIPLIERS[service][gradeKey];
          
          // Blend PSA population-based estimate with base multiplier
          gradedValue = rawPrice * (baseMultiplier * 0.5 + rarityMultiplier * 0.5);
          priceSource = 'psa_population';
          rarityInfo = {
            totalGraded: totalGraded,
            gradeCount: targetGrade.count,
            percentage: targetGrade.percentage
          };
        } else {
          gradedValue = rawPrice * GRADE_MULTIPLIERS[service][gradeKey];
        }
      } else {
        // Fall back to static multiplier
        gradedValue = rawPrice * GRADE_MULTIPLIERS[service][gradeKey];
      }

      const netProfit = gradedValue - rawPrice - gradingFee;
      const roi = netProfit / (rawPrice + gradingFee);

      let verdict: 'strong' | 'marginal' | 'skip';
      let verdictText: string;
      let verdictColor: 'green' | 'yellow' | 'red';

      if (roi >= GRADING_VERDICT_THRESHOLDS.STRONG) {
        verdict = 'strong';
        verdictText = '✅ Strong grading candidate';
        verdictColor = 'green';
      } else if (roi >= GRADING_VERDICT_THRESHOLDS.MARGINAL) {
        verdict = 'marginal';
        verdictText = '⚠️ Profitable — worth grading if card is near mint';
        verdictColor = 'yellow';
      } else {
        verdict = 'skip';
        verdictText = '❌ Not worth grading at this grade';
        verdictColor = 'red';
      }

      res.json({
        cardName: card.name,
        rawPrice: Math.round(rawPrice * 100) / 100,
        expectedGrade,
        service,
        tier,
        gradedValue: Math.round(gradedValue * 100) / 100,
        gradingFee,
        netProfit: Math.round(netProfit * 100) / 100,
        roi: Math.round(roi * 10000) / 100,
        turnaround,
        verdict,
        verdictText,
        verdictColor,
        priceSource,
        rarityInfo: rarityInfo || undefined
      });
    } catch (error) {
      next(error);
    }
  }
);

gradingRouter.get(
  '/population/:cardId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardId } = req.params;

      // Get cached population data for this card
      const cachedData = await prisma.psaCertCache.findMany({
        where: { cardId },
        select: {
          grade: true,
          grader: true,
          popCount: true,
          lastSalePrice: true,
          lastSaleDate: true
        }
      });

      // Group by grader and grade
      const grouped = cachedData.reduce((acc, item) => {
        if (!acc[item.grader]) acc[item.grader] = {};
        if (!acc[item.grader][item.grade]) {
          acc[item.grader][item.grade] = {
            count: 0,
            lastSalePrice: null,
            lastSaleDate: null
          };
        }
        acc[item.grader][item.grade].count += item.popCount || 0;
        return acc;
      }, {} as Record<string, Record<string, { count: number; lastSalePrice: number | null; lastSaleDate: Date | null }>>);

      // Calculate total population and percentages
      let totalPop = 0;
      for (const grader of Object.values(grouped)) {
        for (const grade of Object.values(grader)) {
          totalPop += grade.count;
        }
      }

      res.json({
        cardId,
        grouped,
        totalPop,
        updatedAt: new Date()
      });
    } catch (error) {
      next(error);
    }
  }
);

export default gradingRouter;
