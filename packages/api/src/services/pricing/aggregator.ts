import { prisma } from '@catchandtrade/db';
import EbayPriceFetcher, { BudgetTracker, type CalculatedPrices } from './ebay';

export interface AggregatedPrice {
  priceLow: number | null;
  priceMid: number | null;
  priceHigh: number | null;
  priceMarket: number | null;
  ebayBuyNowLow: number | null;
  ebaySoldAvg: number | null;
  priceCharting: number | null;
  lastUpdated: Date | null;
  isStale: boolean;
  listingCount: number;
}

export interface ExpectedValueResult {
  expectedValue: number;
  trend: 'rising' | 'falling' | 'stable';
}

export class PriceAggregator {
  private ebayFetcher: EbayPriceFetcher;
  private budgetTracker: BudgetTracker;

  constructor() {
    this.ebayFetcher = new EbayPriceFetcher();
    this.budgetTracker = new BudgetTracker();
  }

  async calculateExpectedValue(cardId: string): Promise<ExpectedValueResult> {
    const prices = await prisma.cardPrice.findMany({
      where: {
        cardId,
        date: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'asc' }
    });

    if (prices.length < 2) {
      return {
        expectedValue: prices[0]?.priceMarket || 0,
        trend: 'stable'
      };
    }

    const values = prices.map(p => p.priceMarket).filter((v): v is number => v !== null);

    if (values.length < 2) {
      return {
        expectedValue: values[0] || 0,
        trend: 'stable'
      };
    }

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const expectedValue = Math.max(0, Math.round(intercept * 100) / 100);

    let trend: 'rising' | 'falling' | 'stable';
    if (slope > 0.5) {
      trend = 'rising';
    } else if (slope < -0.5) {
      trend = 'falling';
    } else {
      trend = 'stable';
    }

    return { expectedValue, trend };
  }

  async snapshotPrices(cardId: string): Promise<void> {
    if (!this.budgetTracker.canMakeCall(true)) {
      console.log('Daily budget exhausted, skipping on-demand snapshot');
      return;
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { set: true }
    });
    if (!card?.set) return;

    const listings = await this.ebayFetcher.searchByCard(card.set.name, card.cardNumber);
    this.budgetTracker.recordCall();

    const matched = this.ebayFetcher.matchListingsToCards(
      listings,
      [{ id: card.id, cardNumber: card.cardNumber }]
    );

    const cardListings = matched.get(card.id) || [];
    const calculated = this.ebayFetcher.calculatePrices(cardListings);
    const now = new Date();

    await prisma.cardPrice.create({
      data: {
        cardId,
        priceLow: calculated.priceLow,
        priceMid: calculated.priceMid,
        priceHigh: calculated.priceHigh,
        priceMarket: calculated.priceMarket,
        ebayBuyNowLow: calculated.ebayBuyNowLow,
        lastUpdated: now,
        isStale: false,
        listingCount: calculated.listingCount,
      }
    });

    // Also record in price history
    if (calculated.priceMarket !== null) {
      await prisma.priceHistory.create({
        data: {
          cardId,
          price: calculated.priceMarket,
          source: 'ebay',
        }
      });
    }
  }
}

export default PriceAggregator;
