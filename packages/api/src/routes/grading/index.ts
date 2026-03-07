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

export const gradingRouter = Router();

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
      const multiplier = GRADE_MULTIPLIERS[service][gradeKey];
      const gradingFee = GRADING_FEES[service][tier];
      const turnaround = GRADING_TURNAROUND[service][tier];

      const gradedValue = rawPrice * multiplier;
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
        verdictText = '⚠️ Marginal — only if near mint';
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
        verdictColor
      });
    } catch (error) {
      next(error);
    }
  }
);

export default gradingRouter;
