import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@catchandtrade/db';
import { PriceAggregator } from '../../services/pricing/aggregator';

export const pricingRouter = Router();
const aggregator = new PriceAggregator();

pricingRouter.get('/cards/:id/prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cardId = req.params.id;
    const days = parseInt(req.query.days as string) || 90;

    const history = await prisma.cardPrice.findMany({
      where: {
        cardId,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        priceMarket: true,
        priceLow: true,
        priceMid: true,
        priceHigh: true,
        ebaySoldAvg: true,
        ebayBuyNowLow: true,
        priceChartingValue: true,
        lastUpdated: true,
        isStale: true,
        listingCount: true
      }
    });

    const expectedValueResult = await aggregator.calculateExpectedValue(cardId);

    res.json({
      history: history.map(h => ({
        date: h.date,
        priceMarket: h.priceMarket,
        priceLow: h.priceLow,
        priceMid: h.priceMid,
        priceHigh: h.priceHigh,
        ebaySoldAvg: h.ebaySoldAvg,
        ebayBuyNowLow: h.ebayBuyNowLow,
        priceChartingValue: h.priceChartingValue,
        lastUpdated: h.lastUpdated,
        isStale: h.isStale,
        listingCount: h.listingCount
      })),
      expectedValue: expectedValueResult.expectedValue,
      trend: expectedValueResult.trend
    });
  } catch (error) {
    next(error);
  }
});

pricingRouter.post('/cards/:id/snapshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cardId = req.params.id;
    await aggregator.snapshotPrices(cardId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default pricingRouter;
