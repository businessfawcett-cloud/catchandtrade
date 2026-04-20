import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getUserIdFromToken(token: string): string | null {
  try { return Buffer.from(token, 'base64').toString().split(':')[0] || null; }
  catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    const userId = getUserIdFromToken(authHeader.replace('Bearer ', ''));
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      select: { id: true },
    });

    if (!portfolios.length) {
      return NextResponse.json({ pokemon: [], overview: { totalOwned: 0, uniquePokemon: 0, byType: {} } });
    }

    const items = await prisma.portfolioItem.findMany({
      where: { portfolioId: { in: portfolios.map((p) => p.id) } },
      include: { card: true },
    });

    if (!items.length) {
      return NextResponse.json({ pokemon: [], overview: { totalOwned: 0, uniquePokemon: 0, byType: {} } });
    }

    const pokemonMap = new Map<string, any>();

    for (const item of items) {
      const pokemonName = item.card.name
        .replace(/\s+(EX|VMAX|V|GX|LV\.?\d*|SP|CR|SSR|UR|HR|PR|AR|BR)$/gi, '')
        .trim();

      if (!pokemonMap.has(pokemonName)) {
        pokemonMap.set(pokemonName, { name: pokemonName, cards: [], totalOwned: 0, sets: new Set() });
      }

      const entry = pokemonMap.get(pokemonName);
      entry.cards.push({
        id: item.card.id,
        name: item.card.name,
        setName: item.card.setName,
        setCode: item.card.setCode,
        imageUrl: item.card.imageUrl,
        quantity: item.quantity || 1,
      });
      entry.totalOwned += item.quantity || 1;
      if (item.card.setName) entry.sets.add(item.card.setName);
    }

    const pokemon = Array.from(pokemonMap.values()).map((p) => ({ ...p, sets: Array.from(p.sets) }));

    return NextResponse.json({
      pokemon,
      overview: {
        totalOwned: pokemon.reduce((s, p) => s + p.totalOwned, 0),
        uniquePokemon: pokemon.length,
        totalCards: items.length,
        byType: {},
      },
    });
  } catch (err) {
    console.error('Pokédex overview error:', err);
    return NextResponse.json({ pokemon: [], overview: { totalOwned: 0, uniquePokemon: 0, byType: {} } }, { status: 500 });
  }
}
