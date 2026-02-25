import Fuse from 'fuse.js';
import { prisma } from '@catchandtrade/db';

export interface CardMatchInput {
  cardName: string;
  cardNumber?: string;
  gameType?: string;
}

export interface CardMatchResult {
  card: {
    id: string;
    name: string;
    setCode: string;
    cardNumber: string;
  };
  confidence: number;
  candidates?: Array<{
    id: string;
    name: string;
    setCode: string;
    cardNumber: string;
  }>;
}

export class CardMatcher {
  private fuse: Fuse<any> | null = null;

  async match(input: CardMatchInput): Promise<CardMatchResult | null> {
    const cards = await prisma.card.findMany({
      where: input.gameType ? { gameType: input.gameType as any } : undefined,
      take: 1000
    });

    if (cards.length === 0) {
      return null;
    }

    const fuse = new Fuse(cards, {
      keys: ['name', 'setName', 'setCode'],
      threshold: 0.4,
      includeScore: true
    });

    const results = fuse.search(input.cardName);

    if (results.length === 0) {
      return null;
    }

    const bestMatch = results[0];
    const confidence = 1 - (bestMatch.score || 0);

    const candidates = results.slice(0, 5).map(r => ({
      id: r.item.id,
      name: r.item.name,
      setCode: r.item.setCode,
      cardNumber: r.item.cardNumber
    }));

    return {
      card: {
        id: bestMatch.item.id,
        name: bestMatch.item.name,
        setCode: bestMatch.item.setCode,
        cardNumber: bestMatch.item.cardNumber
      },
      confidence,
      candidates: candidates.length > 1 ? candidates : undefined
    };
  }
}

export default CardMatcher;
