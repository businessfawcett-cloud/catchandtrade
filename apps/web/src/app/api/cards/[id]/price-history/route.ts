import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || 'a3751a33-9ed6-4662-9ae3-870939002fcc';
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockPriceHistory(cardId: string, currentPrice: number | null, days: number) {
  const basePrice = currentPrice || 50;
  const seed = cardId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const trendDir = seed % 2 === 0 ? 1 : -1;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const variance = (seededRandom(seed + i) - 0.5) * 0.1;
    const trend = trendDir * i / days * 0.05;
    return {
      date: date.toISOString().split('T')[0],
      price: Math.max(1, Math.round(basePrice * (1 + variance + trend) * 100) / 100),
    };
  });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    const card = await prisma.card.findUnique({
      where: { id: params.id },
      select: { id: true, pokemonTcgId: true, name: true, setCode: true },
    });

    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const dbPrices = await prisma.cardPrice.findMany({
      where: { cardId: params.id },
      orderBy: { date: 'asc' },
      take: 90,
      select: { priceMarket: true, date: true },
    });

    let data: { date: string; price: number }[];
    let hasRealData = false;

    if (dbPrices.length > 0) {
      hasRealData = true;
      data = dbPrices.map((p) => ({
        date: p.date.toISOString().split('T')[0],
        price: p.priceMarket || 0,
      }));
    } else if (card.pokemonTcgId) {
      try {
        const response = await fetch(`${POKEMON_TCG_API_URL}/cards/${card.pokemonTcgId}`, {
          headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
        });
        if (response.ok) {
          const tcgData = await response.json();
          const prices = tcgData.data?.tcgplayer?.prices;
          const variant: any = prices ? Object.values(prices)[0] : null;
          const currentPrice = variant?.market || variant?.mid || null;
          data = generateMockPriceHistory(params.id, currentPrice, period);
          hasRealData = !!currentPrice;
        } else {
          data = generateMockPriceHistory(params.id, null, period);
        }
      } catch {
        data = generateMockPriceHistory(params.id, null, period);
      }
    } else {
      data = generateMockPriceHistory(params.id, null, period);
    }

    const latest = data[data.length - 1];
    const oldest = data[0];
    const change = oldest?.price ? (((latest.price - oldest.price) / oldest.price) * 100).toFixed(2) : '0.00';

    return NextResponse.json({ data, currentPrice: latest.price, change, hasRealData });
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
