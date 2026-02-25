import { prisma } from '@catchandtrade/db';
import { TCGPlayerFetcher } from './tcgplayer';

export interface AggregatedPrice {
  tcgplayerLow: number | null;
  tcgplayerMid: number | null;
  tcgplayerHigh: number | null;
  tcgplayerMarket: number | null;
  ebayAvg: number | null;
  priceCharting: number | null;
  consensusPrice: number | null;
}

export interface PriceHistory {
  date: Date;
  tcgplayerMarket: number | null;
  expectedValue?: number;
}

export interface ExpectedValueResult {
  expectedValue: number;
  trend: 'rising' | 'falling' | 'stable';
}

export class PriceAggregator {
  private tcgFetcher: TCGPlayerFetcher;

  constructor() {
    this.tcgFetcher = new TCGPlayerFetcher();
  }

  async aggregate(prices: {
    tcgplayerMarket?: number | null;
    ebayAvg?: number | null;
    priceCharting?: number | null;
  }): Promise<AggregatedPrice> {
    const sources: number[] = [];
    if (prices.tcgplayerMarket) sources.push(prices.tcgplayerMarket);
    if (prices.ebayAvg) sources.push(prices.ebayAvg);
    if (prices.priceCharting) sources.push(prices.priceCharting);

    const consensusPrice = sources.length > 0
      ? sources.reduce((a, b) => a + b, 0) / sources.length
      : null;

    return {
      tcgplayerLow: null,
      tcgplayerMid: null,
      tcgplayerHigh: null,
      tcgplayerMarket: prices.tcgplayerMarket || null,
      ebayAvg: prices.ebayAvg || null,
      priceCharting: prices.priceCharting || null,
      consensusPrice: consensusPrice ? Math.round(consensusPrice * 100) / 100 : null
    };
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
        expectedValue: prices[0]?.tcgplayerMarket || 0,
        trend: 'stable'
      };
    }

    const values = prices.map(p => p.tcgplayerMarket).filter((v): v is number => v !== null);
    
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
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card?.tcgplayerId) return;

    const tcgPrice = await this.tcgFetcher.fetch(card.tcgplayerId);

    await prisma.cardPrice.create({
      data: {
        cardId,
        tcgplayerLow: tcgPrice.low,
        tcgplayerMid: tcgPrice.mid,
        tcgplayerHigh: tcgPrice.high,
        tcgplayerMarket: tcgPrice.market
      }
    });
  }
}

export default PriceAggregator;
