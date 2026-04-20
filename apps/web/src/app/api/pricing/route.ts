import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const setCode = searchParams.get('setCode');
    const prices: any = {};

    if (cardId) {
      const cardPrices = await prisma.cardPrice.findMany({
        where: { cardId },
        orderBy: { date: 'desc' },
        take: 90,
      });

      if (cardPrices.length) {
        prices.database = cardPrices.map((p) => ({
          low: p.priceLow, mid: p.priceMid, high: p.priceHigh, market: p.priceMarket, date: p.date,
        }));
      }

      const card = await prisma.card.findUnique({ where: { id: cardId }, select: { pokemonTcgId: true } });
      if (card?.pokemonTcgId && POKEMON_TCG_API_KEY) {
        try {
          const response = await fetch(`${POKEMON_TCG_API_URL}/cards/${card.pokemonTcgId}`, {
            headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.data?.tcgplayer?.prices) prices.tcgplayer = data.data.tcgplayer.prices;
          }
        } catch {}
      }
    }

    if (setCode) {
      const setCards = await prisma.card.findMany({
        where: { setCode: setCode.toLowerCase() },
        select: { id: true, name: true, setCode: true, cardNumber: true },
        take: 10,
      });

      if (setCards.length) {
        const cardIds = setCards.map((c) => c.id);
        const latestPrices = await prisma.cardPrice.findMany({
          where: { cardId: { in: cardIds } },
          orderBy: { date: 'desc' },
          select: { cardId: true, priceMarket: true },
        });

        const priceMap = new Map<string, number | null>();
        for (const p of latestPrices) {
          if (!priceMap.has(p.cardId)) priceMap.set(p.cardId, p.priceMarket);
        }

        prices.setAverages = setCards.map((c) => ({ ...c, price: priceMap.get(c.id) || null }));
      }
    }

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in pricing GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cardId, price } = await request.json();
    if (!cardId || !price) return NextResponse.json({ error: 'cardId and price required' }, { status: 400 });

    await prisma.cardPrice.create({
      data: {
        cardId,
        priceLow: price.low,
        priceMid: price.mid,
        priceHigh: price.high,
        priceMarket: price.market,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in pricing POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
